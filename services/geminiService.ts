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
    lorebookEntriesToDelete?: string[];
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
    lorebookEntriesToDelete: {
      type: Type.ARRAY,
      description: "Một danh sách các ID của các mục trong Sổ tay (Lorebook) đã lỗi thời, không còn liên quan hoặc không chính xác nữa và cần được xóa.",
      items: {
        type: Type.STRING,
        description: "ID của một mục Sổ tay cần xóa."
      }
    },
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

const entityExtractionSchema = {
    type: Type.OBJECT,
    properties: {
        entities: {
            type: Type.ARRAY,
            description: "Danh sách các thực thể được trích xuất.",
            items: {
                type: Type.OBJECT,
                properties: {
                    key: {
                        type: Type.STRING,
                        description: "Tên của thực thể (nhân vật, địa điểm, vật phẩm, v.v.)."
                    },
                    value: {
                        type: Type.STRING,
                        description: "Một mô tả ngắn gọn, một câu về thực thể dựa trên văn bản."
                    }
                },
                required: ["key", "value"]
            }
        }
    },
    required: ["entities"]
};

export async function extractEntitiesFromText(
    ai: GoogleGenAI,
    narrativeText: string,
    existingLore: LorebookEntry[],
    character: CharacterData
): Promise<Array<{key: string, value: string}>> {
    const systemInstruction = `Bạn là một trợ lý AI cho một game nhập vai dựa trên văn bản. Nhiệm vụ của bạn là đọc một đoạn tường thuật và trích xuất các thực thể quan trọng, MỚI (nhân vật, địa điểm, vật phẩm, khái niệm) để đề xuất cho Sổ tay (Lorebook) của trò chơi.

QUY TẮC CỐT LÕI:
1.  **Chỉ trích xuất thực thể MỚI:** So sánh với 'Tên người chơi' và 'Các khóa Sổ tay đã có'. Bất kỳ thực thể nào đã tồn tại trong các danh sách đó phải được BỎ QUA.
2.  **Một câu mô tả:** Cung cấp một mô tả ngắn gọn (một câu) cho mỗi thực thể, chỉ dựa trên thông tin trong đoạn văn.
3.  **Định dạng JSON:** Luôn trả về kết quả dưới dạng JSON theo schema đã cho. Nếu không có thực thể mới nào, trả về một danh sách 'entities' rỗng.

Tên người chơi (phải bỏ qua): "${character.name}"
Các khóa Sổ tay đã có (phải bỏ qua): [${existingLore.map(e => `"${e.key}"`).join(', ')}]

VÍ DỤ:
-   **Đoạn văn:** "Chí Phèo bước vào quán rượu của bà Ba, một người đàn bà góa nổi tiếng khó tính. Hắn gọi một chai rượu và nhìn ra con đường làng quen thuộc."
-   **Sổ tay đã có:** ["Chí Phèo", "con đường làng"]
-   **Kết quả đúng:**
    \`\`\`json
    {
      "entities": [
        {
          "key": "bà Ba",
          "value": "Chủ quán rượu, là một người đàn bà góa nổi tiếng khó tính."
        },
        {
          "key": "quán rượu của bà Ba",
          "value": "Nơi Chí Phèo bước vào để gọi rượu."
        }
      ]
    }
    \`\`\`
-   **Giải thích:** "Chí Phèo" và "con đường làng" bị bỏ qua vì đã có trong Sổ tay. "bà Ba" và "quán rượu của bà Ba" là mới và được trích xuất.
`;

    const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Đây là đoạn văn tường thuật để phân tích:\n\n---\n${narrativeText}\n---`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: entityExtractionSchema
        }
    }));

    try {
        const result = JSON.parse(response.text.trim());
        return result.entities || [];
    } catch (e) {
        console.error("Lỗi phân tích phản hồi trích xuất thực thể:", response.text, e);
        return [];
    }
}

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
    
    let worldJson;
    try {
        worldJson = JSON.parse(worldResponse.text.trim());
    } catch (e: any) {
        console.error("Lỗi phân tích JSON từ World-Smith:", worldResponse.text);
        throw new Error(`Lỗi phân tích JSON từ AI Quản lý Thế giới: ${e.message}`);
    }
    
    // 2. Storyteller AI
    setActiveAI('Storyteller');
    const storytellerSystemInstruction = getSystemInstructionWithContext(work.storytellerSystemInstruction, character, lorebook, inventory, equipment, spouse, dating, pregnancy, gameTime, isNsfwEnabled);
    const storytellerPrompt = `Hành động của người chơi: "${prompt}".\nCập nhật thế giới ngoài màn hình: "${worldJson.offScreenWorldUpdate || 'Không có.'}"`;
    const storytellerResponse = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: storytellerPrompt,
        config: { systemInstruction: storytellerSystemInstruction, responseMimeType: "application/json", responseSchema: storytellerSchema }
    }));

    let storytellerJson;
    try {
        storytellerJson = JSON.parse(storytellerResponse.text.trim());
    } catch (e: any) {
        console.error("Lỗi phân tích JSON từ Storyteller:", storytellerResponse.text);
        throw new Error(`Lỗi phân tích JSON từ AI Kể chuyện: ${e.message}`);
    }

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
                
                let characterJson;
                try {
                    characterJson = JSON.parse(characterResponse.text.trim());
                } catch (e: any) {
                    console.error(`Lỗi phân tích JSON từ Character AI cho nhân vật ${npcName}:`, characterResponse.text);
                    throw new Error(`Lỗi phân tích JSON từ AI Tương tác Nhân vật (${npcName}): ${e.message}`);
                }
                
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