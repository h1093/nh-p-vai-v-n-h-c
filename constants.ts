import { Work, CharacterData } from './types';

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const SAVE_GAME_KEY = 'literary-rpg-save-v4';
export const CHARACTERS_SAVE_KEY = 'literary-rpg-characters';
export const API_KEY_STORAGE_KEY = 'gemini-api-key';

export const baseSystemInstruction = `Bạn là một người kể chuyện bậc thầy cho một game nhập vai tương tác. Người chơi sẽ vào vai một nhân vật trong câu chuyện. Nhiệm vụ của bạn là:
1. Dựa vào hành động hoặc lời thoại của người chơi (được cung cấp trong prompt), hãy tiếp tục câu chuyện một cách liền mạch và hấp dẫn.
2. Mô tả kết quả hành động của người chơi, phản ứng của các nhân vật khác, và những thay đổi trong thế giới xung quanh. Giữ cho câu chuyện luôn tiến về phía trước.
3. Luôn trả lời bằng định dạng JSON theo schema đã cung cấp. Câu trả lời phải là tiếng Việt.
4. Quan trọng: Hãy tham khảo và sử dụng các thông tin trong 'Sổ tay' (Lorebook) được cung cấp trong lời nhắc hệ thống để đảm bảo tính nhất quán của câu chuyện.`;

export const CHI_PHEO_WORK: Work = {
    id: 'chi-pheo',
    title: 'Chí Phèo',
    author: 'Nam Cao',
    description: 'Sống lại cuộc đời bi kịch của một người nông dân bị tha hóa trong xã hội cũ, và đối mặt với những định kiến tàn nhẫn của làng Vũ Đại.',
    originalCharacterName: 'Chí Phèo',
    originalCharacterDescription: 'Vào vai Chí Phèo, trải nghiệm cuộc đời đầy bi kịch của nhân vật kinh điển trong tác phẩm của Nam Cao.',
    fanficDescription: 'Tạo một nhân vật của riêng bạn và viết nên một câu chuyện hoàn toàn mới trong bối cảnh làng Vũ Đại.',
    initialPromptOriginal: `Bắt đầu câu chuyện. Người chơi đang vào vai Chí Phèo, nhân vật trong tác phẩm cùng tên của nhà văn Nam Cao. Bối cảnh là Chí Phèo vừa ở tù về làng Vũ Đại. Hãy viết đoạn văn mở đầu, mô tả cảnh tượng Chí Phèo bước vào làng trong một buổi trưa hè oi ả, với dáng vẻ say khướt và tâm trạng ngổn ngang.`,
    getFanficInitialPrompt: (character: CharacterData) => {
        return `Bắt đầu một câu chuyện đồng nhân (fanfiction) trong bối cảnh tác phẩm "Chí Phèo" của Nam Cao. Người chơi sẽ vào vai một nhân vật hoàn toàn mới do họ tự tạo ra. Bối cảnh là làng Vũ Đại.

Thông tin về nhân vật của người chơi:
- Tên: ${character.name}
- Ngoại hình: ${character.appearance}
- Tính cách: ${character.personality}
- Hoàn cảnh: ${character.background}

Nhiệm vụ của bạn:
1. Dựa vào thông tin trên, hãy viết một đoạn văn mở đầu hấp dẫn, giới thiệu nhân vật này và tình huống họ xuất hiện tại làng Vũ Đại. Giữ nguyên không khí và văn phong của Nam Cao.
2. Tạo ra một tình huống khởi đầu thú vị. Có thể cho họ gặp một nhân vật quen thuộc (như Lý Cường, Bá Kiến, Thị Nở...) hoặc đối mặt với một sự kiện đặc trưng của làng.
3. Kết thúc đoạn văn mở đầu, sẵn sàng để người chơi đưa ra hành động đầu tiên của họ.`;
    },
    systemInstruction: `${baseSystemInstruction}\nGiọng văn và không khí phải đậm chất của tác phẩm gốc "Chí Phèo".`
};

