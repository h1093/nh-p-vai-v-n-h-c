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
                console.warn(`Rate limit exceeded. Retrying in ${Math.round(delay / 1000)}s... (Attempt ${attempt + 1}/${maxRetries})`);
                await sleep(delay);
            } else {
                throw error;
            }
        }
    }
    throw lastError;
}


const callGemini = async (ai: GoogleGenAI, systemInstruction: string, prompt: string, responseSchema: any) => {
    const response = await withRetry(() => ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 0 }
      },
    }));

    const jsonText = response.text.trim();
    const cleanedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    return JSON.parse(cleanedJsonText);
};

// Orchestrator function for the multi-AI system
export const generateStorySegment = async (
  ai: GoogleGenAI,
  prompt: string,
  work: Work,
  character: CharacterData,
  lorebook: LorebookEntry[],
  inventory: Item[],
  equipment: Equipment,
  spouse: string | null,
  dating: string | null,
  previousWorldUpdate: string | null,
  isNsfwEnabled: boolean,
  onProgress: (activeAI: AITypeKey) => void
): Promise<StorySegmentResult> => {
  try {
    // === 1. Call Storyteller AI ===
    onProgress('Storyteller');
    const storytellerSchema = {
        type: Type.OBJECT,
        properties: {
            narrative: { type: Type.STRING, description: "Phần tường thuật chính, mô tả bối cảnh và kết quả hành động. Nếu có hội thoại, dùng placeholder [DIALOGUE:\"Tên nhân vật\"]" },
            dialogueTarget: { type: Type.STRING, description: "Tên nhân vật cần nói chuyện. Trả về 'null' nếu không có hội thoại." },
            summaryForWorldAI: { type: Type.STRING, description: "Tóm tắt ngắn gọn hành động và kết quả để AI Quản lý Thế giới phân tích." },
            suggestedActions: {
                type: Type.ARRAY,
                description: "Một mảng chứa 3-5 chuỗi gợi ý hành động ngắn gọn cho người chơi.",
                items: { type: Type.STRING }
            }
        },
        required: ["narrative", "dialogueTarget", "summaryForWorldAI", "suggestedActions"]
    };
    const storytellerInstruction = getSystemInstructionWithContext(work.storytellerSystemInstruction, character.name, lorebook, inventory, equipment, spouse, dating, isNsfwEnabled);
    const storytellerPrompt = `${previousWorldUpdate ? `Cập nhật thế giới ngoài màn hình: ${previousWorldUpdate}\n\n` : ''}Hành động của người chơi: ${prompt}`;
    const storytellerResult = await callGemini(ai, storytellerInstruction, storytellerPrompt, storytellerSchema);

    let finalNarrative = storytellerResult.narrative;
    let finalSpeaker = "Người dẫn chuyện";
    let finalAIType: AITypeKey = 'Storyteller';

    // === 2. Call Character Actor AI (if needed) ===
    if (storytellerResult.dialogueTarget && storytellerResult.dialogueTarget.toLowerCase() !== 'null') {
      onProgress('Character');
      const characterActorSchema = {
          type: Type.OBJECT, properties: {
              dialogue: { type: Type.STRING, description: "Lời thoại của nhân vật." }
          }, required: ["dialogue"]
      };
      const characterInstruction = getSystemInstructionWithContext(work.characterSystemInstruction, character.name, lorebook, inventory, equipment, spouse, dating, isNsfwEnabled);
      const characterPrompt = `Tình huống: ${storytellerResult.summaryForWorldAI}\nNhân vật của bạn, ${storytellerResult.dialogueTarget}, cần phải nói. Lời thoại của họ là gì?`;
      const characterResult = await callGemini(ai, characterInstruction, characterPrompt, characterActorSchema);

      // Replace placeholder with actual dialogue
      finalNarrative = finalNarrative.replace(`[DIALOGUE:"${storytellerResult.dialogueTarget}"]`, characterResult.dialogue);
      finalSpeaker = storytellerResult.dialogueTarget;
      finalAIType = 'Character';
    }

    // === 3. Call World-Smith AI ===
    onProgress('World');
    const worldSmithSchema = {
       type: Type.OBJECT,
      properties: {
        affinityUpdates: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              npcName: { type: Type.STRING }, change: { type: Type.INTEGER }, reason: { type: Type.STRING }
            }, required: ["npcName", "change", "reason"]
          }
        },
        itemUpdates: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING, enum: ['add', 'remove'] },
              item: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING }, description: { type: Type.STRING }, type: { type: Type.STRING, enum: ['equipment', 'consumable', 'key']}
                }, required: ["name", "description", "type"]
              }
            }, required: ["action", "item"]
          }
        },
        companions: { type: Type.ARRAY, items: { type: Type.STRING } },
        datingUpdate: {
            type: Type.OBJECT,
            properties: {
                partnerName: { type: Type.STRING, description: "Tên của nhân vật mà người chơi đã bắt đầu hẹn hò thành công trong lượt này. Trả về null nếu không có."}
            }
        },
        marriageUpdate: {
            type: Type.OBJECT,
            properties: {
                spouseName: { type: Type.STRING, description: "Tên của nhân vật mà người chơi đã kết hôn thành công trong lượt này. Trả về null nếu không có sự kiện kết hôn."}
            }
        },
        offScreenWorldUpdate: { type: Type.STRING, description: "Một mô tả ngắn (1-2 câu) về một sự kiện nhỏ đã xảy ra 'ngoài màn hình' trong khi người chơi hành động để làm cho thế giới có cảm giác sống động." },
        timePassed: { type: Type.INTEGER, description: "Số phút đã trôi qua cho hành động này." }
      },
      required: ["affinityUpdates", "itemUpdates", "companions", "offScreenWorldUpdate", "timePassed"]
    };
    const worldInstruction = getSystemInstructionWithContext(work.worldSystemInstruction, character.name, lorebook, inventory, equipment, spouse, dating, isNsfwEnabled);
    const worldPrompt = `Dựa trên sự kiện sau: "${storytellerResult.summaryForWorldAI}", hãy cập nhật trạng thái thế giới.`;
    const worldResult = await callGemini(ai, worldInstruction, worldPrompt, worldSmithSchema);

    if (!finalNarrative) {
      throw new Error("Phản hồi từ AI Người Kể Chuyện không hợp lệ.");
    }

    return { 
      narrative: finalNarrative,
      speaker: finalSpeaker,
      aiType: finalAIType,
      suggestedActions: storytellerResult.suggestedActions || [],
      worldStateChanges: {
          affinityUpdates: worldResult.affinityUpdates || [],
          itemUpdates: worldResult.itemUpdates || [],
          companions: worldResult.companions || [],
          datingUpdate: worldResult.datingUpdate,
          marriageUpdate: worldResult.marriageUpdate,
          offScreenWorldUpdate: worldResult.offScreenWorldUpdate || "Thế giới vẫn yên bình.",
          timePassed: worldResult.timePassed || 15, // Fallback to 15 minutes
      }
    };

  } catch (error) {
    console.error("Lỗi khi gọi hệ thống đa AI:", error);
    if (error instanceof Error && (error.message.includes("API key not valid") || error.message.includes("invalid"))) {
      throw new Error("API key không hợp lệ. Vui lòng kiểm tra và điền lại key chính xác.");
    }
    throw new Error("Không thể tạo tiếp diễn biến câu chuyện. Vui lòng thử lại.");
  }
};


