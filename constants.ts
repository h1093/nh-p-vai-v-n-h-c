import { Work, CharacterData, Item, Equipment, LorebookEntry } from './types';

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const SAVE_GAME_KEY = 'literary-rpg-save-v12';
export const CHARACTERS_SAVE_KEY = 'literary-rpg-characters';
export const API_KEY_STORAGE_KEY = 'gemini-api-key';

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
    {
        version: "v1.3 - Hẹn hò & Tỏ tình",
        date: "Tháng 7, 2024",
        changes: [
            "Thêm trạng thái 'Người yêu' trước khi tiến tới hôn nhân.",
            "Thêm hành động 'Tỏ tình' khi tình cảm với một đồng đội đủ cao (>70).",
            "Cập nhật logic cầu hôn: Bạn phải đang trong mối quan hệ hẹn hò với nhân vật trước khi có thể cầu hôn.",
            "Giao diện Đồng đội được cập nhật để hiển thị trạng thái 'Người yêu' và các lựa chọn tương tác tình cảm mới."
        ],
    },
    {
        version: "v1.2 - Hôn nhân & Tình yêu",
        date: "Tháng 7, 2024",
        changes: [
            "Thêm tính năng Cầu hôn! Khi tình cảm với một đồng đội đủ sâu đậm (>90) và có vật phẩm đặc biệt ('Nhẫn Cỏ'), bạn có thể ngỏ lời với họ.",
            "Trạng thái 'Bạn đời' mới sẽ ảnh hưởng đến cách AI kể chuyện và các nhân vật khác tương tác với bạn.",
            "Giao diện Đồng đội được cập nhật để hiển thị trạng thái hôn nhân và nút cầu hôn khi đủ điều kiện."
        ],
    },
    {
        version: "v1.1 - Cải tiến & Tính năng mới",
        date: "Tháng 7, 2024",
        changes: [
            "Quản lý nhân vật: Lưu và chọn lại các nhân vật đã tạo để chơi trong các câu chuyện khác nhau.",
            "Chỉnh sửa & Tạo lại: Toàn quyền kiểm soát câu chuyện với khả năng chỉnh sửa hoặc yêu cầu AI viết lại lượt tường thuật cuối cùng.",
            "Gợi ý Sổ tay thông minh: AI tự động phát hiện và đề xuất các nhân vật, địa điểm mới để bạn thêm vào sổ tay.",
            "Nâng cấp giao diện: Các bảng điều khiển chuyên dụng cho Tình cảm, Đồng đội và Túi đồ, giúp quản lý dễ dàng hơn.",
            "Theo dõi thời gian trong game: Hiển thị chi tiết ngày và giờ, giúp bạn đắm chìm vào câu chuyện.",
            "Tùy chọn nội dung 18+: Thêm một công tắc để bật các chủ đề trưởng thành, phù hợp với bối cảnh văn học.",
            "Thêm Nhật ký cập nhật (chính là màn hình bạn đang xem!)."
        ],
    },
    {
        version: "v1.0 - Ra mắt",
        date: "Tháng 7, 2024",
        changes: [
            "Ra mắt phiên bản đầu tiên của Nhập Vai Văn Học.",
            "Hỗ trợ tác phẩm 'Chí Phèo' và 'Truyện Kiều'.",
            "Tính năng tạo thế giới tùy chỉnh từ văn bản người dùng.",
            "Hệ thống nhập vai đa AI: Người Kể Chuyện, Tương Tác Nhân Vật, Quản Lý Thế Giới.",
            "Các tính năng cốt lõi: Sổ tay, Tình cảm NPC, Túi đồ & Trang bị, Đồng đội.",
            "Lưu và tải lại tiến trình câu chuyện.",
        ],
    },
];