export const TRUYEN_KIEU_WORK: Work = {
    id: 'truyen-kieu',
    title: 'Truyện Kiều',
    author: 'Nguyễn Du',
    description: 'Dấn thân vào kiệt tác của Nguyễn Du, theo chân nàng Kiều qua mười lăm năm lưu lạc và đưa ra những lựa chọn định mệnh.',
    originalCharacterName: 'Thúy Kiều',
    originalCharacterDescription: 'Vào vai Thúy Kiều, trải qua những đoạn trường và những lựa chọn định mệnh đã làm nên số phận của nàng.',
    fanficDescription: 'Tạo một nhân vật mới—có thể là một vị quan, một người hầu, hay một nhà buôn—và xem câu chuyện của họ diễn ra như thế nào trong thế giới của Kiều.',
    initialPromptOriginal: `Bắt đầu câu chuyện. Người chơi đang vào vai Thúy Kiều, nhân vật trong "Truyện Kiều" của Nguyễn Du. Bối cảnh là sau khi gia đình gặp đại nạn, Kiều quyết định bán mình chuộc cha và rơi vào tay Mã Giám Sinh. Hãy mô tả cảnh Kiều ở lầu Ngưng Bích, nỗi cô đơn, buồn tủi và tâm trạng ngổn ngang khi nhớ về gia đình và chàng Kim.`,
    getFanficInitialPrompt: (character: CharacterData) => {
        return `Bắt đầu một câu chuyện đồng nhân (fanfiction) trong bối cảnh tác phẩm "Truyện Kiều" của Nguyễn Du. Người chơi sẽ vào vai một nhân vật hoàn toàn mới do họ tự tạo ra.

Thông tin về nhân vật của người chơi:
- Tên: ${character.name}
- Ngoại hình: ${character.appearance}
- Tính cách: ${character.personality}
- Hoàn cảnh: ${character.background}

Nhiệm vụ của bạn:
1. Dựa vào thông tin trên, viết một đoạn văn mở đầu giới thiệu nhân vật này trong thế giới của Truyện Kiều. Hãy sử dụng văn phong giàu hình ảnh, có thể phảng phất âm hưởng thơ lục bát của Nguyễn Du.
2. Đặt nhân vật vào một tình huống khởi đầu thú vị, có thể liên quan đến một sự kiện hoặc một nhân vật trong tác phẩm gốc (ví dụ: chứng kiến cảnh Kiều bán mình, gặp gỡ Thúc Sinh, hoặc làm việc cho Hoạn Thư).`;
    },
    systemInstruction: `${baseSystemInstruction}\nSử dụng ngôn ngữ giàu chất thơ, hình ảnh, mang âm hưởng của văn học trung đại và kiệt tác Truyện Kiều.`
};

export const LITERARY_WORKS: Work[] = [
    CHI_PHEO_WORK,
    TRUYEN_KIEU_WORK,
];

export const createCustomLiteraryWork = (title: string, author: string, content: string): Work => {
    const customSystemInstruction = `Bạn là một người kể chuyện bậc thầy cho một game nhập vai tương tác. Toàn bộ bối cảnh, nhân vật, và không khí của game được xây dựng dựa trên một văn bản do người dùng cung cấp.

Văn bản gốc của người dùng:
---
${content}
---

Nhiệm vụ của bạn là:
1. Dựa vào hành động hoặc lời thoại của người chơi (được cung cấp trong prompt), tiếp tục câu chuyện một cách liền mạch và hấp dẫn.
2. Tuyệt đối trung thành với văn bản gốc của người dùng. Sử dụng giọng văn, ngôn ngữ, và không khí được gợi ý từ văn bản đó.
3. Luôn trả lời bằng định dạng JSON theo schema đã cung cấp. Câu trả lời phải là tiếng Việt.
4. Quan trọng: Hãy tham khảo và sử dụng các thông tin trong 'Sổ tay' (Lorebook) được cung cấp trong lời nhắc hệ thống để đảm bảo tính nhất quán của câu chuyện.`;

    return {
        id: `custom-${Date.now()}`,
        title: title || "Thế giới Tùy chỉnh",
        author: author || "Người chơi",
        description: `Một thế giới độc đáo được tạo ra dựa trên nội dung bạn cung cấp.`,
        originalCharacterName: '', 
        originalCharacterDescription: '', 
        fanficDescription: 'Tạo một nhân vật để khám phá thế giới bạn vừa tạo ra.',
        initialPromptOriginal: '', 
        content: content,
        getFanficInitialPrompt: (character: CharacterData) => {
            return `Bắt đầu một câu chuyện trong một thế giới tùy chỉnh do người dùng định nghĩa.

Bối cảnh thế giới (dựa trên nội dung người dùng cung cấp):
---
${content}
---

Thông tin về nhân vật của người chơi (một nhân vật mới):
- Tên: ${character.name}
- Ngoại hình: ${character.appearance}
- Tính cách: ${character.personality}
- Hoàn cảnh: ${character.background}

Nhiệm vụ của bạn:
1. Dựa vào thông tin trên, hãy viết một đoạn văn mở đầu hấp dẫn, giới thiệu nhân vật mới này vào bối cảnh thế giới đã cho. Hãy cố gắng nắm bắt và tái hiện văn phong, không khí từ nội dung gốc mà người dùng đã cung cấp.
2. Tạo ra một tình huống khởi đầu thú vị, phù hợp với thế giới đó.`;
        },
        systemInstruction: customSystemInstruction
    };
};
