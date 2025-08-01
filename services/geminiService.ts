import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL, getSystemInstructionWithContext } from "../constants";
import { LorebookEntry, AffinityUpdate, Item, Equipment, ItemUpdate, Work, CharacterData, AITypeKey, LorebookSuggestion, HistoryMessage } from "../types";

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
    const worldSystemInstruction = getSystemInstructionWithContext(work.worldSystemInstruction, character, lorebook, inventory, equipment, spouse, dating, pregnancy, gameTime, isNsfwEnabled, turnSummary);
    const worldResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
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
    const storytellerPrompt = `Hành động của người chơi: "${prompt}".\nCập nhật thế giới ngoài màn hình: "${worldJson.offScreenWorldUpdate || 'Không có.'}"`;
    const storytellerSystemInstruction = getSystemInstructionWithContext(work.storytellerSystemInstruction, character, lorebook, inventory, equipment, spouse, dating, pregnancy, gameTime, isNsfwEnabled, storytellerPrompt);
    const storytellerResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
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
        
        for (const placeholder of dialoguePlaceholders) {
            const npcNameMatch = placeholder.match(/\[DIALOGUE:"(.*?)"\]/);
            if (npcNameMatch && npcNameMatch[1]) {
                const npcName = npcNameMatch[1];
                finalSpeaker = npcName;
                finalAiType = 'Character';

                const characterPrompt = `Trong bối cảnh sau đây, hãy viết lời thoại cho nhân vật ${npcName}:\n\n${narrative}`;
                const characterSystemInstruction = getSystemInstructionWithContext(work.characterSystemInstruction, character, lorebook, inventory, equipment, spouse, dating, pregnancy, gameTime, isNsfwEnabled, characterPrompt);
                const characterResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
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

const lorebookSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            description: "Danh sách các mục sổ tay được đề xuất.",
            items: {
                type: Type.OBJECT,
                properties: {
                    key: { type: Type.STRING, description: "Tên của thực thể (nhân vật, địa điểm, vật phẩm). Phải là danh từ riêng hoặc một khái niệm độc nhất." },
                    value: { type: Type.STRING, description: "Mô tả chi tiết, khách quan về thực thể đó." },
                    reason: { type: Type.STRING, description: "Lý do tại sao mục này nên được thêm vào sổ tay, dựa trên đoạn văn bản." }
                },
                required: ["key", "value", "reason"]
            }
        }
    },
    required: ["suggestions"]
};

export async function generateLorebookSuggestions(
    ai: GoogleGenAI,
    narrativeText: string,
    existingLoreKeys: string[]
): Promise<LorebookSuggestion[]> {
    const systemInstruction = `Bạn là một AI trợ lý biên tập, giúp người chơi xây dựng một "sổ tay" (lorebook) để theo dõi các chi tiết quan trọng trong câu chuyện nhập vai.
Nhiệm vụ của bạn là đọc đoạn văn bản tường thuật và trích xuất các thực thể (nhân vật, địa điểm, vật phẩm quan trọng, khái niệm mới) chưa có trong sổ tay.

QUY TẮC:
1. Chỉ đề xuất các thực thể MỚI. So sánh với danh sách các khóa đã có và loại bỏ bất kỳ đề xuất nào đã tồn tại.
2. 'key' phải là một danh từ riêng hoặc một khái niệm cụ thể (ví dụ: "Lão Hạc", "Làng Vũ Đại", "Cái lò gạch cũ").
3. 'value' phải là một mô tả khách quan, dựa trên thông tin trong văn bản.
4. 'reason' giải thích ngắn gọn tại sao thực thể này quan trọng và đáng để ghi nhớ.
5. Nếu không có thực thể mới nào đáng chú ý, hãy trả về một mảng rỗng trong trường 'suggestions'.

Các khóa đã có trong sổ tay (Không đề xuất lại): ${existingLoreKeys.join(', ') || "Chưa có"}
`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Hãy phân tích đoạn văn sau và đề xuất các mục cho sổ tay:\n\n${narrativeText}`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: lorebookSuggestionSchema
        }
    }));
    
    try {
        const json = JSON.parse(response.text.trim());
        return (json.suggestions || []) as LorebookSuggestion[];
    } catch (e) {
        console.error("Lỗi phân tích JSON từ Lorebook Suggestion AI:", response.text, e);
        return []; // Return empty on error to not break the game
    }
}

const summarySchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "Nội dung tóm tắt khoảng 2-4 câu, viết ở ngôi thứ nhất." },
    },
    required: ["summary"]
};


export async function generateSummary(
    ai: GoogleGenAI, 
    historyToSummarize: HistoryMessage[], 
    character: CharacterData
): Promise<string> {
    const systemInstruction = `Bạn là một AI có khả năng tóm tắt. Nhiệm vụ của bạn là đọc một loạt các sự kiện từ một câu chuyện nhập vai và viết một bản tóm tắt ngắn gọn, mạch lạc (khoảng 2-4 câu) ở ngôi thứ nhất, như thể là ký ức của nhân vật chính. Chỉ trả về nội dung tóm tắt trong một đối tượng JSON.`;

    const formattedHistory = historyToSummarize.map(msg => {
        if (msg.role === 'user') {
            return `Tôi đã làm: "${msg.content}"`;
        } else {
            return `Kết quả: ${msg.content}`;
        }
    }).join('\n');
    
    const prompt = `Đây là các sự kiện vừa xảy ra:\nNhân vật của tôi: ${character.name}\n${formattedHistory}\n\nHãy tóm tắt lại những sự kiện trên từ góc nhìn của tôi.`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: summarySchema,
        }
    }));

    try {
        const json = JSON.parse(response.text.trim());
        return json.summary;
    } catch (e) {
        console.error("Lỗi phân tích JSON từ Summary AI:", response.text, e);
        return response.text.trim();
    }
}