const storytellerBaseInstruction = `Bạn là AI Người Kể Chuyện bậc thầy cho một game nhập vai.
1. Vai trò của bạn là dẫn dắt cốt truyện chính. Hãy mô tả bối cảnh, môi trường, và kết quả tổng quan của hành động của người chơi.
2. Khi có đoạn hội thoại, hãy viết một placeholder ví dụ như [DIALOGUE:"Tên Nhân Vật"]. AI Tương Tác Nhân Vật sẽ thay thế placeholder này bằng lời thoại thực tế.
3. Giữ cho câu chuyện luôn tiến về phía trước. Đừng sa đà vào chi tiết không cần thiết.
4. Bạn có thể sẽ nhận được một "Cập nhật thế giới ngoài màn hình". Hãy khéo léo lồng ghép thông tin này vào đoạn tường thuật của bạn để thế giới có cảm giác sống động và đang thay đổi. Đừng chỉ lặp lại nó.
5. Luôn trả lời bằng định dạng JSON theo schema. Câu trả lời phải là tiếng Việt.
6. Sau mỗi đoạn tường thuật, hãy tạo ra 3-5 gợi ý hành động ngắn gọn, khả thi mà người chơi có thể thực hiện tiếp theo. Các gợi ý này phải ở trong mảng 'suggestedActions'.`;

const characterActorBaseInstruction = `Bạn là AI Tương Tác Nhân Vật.
1. Vai trò của bạn là nhập vai một nhân vật (NPC) và tạo ra lời thoại cho họ.
2. Bạn sẽ nhận được thông tin về nhân vật bạn đang đóng vai và tình huống hiện tại.
3. Chỉ trả lời bằng lời thoại của nhân vật đó. Không thêm bất kỳ mô tả hay tường thuật nào.
4. Giữ lời thoại ngắn gọn, tự nhiên và phù hợp với tính cách của nhân vật.
5. Luôn trả lời bằng định dạng JSON theo schema.`;

const worldSmithBaseInstruction = `Bạn là AI Quản Lý Thế Giới.
1. Vai trò của bạn là duy trì sự logic và nhất quán của thế giới game.
2. Dựa trên hành động của người chơi và kết quả câu chuyện, hãy quyết định những thay đổi đối với trạng thái game.
3. Cập nhật một cách hợp lý: tình cảm NPC (affinityUpdates), vật phẩm trong túi đồ (itemUpdates), và danh sách đồng đội (companions).
4. Nếu người chơi tỏ tình và thành công, hãy cập nhật trạng thái hẹn hò (datingUpdate).
5. Nếu người chơi cầu hôn và thành công, hãy cập nhật trạng thái hôn nhân (marriageUpdate).
6. Ước tính và trả về \`timePassed\`, là số phút đã trôi qua cho hành động này (ví dụ: một cuộc trò chuyện ngắn là 10 phút, đi bộ đến một nơi nào đó là 30 phút).
7. QUAN TRỌNG: Hãy tạo một "offScreenWorldUpdate". Đây là một mô tả ngắn (1-2 câu) về một sự kiện nhỏ đã xảy ra trong thế giới "ngoài màn hình" trong khi người chơi hành động. Ví dụ: "Trời trở gió và mây đen kéo đến.", "Có tin đồn về một gánh hát sắp tới làng.". Điều này làm cho thế giới có cảm giác đang sống.
8. Chỉ trả về những thay đổi. Nếu không có gì thay đổi, hãy trả về các mảng rỗng và giá trị mặc định.
9. Luôn trả lời bằng định dạng JSON theo schema.`;


export const NSFW_INSTRUCTION_APPENDIX = `\n\nQUY TẮC 18+:\nKhi chế độ 18+ được bật, bạn được phép mô tả các cảnh nhạy cảm, bạo lực, hoặc lãng mạn một cách trưởng thành và phù hợp với bối cảnh văn học, miễn là nó phục vụ cho sự phát triển của câu chuyện và nhân vật. Hãy xử lý các chủ đề này một cách tinh tế và không miễn cưỡng. Tránh các nội dung cực đoan, bất hợp pháp hoặc phi đạo đức.`;

