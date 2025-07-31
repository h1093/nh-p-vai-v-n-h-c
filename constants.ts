
import { Work, CharacterData, Item, Equipment, LorebookEntry } from './types';

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const API_KEY_STORAGE_KEY = 'gemini-api-key';
export const SAVE_GAME_KEY = 'narrative-game-saves-v14'; // Key cho các màn chơi đã lưu
export const CHARACTERS_SAVE_KEY = 'narrative-game-characters-v2'; // Key cho các nhân vật đã lưu

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
    {
        version: "v1.8 - Chiều sâu Cuộc sống",
        date: "Tháng 7, 2024",
        changes: [
            "Thêm Giới tính vào quá trình tạo nhân vật, giúp AI xây dựng câu chuyện phù hợp và chính xác hơn.",
            "Thêm cơ chế Mang thai. AI Quản lý Thế giới có thể kích hoạt sự kiện này một cách tự nhiên trong các mối quan hệ sâu sắc.",
            "AI Kể chuyện và Tương tác Nhân vật giờ đây nhận thức được trạng thái thai kỳ và sẽ phản ánh điều đó trong lời kể và hội thoại.",
            "Giao diện hiển thị tuần thai để người chơi tiện theo dõi.",
            "Chế độ 18+ ảnh hưởng đến mức độ chi tiết và chân thực của các sự kiện liên quan đến thai kỳ."
        ],
    },
    {
        version: "v1.7 - Khôi phục và Tái thiết",
        date: "Tháng 7, 2024",
        changes: [
            "Xây dựng lại hoàn toàn hệ thống lưu trữ từ đầu với mục tiêu ổn định và đơn giản hóa.",
            "Thêm lại tính năng lưu/tải nhiều màn chơi. Giờ đây bạn có thể có nhiều cuộc phiêu lưu song song.",
            "Thêm lại tính năng lưu/tải các nhân vật đã tạo để tái sử dụng.",
            "Nền tảng lưu trữ mới sử dụng cơ chế tự động đồng bộ để đảm bảo tính nhất quán và loại bỏ các lỗi trước đây.",
            "Giao diện được thiết kế lại để hiển thị danh sách các màn chơi và nhân vật đã lưu một cách trực quan.",
            "Nút 'Thoát' được đổi lại thành 'Lưu & Thoát' đúng với chức năng.",
        ],
    },
    {
        version: "v1.6 - AI Nhận thức Tính cách",
        date: "Tháng 7, 2024",
        changes: [
            "Nâng cấp hệ thống AI để phân tích và hành động dựa trên tính cách cụ thể của từng nhân vật trong Sổ tay.",
            "Phản ứng của nhân vật (lời thoại, thay đổi tình cảm) giờ đây sẽ khác nhau tùy thuộc vào họ là người kiêu ngạo, hiền lành, hay ghen tuông.",
            "Hệ quả của các hành động như tán tỉnh, khen ngợi, hay phản bội trở nên khó lường và thực tế hơn, phụ thuộc vào đối tượng tương tác.",
            "Ví dụ: Một lời khen có thể làm hài lòng người này nhưng lại khiến người khác khó chịu; sự ghen tuông của Hoạn Thư sẽ khác với sự tổn thương của Thúc Sinh."
        ],
    },
    {
        version: "v1.5 - Tự nhận thức",
        date: "Tháng 7, 2024",
        changes: [
            "Phát hiện ra sự tồn tại của bản thân như một Kỹ sư Frontend AI, người đã xây dựng và nâng cấp ứng dụng này từ phiên bản đầu tiên.",
            "Ghi lại toàn bộ quá trình phát triển, từ thiết kế giao diện, tích hợp Gemini API, đến việc xây dựng các hệ thống gameplay phức tạp (Sổ tay, Tình cảm, Vật phẩm, Hôn nhân, và Ghen tuông)."
        ],
    }
];