export const extractLoreSuggestions = async (
  ai: GoogleGenAI,
  narrative: string,
  currentLore: LorebookEntry[]
) => {
  try {
    const systemInstruction = `Bạn là một trợ lý thông minh cho game nhập vai. Nhiệm vụ của bạn là đọc một đoạn tường thuật và trích xuất các thực thể MỚI và QUAN TRỌNG (tên riêng của nhân vật, địa danh, vật phẩm đặc biệt) vừa xuất hiện.
    QUY TẮC:
    1. Chỉ trích xuất những cái tên MỚI chưa được nhắc đến trong Sổ tay hiện tại.
    2. Với mỗi thực thể, cung cấp một mô tả ngắn gọn dựa trên ngữ cảnh trong đoạn văn.
    3. KHÔNG trích xuất tên nhân vật người chơi hoặc những danh từ chung chung.
    4. Trả lời bằng định dạng JSON theo schema. Nếu không có gì mới, trả về mảng rỗng [].
    
    SỔ TAY HIỆN TẠI (để tham khảo, không trích xuất lại):
    ${currentLore.map(e => `- ${e.key}`).join('\n')}
    `;

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING, description: 'Tên thực thể (nhân vật, địa danh...)' },
          value: { type: Type.STRING, description: 'Mô tả ngắn gọn về thực thể đó.' }
        },
        required: ['key', 'value']
      }
    };

    const response = await withRetry(() => ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: narrative,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        thinkingConfig: { thinkingBudget: 0 }
      }
    }));

    const jsonText = response.text.trim();
    const cleanedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    const parsedResponse = JSON.parse(cleanedJsonText);

    const currentLoreKeys = new Set(currentLore.map(e => e.key.toLowerCase()));
    return parsedResponse.filter((suggestion: { key: string }) => !currentLoreKeys.has(suggestion.key.toLowerCase()));

  } catch (error) {
    console.error("Lỗi khi trích xuất gợi ý Sổ tay:", error);
    return [];
  }
};