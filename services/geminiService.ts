import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL } from "../constants";
import { LorebookEntry } from "../types";

export const generateStorySegment = async (
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string,
  lorebook: LorebookEntry[] = []
) => {
  try {
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        narrative: {
          type: Type.STRING,
          description: "Phần tường thuật câu chuyện, mô tả bối cảnh, sự kiện và cảm xúc nhân vật, tiếp nối hành động trước đó của người chơi. Viết bằng giọng văn phù hợp với tác phẩm được chọn.",
        },
      },
      required: ["narrative"],
    };

    let finalSystemInstruction = systemInstruction;
    if (lorebook.length > 0) {
      const lorebookContext = lorebook.map(entry => `- ${entry.key}: ${entry.value}`).join('\n');
      finalSystemInstruction += `\n\n--- SỔ TAY (LOREBOOK) ---\n${lorebookContext}\n--- KẾT THÚC SỔ TAY ---`;
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: finalSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const jsonText = response.text.trim();
    const cleanedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    const parsedResponse = JSON.parse(cleanedJsonText);

    if (!parsedResponse.narrative) {
      throw new Error("Phản hồi từ AI không hợp lệ.");
    }

    return { narrative: parsedResponse.narrative };

  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
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

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: narrative,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

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