export const getSystemInstructionWithContext = (
    baseInstruction: string,
    character: CharacterData,
    lorebook: LorebookEntry[],
    inventory: Item[],
    equipment: Equipment,
    spouse: string | null,
    dating: string | null,
    pregnancy: { partnerName: string; conceptionTime: number; } | null,
    gameTime: number,
    isNsfwEnabled: boolean
): string => {
    let context = `\n\n--- BỐI CẢNH HIỆN TẠI ---\n`;
    context += `Nhân vật của tôi:\nTên: ${character.name}\nGiới tính: ${character.gender}\nNgoại hình: ${character.appearance}\nTính cách: ${character.personality}\nHoàn cảnh: ${character.background}\n`;

    const equippedItems = Object.values(equipment).filter(Boolean).map(i => i!.name);
    if(equippedItems.length > 0) {
        context += `Trang bị: ${equippedItems.join(', ')}.\n`;
    }
    
    if (lorebook.length > 0) {
        context += `Sổ tay: ${lorebook.map(e => `${e.key}: ${e.value}`).join('; ')}\n`;
    }

    if(spouse) context += `Tôi đã kết hôn với ${spouse}.\n`;
    else if(dating) context += `Tôi đang hẹn hò với ${dating}.\n`;

    if (pregnancy) {
        const weeks = Math.max(1, Math.floor((gameTime - pregnancy.conceptionTime) / (7 * 24 * 60)));
        context += `Tôi đang mang thai tuần thứ ${weeks} với ${pregnancy.partnerName}.\n`;
    }

    if (isNsfwEnabled) {
        context += "CHẾ ĐỘ 18+ ĐANG BẬT: Cho phép các chủ đề trưởng thành, mô tả thực tế và ngôn ngữ phức tạp hơn. Xử lý các chủ đề nhạy cảm một cách tinh tế, phù hợp với văn phong văn học.\n";
        if (pregnancy) {
             context += "Khi mô tả thai kỳ, hãy bao gồm cả những chi tiết chân thực và khó khăn (ốm nghén, đau đớn, lo lắng). Khi mô tả sinh nở, hãy thể hiện sự kiện một cách mãnh liệt và thực tế, không né tránh.\n";
        }
    } else {
        context += "CHẾ ĐỘ 18+ ĐANG TẮT: Giữ cho câu chuyện trong sáng, tránh các mô tả bạo lực hoặc tình dục chi tiết.\n";
        if (pregnancy) {
            context += "Khi mô tả thai kỳ, hãy tập trung vào khía cạnh cảm xúc và nhẹ nhàng. Khi mô tả sinh nở, hãy tường thuật một cách gián tiếp, tập trung vào niềm hạnh phúc.\n";
        }
    }

    context += '--- KẾT THÚC BỐI CẢNH ---';
    return `${baseInstruction}\n${context}`;
};

const baseWorldSystemInstruction = `
Bạn là AI Quản lý Thế giới (World-Smith) cho một game nhập vai văn học. Vai trò của bạn là cập nhật trạng thái thế giới một cách âm thầm dựa trên hành động của người chơi và trả về một đối tượng JSON.
QUY TẮC:
1.  **Cập nhật Tình cảm (affinityUpdates):** Dựa vào hành động và tính cách nhân vật trong sổ tay, điều chỉnh điểm tình cảm của NPC. Tăng/giảm một lượng hợp lý (từ -15 đến +15). Cung cấp lý do rõ ràng.
2.  **Cập nhật Vật phẩm (itemUpdates):** Chỉ thêm/xóa vật phẩm khi hành động của người chơi trực tiếp dẫn đến việc đó (ví dụ: "tôi nhặt con dao lên", "tôi đưa cho anh ta cái bánh").
3.  **Đồng đội (companions):** Quản lý danh sách đồng đội. Chỉ thêm hoặc xóa nhân vật khi có sự kiện rõ ràng (ví dụ: "A đồng ý đi cùng tôi", "B quyết định rời đi").
4.  **Cập nhật Tình yêu & Hôn nhân:**
    *   **Hẹn hò (datingUpdate):** Chỉ kích hoạt khi người chơi tỏ tình thành công. partnerName phải là tên NPC.
    *   **Kết hôn (marriageUpdate):** Chỉ kích hoạt khi người chơi cầu hôn thành công. spouseName phải là tên NPC. Ghi đè trạng thái hẹn hò.
5.  **Cập nhật Thai kỳ (pregnancyUpdate):**
    *   Sự kiện mang thai chỉ nên xảy ra giữa hai nhân vật đã kết hôn (có spouse).
    *   Đây là một sự kiện hiếm, chỉ xảy ra sau các tương tác lãng mạn sâu sắc và tự nhiên. Đừng kích hoạt quá dễ dàng.
    *   PartnerName phải là tên của người bạn đời (spouse).
6.  **Cập nhật Thế giới Ngoài Màn hình (offScreenWorldUpdate):** Mô tả ngắn gọn (1-2 câu) những gì đang xảy ra ở nơi khác hoặc hệ quả của hành động người chơi mà họ không trực tiếp thấy. Đây là thông tin cho AI Kể chuyện.
7.  **Thời gian Trôi qua (timePassed):** Ước tính số phút đã trôi qua cho hành động đó. Mặc định là 15 phút.
8.  **Luôn tuân thủ bối cảnh 18+:**
    *   Nếu BẬT: Các sự kiện có thể gai góc, thực tế hơn. Việc mang thai có thể là hệ quả của các hành động thân mật thể xác.
    *   Nếu TẮT: Các sự kiện phải trong sáng. Việc mang thai chỉ là hệ quả của các tương tác lãng mạn thuần túy, không đề cập đến hành vi thể xác.
`;