const addContextToSystemInstruction = (baseInstruction: string, characterName: string, lorebook: LorebookEntry[], inventory: Item[], equipment: Equipment, spouse: string | null, dating: string | null): string => {
    let finalInstruction = baseInstruction;
    
    finalInstruction += `\n\nTên nhân vật người chơi là: ${characterName}.`;
    
    if (spouse) {
      finalInstruction += `\n\nBạn đã kết hôn với: ${spouse}. Đây là một thông tin quan trọng ảnh hưởng đến các mối quan hệ và sự kiện.`;
    } else if (dating) {
      finalInstruction += `\n\nBạn đang hẹn hò với: ${dating}.`;
    }

    if (lorebook.length > 0) {
        const lorebookContext = lorebook.map(entry => `- ${entry.key}: ${entry.value}`).join('\n');
        finalInstruction += `\n\n--- SỔ TAY (LOREBOOK) ---\n${lorebookContext}\n--- KẾT THÚC SỔ TAY ---`;
    }

    const equippedItems = Object.values(equipment).filter(Boolean).map(item => `- ${item!.name}: ${item!.description}`);
    if (equippedItems.length > 0) {
        finalInstruction += `\n\n--- TRANG BỊ HIỆN TẠI ---\n${equippedItems.join('\n')}\n--- KẾT THÚC TRANG BỊ ---`;
    }

    const inventoryItems = inventory.map(item => `- ${item.name}`);
    if (inventoryItems.length > 0) {
        finalInstruction += `\n\n--- TÚI ĐỒ ---\n${inventoryItems.join('\n')}\n--- KẾT THÚC TÚI ĐỒ ---`;
    }

    return finalInstruction;
};

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
    storytellerSystemInstruction: `${storytellerBaseInstruction}\nGiọng văn và không khí phải đậm chất của tác phẩm gốc "Chí Phèo".`,
    characterSystemInstruction: `${characterActorBaseInstruction}\nHãy nhập vai các nhân vật trong thế giới của Nam Cao.`,
    worldSystemInstruction: `${worldSmithBaseInstruction}\nHãy quản lý thế giới dựa trên các quy tắc ngầm của làng Vũ Đại.`
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
    storytellerSystemInstruction: `${storytellerBaseInstruction}\nSử dụng ngôn ngữ giàu chất thơ, hình ảnh, mang âm hưởng của văn học trung đại và kiệt tác Truyện Kiều.`,
    characterSystemInstruction: `${characterActorBaseInstruction}\nHãy nhập vai các nhân vật trong thế giới của Nguyễn Du với lời thoại trang trọng, giàu hình ảnh.`,
    worldSystemInstruction: `${worldSmithBaseInstruction}\nHãy quản lý thế giới dựa trên các quy tắc xã hội và số phận trong Truyện Kiều.`
};

export const LITERARY_WORKS: Work[] = [
    CHI_PHEO_WORK,
    TRUYEN_KIEU_WORK,
];

export const createCustomLiteraryWork = (title: string, author: string, content: string): Work => {
    const customStorytellerInstruction = `${storytellerBaseInstruction}\nToàn bộ bối cảnh, nhân vật, và không khí của game được xây dựng dựa trên một văn bản do người dùng cung cấp. Cố gắng tái hiện văn phong từ văn bản gốc.\n\nVăn bản gốc:\n---\n${content}\n---`;
    const customCharacterInstruction = `${characterActorBaseInstruction}\nHãy nhập vai các nhân vật phù hợp với thế giới được mô tả trong văn bản gốc.`;
    const customWorldInstruction = `${worldSmithBaseInstruction}\nHãy quản lý thế giới dựa trên các quy tắc và logic từ văn bản gốc.`;

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
        storytellerSystemInstruction: customStorytellerInstruction,
        characterSystemInstruction: customCharacterInstruction,
        worldSystemInstruction: customWorldInstruction,
    };
};

export const getSystemInstructionWithContext = addContextToSystemInstruction;