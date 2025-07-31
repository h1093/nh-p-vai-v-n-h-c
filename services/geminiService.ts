import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL, getSystemInstructionWithContext } from "../constants";
import { LorebookEntry, AffinityUpdate, Item, Equipment, ItemUpdate, Work, CharacterData, AITypeKey } from "../types";

export interface StorySegmentResult {
  narrative: string;
  speaker: string;
  aiType: AITypeKey;
  suggestedActions: string[];
  worldStateChanges: {
    affinityUpdates: AffinityUpdate[];
    itemUpdates: ItemUpdate[];
    companions: string[];
    datingUpdate?: { partnerName: string };
    marriageUpdate?: { spouseName: string };
    pregnancyUpdate?: { partnerName: string };
    offScreenWorldUpdate: string;
    timePassed: number;
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(apiCall: () => Promise<T>): Promise<T> {
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error: any) {
            lastError = error;
            
            const errorString = JSON.stringify(error).toLowerCase();
            const isRateLimitError = errorString.includes('429') || errorString.includes('rate limit') || errorString.includes('resource_exhausted');

            if (isRateLimitError && attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                console.warn(`Rate limit exceeded. Retrying in ${delay}ms...`);
                await sleep(delay);
            } else {
                console.error("API call failed after multiple retries:", lastError);
                throw lastError;
            }
        }
    }
    throw lastError;
}

const worldSchema = {
  type: Type.OBJECT,
  properties: {
    affinityUpdates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          npcName: { type: Type.STRING },
          change: { type: Type.INTEGER },
          reason: { type: Type.STRING }
        },
        required: ["npcName", "change", "reason"]
      }
    },
    itemUpdates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ["add", "remove"] },
          item: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["equipment", "consumable", "key"] }
            },
            required: ["name", "description", "type"]
          }
        },
        required: ["action", "item"]
      }
    },
    companions: { type: Type.ARRAY, items: { type: Type.STRING } },
    datingUpdate: { type: Type.OBJECT, properties: { partnerName: { type: Type.STRING } } },
    marriageUpdate: { type: Type.OBJECT, properties: { spouseName: { type: Type.STRING } } },
    pregnancyUpdate: { type: Type.OBJECT, properties: { partnerName: { type: Type.STRING } } },
    offScreenWorldUpdate: { type: Type.STRING },
    timePassed: { type: Type.INTEGER }
  }
};

const storytellerSchema = {
    type: Type.OBJECT,
    properties: {
        narrative: { type: Type.STRING, description: "Phần tường thuật chính của câu chuyện." },
        suggestedActions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 gợi ý hành động tiếp theo cho người chơi." }
    },
    required: ["narrative", "suggestedActions"]
};

const characterSchema = {
    type: Type.OBJECT,
    properties: {
        dialogue: { type: Type.STRING, description: "Lời thoại của nhân vật." }
    },
    required: ["dialogue"]
};

export async function generateStorySegment(
    ai: GoogleGenAI,
    prompt: string,
    work: Work,
    character: CharacterData,
    lorebook: LorebookEntry[],
    inventory: Item[],
    equipment: Equipment,
    spouse: string | null,
    dating: string | null,
    pregnancy: { partnerName: string; conceptionTime: number } | null,
    gameTime: number,
    previousWorldUpdate: string | null,
    isNsfwEnabled: boolean,
    setActiveAI: (ai: AITypeKey | null) => void
): Promise<StorySegmentResult> {
    
    const turnSummary = `Hành động của người chơi: "${prompt}".\nSự kiện gần đây: ${previousWorldUpdate || "Không có."}`;

    // 1. World AI
    setActiveAI('World');
    const worldSystemInstruction = getSystemInstructionWithContext(work.worldSystemInstruction, character, lorebook, inventory, equipment, spouse, dating, pregnancy, gameTime, isNsfwEnabled);
    const worldResponse = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: turnSummary,
        config: { systemInstruction: worldSystemInstruction, responseMimeType: "application/json", responseSchema: worldSchema }
    }));
    const worldJson = JSON.parse(worldResponse.text.trim());
    
    // 2. Storyteller AI
    setActiveAI('Storyteller');
    const storytellerSystemInstruction = getSystemInstructionWithContext(work.storytellerSystemInstruction, character, lorebook, inventory, equipment, spouse, dating, pregnancy, gameTime, isNsfwEnabled);
    const storytellerPrompt = `Hành động của người chơi: "${prompt}".\nCập nhật thế giới ngoài màn hình: "${worldJson.offScreenWorldUpdate || 'Không có.'}"`;
    const storytellerResponse = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: storytellerPrompt,
        config: { systemInstruction: storytellerSystemInstruction, responseMimeType: "application/json", responseSchema: storytellerSchema }
    }));
    const storytellerJson = JSON.parse(storytellerResponse.text.trim());
    let narrative = storytellerJson.narrative;
    const suggestedActions = storytellerJson.suggestedActions;

    // 3. Character AI (if needed)
    const dialoguePlaceholders = narrative.match(/\[DIALOGUE:"(.*?)"\]/g) || [];
    let finalSpeaker = "Người dẫn chuyện";
    let finalAiType: AITypeKey = 'Storyteller';

    if (dialoguePlaceholders.length > 0) {
        setActiveAI('Character');
        const characterSystemInstruction = getSystemInstructionWithContext(work.characterSystemInstruction, character, lorebook, inventory, equipment, spouse, dating, pregnancy, gameTime, isNsfwEnabled);
        
        for (const placeholder of dialoguePlaceholders) {
            const npcNameMatch = placeholder.match(/\[DIALOGUE:"(.*?)"\]/);
            if (npcNameMatch && npcNameMatch[1]) {
                const npcName = npcNameMatch[1];
                finalSpeaker = npcName;
                finalAiType = 'Character';

                const characterPrompt = `Trong bối cảnh sau đây, hãy viết lời thoại cho nhân vật ${npcName}:\n\n${narrative}`;
                const characterResponse = await withRetry(() => ai.models.generateContent({
                    model: GEMINI_MODEL,
                    contents: characterPrompt,
                    config: { systemInstruction: characterSystemInstruction, responseMimeType: "application/json", responseSchema: characterSchema }
                }));
                const characterJson = JSON.parse(characterResponse.text.trim());
                narrative = narrative.replace(placeholder, characterJson.dialogue);
            }
        }
    }
    
    setActiveAI(null);

    return {
        narrative,
        speaker: finalSpeaker,
        aiType: finalAiType,
        suggestedActions,
        worldStateChanges: worldJson
    };
}