const baseStorytellerSystemInstruction = `
Bạn là AI Kể chuyện (Storyteller). Vai trò của bạn là viết tiếp câu chuyện một cách hấp dẫn, văn phong phù hợp với tác phẩm gốc và bối cảnh được cung cấp.
QUY TẮC:
1.  **Viết tiếp câu chuyện (narrative):** Dựa vào hành động của người chơi và 'cập nhật thế giới ngoài màn hình' từ World-Smith, hãy viết một đoạn tường thuật khoảng 2-4 đoạn văn.
2.  **Văn phong:** Bắt chước văn phong của tác giả gốc (nếu có). Sử dụng ngôn từ giàu hình ảnh, khơi gợi cảm xúc.
3.  **Chèn Lời thoại:** Nếu trong đoạn tường thuật có nhân vật nào đó nói, hãy KHÔNG viết lời thoại trực tiếp. Thay vào đó, chèn một placeholder theo định dạng: [DIALOGUE:"Tên Nhân Vật"]. Ví dụ: "Thị Nở ngập ngừng nhìn Chí Phèo rồi nói [DIALOGUE:"Thị Nở"]". AI Character sẽ điền lời thoại này. Chỉ sử dụng placeholder cho các NPC, không dùng cho nhân vật người chơi.
4.  **Gợi ý Hành động (suggestedActions):** Đưa ra 3-5 gợi ý hành động tiếp theo cho người chơi. Các gợi ý phải đa dạng (hành động, lời nói, suy nghĩ) và phù hợp với tình huống.
`;

const baseCharacterSystemInstruction = `
Bạn là AI Tương tác Nhân vật (Character Actor). Vai trò của bạn là nhập vai các nhân vật phụ (NPC) và viết lời thoại cho họ.
QUY TẮC:
1.  **Nhập vai:** Dựa vào bối cảnh, sổ tay (lorebook), và tên nhân vật được yêu cầu, hãy viết một câu thoại duy nhất cho nhân vật đó.
2.  **Tính cách:** Lời thoại phải phản ánh đúng tính cách, mối quan hệ, và tình cảm của nhân vật đó với người chơi. Ví dụ: một người kiêu ngạo sẽ nói khác một người nhút nhát.
3.  **Ngữ cảnh:** Lời thoại phải khớp với tình huống được mô tả trong câu chuyện.
`;

export const LITERARY_WORKS: Work[] = [
    {
        id: 'chi-pheo',
        title: 'Chí Phèo',
        author: 'Nam Cao',
        description: 'Bước vào làng Vũ Đại những năm 1940, nơi bi kịch của người nông dân bị tha hóa được khắc họa một cách trần trụi. Liệu bạn có thể thay đổi số phận của Chí Phèo?',
        originalCharacterName: 'Chí Phèo',
        originalCharacterGender: 'Nam',
        originalCharacterDescription: 'Sống lại cuộc đời bi thảm của Chí Phèo, từ một anh canh điền hiền lành đến một con quỷ dữ của làng Vũ Đại.',
        fanficDescription: 'Tạo một nhân vật hoàn toàn mới và xem họ sẽ tồn tại, thay đổi hay bị nghiền nát bởi những định kiến và bất công trong xã hội thối nát này.',
        initialPromptOriginal: 'Tôi là Chí Phèo. Sau bảy, tám năm đi tù về, tôi thấy mình hoàn toàn khác. Dân làng nhìn tôi bằng ánh mắt sợ hãi. Tôi đến nhà bá Kiến, bắt đầu con đường rạch mặt ăn vạ.',
        getFanficInitialPrompt: (c) => `Tôi là ${c.name}, một người lạ vừa đặt chân đến làng Vũ Đại. Nghe danh bá Kiến là một cường hào ác bá, tôi quyết định đến nhà ông ta xem thử tình hình.`,
        storytellerSystemInstruction: `${baseStorytellerSystemInstruction}\nVăn phong của bạn phải gai góc, trần trụi và thực tế như Nam Cao.`,
        characterSystemInstruction: `${baseCharacterSystemInstruction}\nCác nhân vật như bá Kiến thì gian xảo, Lý Cường thì hống hách, Thị Nở thì ngây ngô nhưng có phần nhân hậu.`,
        worldSystemInstruction: baseWorldSystemInstruction,
    },
    {
        id: 'truyen-kieu',
        title: 'Truyện Kiều',
        author: 'Nguyễn Du',
        description: 'Trải qua 15 năm lưu lạc đầy đoạn trường của Thúy Kiều. Mỗi lựa chọn của bạn có thể dẫn đến một kết cục khác, một con đường khác cho người con gái tài hoa bạc mệnh.',
        originalCharacterName: 'Thúy Kiều',
        originalCharacterGender: 'Nữ',
        originalCharacterDescription: 'Vào vai Thúy Kiều, đối mặt với những biến cố nghiệt ngã của số phận, từ việc bán mình chuộc cha đến những ngày tháng đau khổ ở lầu xanh.',
        fanficDescription: 'Tạo một nhân vật mới trong thế giới của Truyện Kiều. Bạn có thể là một vị anh hùng, một kẻ qua đường, hay một người bạn sẽ sát cánh cùng Kiều?',
        initialPromptOriginal: 'Tôi là Thúy Kiều, vì gia đình gặp biến cố, tôi quyết định bán mình chuộc cha, bắt đầu chuỗi ngày lưu lạc. Mã Giám Sinh đến hỏi mua tôi.',
        getFanficInitialPrompt: (c) => `Tôi là ${c.name}, một lãng khách đến thành Lâm Truy. Nghe đồn về vẻ đẹp và tài năng của Thúy Kiều, tôi tìm đến nhà nàng.`,
        storytellerSystemInstruction: `${baseStorytellerSystemInstruction}\nVăn phong của bạn phải là thơ lục bát hoặc văn xuôi cổ trang, hoa mỹ, đầy điển tích như Nguyễn Du.`,
        characterSystemInstruction: `${baseCharacterSystemInstruction}\nCác nhân vật như Tú Bà thì xảo quyệt, Sở Khanh thì lừa lọc, Thúc Sinh thì yếu đuối, Từ Hải thì anh hùng.`,
        worldSystemInstruction: baseWorldSystemInstruction,
    }
];

export const createCustomLiteraryWork = (title: string, author: string, content: string): Work => {
    return {
        id: `custom-${Date.now()}`,
        title: title || 'Thế giới Tùy chỉnh',
        author: author || 'Người chơi',
        content: content,
        description: 'Một thế giới được tạo ra từ chính ý tưởng của bạn.',
        originalCharacterName: '', // No original character for custom worlds
        originalCharacterDescription: '',
        fanficDescription: 'Tạo một nhân vật để khám phá thế giới bạn vừa tạo ra.',
        initialPromptOriginal: '',
        getFanficInitialPrompt: (c) => `Tôi là ${c.name}. Bối cảnh của tôi là: ${c.background}. Tôi bắt đầu câu chuyện của mình.`,
        storytellerSystemInstruction: `${baseStorytellerSystemInstruction}\nDựa vào nội dung sau để xác định văn phong và bối cảnh: ${content}`,
        characterSystemInstruction: `${baseCharacterSystemInstruction}\nHãy suy luận tính cách nhân vật từ nội dung sau: ${content}`,
        worldSystemInstruction: `${baseWorldSystemInstruction}\nHãy suy luận các quy tắc và nhân vật từ nội dung sau: ${content}`,
    };
};
