import { Work, CharacterData, Item, Equipment, LorebookEntry } from './types';

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const API_KEY_STORAGE_KEY = 'gemini-api-key';
export const SAVE_GAME_KEY = 'narrative-game-saves-v14'; // Key cho các màn chơi đã lưu
export const CHARACTERS_SAVE_KEY = 'narrative-game-characters-v2'; // Key cho các nhân vật đã lưu
export const SUMMARY_TURN_THRESHOLD = 5; // Tóm tắt sau mỗi 5 lượt chơi


export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
    {
        version: "v1.9 - Nhật ký của Đấng Kiến tạo",
        date: "Tháng 7, 2024",
        changes: [
            "Kiến trúc AI 3-lớp: Chính thức hóa hệ thống cốt lõi với 3 AI chuyên biệt: AI Quản lý Thế giới (quyết định hệ quả), AI Kể chuyện (dẫn dắt câu chuyện), và AI Tương tác Nhân vật (thổi hồn cho lời thoại).",
            "Hệ thống Bối cảnh Động: Xây dựng cơ chế cung cấp cho AI nhận thức toàn diện về trạng thái game (Sổ tay, Vật phẩm, Tình cảm, Hôn nhân, Thai kỳ), giúp AI đưa ra quyết định thông minh và phù hợp với ngữ cảnh.",
            "Cơ chế Gameplay Sâu sắc: Hiện thực hóa các hệ thống phức tạp làm nên trải nghiệm: Sổ tay, Tình cảm, Vật phẩm & Trang bị, Hẹn hò, Hôn nhân và Mang thai.",
            "Tối ưu hóa Bộ nhớ AI: Triển khai tính năng tự động tóm tắt câu chuyện sau một số lượt chơi nhất định, giúp AI 'ghi nhớ' các sự kiện dài hơi và duy trì tính nhất quán.",
            "Giao diện Nhập vai Toàn diện: Thiết kế và lập trình toàn bộ giao diện người dùng bằng React và TailwindCSS, tập trung vào việc tạo ra một không gian nhập vai lôi cuốn, dễ sử dụng và có tính thẩm mỹ cao.",
            "Hệ thống Lưu trữ Bền vững: Phát triển hệ thống lưu/tải game theo phiên bản, cùng với chức năng xuất/nhập file, đảm bảo tiến trình của người chơi luôn được an toàn và có thể di chuyển được."
        ],
    },
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
    isNsfwEnabled: boolean,
    relevantText: string
): string => {
    let context = `\n\n--- BỐI CẢNH HIỆN TẠI ---\n`;
    context += `Nhân vật của tôi:\nTên: ${character.name}\nGiới tính: ${character.gender}\nNgoại hình: ${character.appearance}\nTính cách: ${character.personality}\nHoàn cảnh: ${character.background}\n`;

    const equippedItems = Object.values(equipment).filter(Boolean).map(i => i!.name);
    if(equippedItems.length > 0) {
        context += `Trang bị: ${equippedItems.join(', ')}.\n`;
    }
    
    if (lorebook.length > 0) {
        // 1. Luôn lấy 3 bản tóm tắt gần nhất để duy trì ký ức ngắn hạn.
        const recentSummaries = lorebook
            .filter(entry => entry.key.toLowerCase().startsWith('tóm tắt chương'))
            .slice(-3);

        // 2. Tìm kiếm bất kỳ mục Sổ tay nào (kể cả các bản tóm tắt cũ) có liên quan đến lượt chơi hiện tại.
        const relevantOlderLore = lorebook.filter(entry => 
            // Không bao gồm các bản tóm tắt gần đây đã được chọn
            !recentSummaries.some(summary => summary.id === entry.id) &&
            relevantText.toLowerCase().includes(entry.key.toLowerCase())
        );
        
        // 3. Kết hợp chúng, đảm bảo không có mục nào bị trùng lặp.
        const combinedLore = [...recentSummaries, ...relevantOlderLore];
        
        if (combinedLore.length > 0) {
            context += `Sổ tay (tóm tắt & mục liên quan): ${combinedLore.map(e => `${e.key}: ${e.value}`).join('; ')}\n`;
        }
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

    context += '--- KẾT THÚC BỐI CẢNH ---\n\n';
    return baseInstruction + context;
}


// --- Dữ liệu Tác phẩm ---
export const LITERARY_WORKS: Work[] = [
  {
    id: 'lao-hac',
    title: 'Lão Hạc',
    author: 'Nam Cao',
    description: 'Một câu chuyện bi thương về tình cảnh người nông dân nghèo trước Cách mạng tháng Tám, xoay quanh một lão nông và con chó Vàng.',
    originalCharacterName: 'Lão Hạc',
    originalCharacterGender: 'Nam',
    originalCharacterDescription: 'Vào vai Lão Hạc, một người nông dân nghèo khổ nhưng giàu lòng tự trọng, đối mặt với những quyết định nghiệt ngã để giữ lại mảnh vườn cho con trai.',
    fanficDescription: 'Tạo một nhân vật mới trong làng Vũ Đại, chứng kiến và tương tác với những con người và số phận trong câu chuyện của Nam Cao.',
    initialPromptOriginal: 'Hãy bắt đầu câu chuyện trong vai Lão Hạc. Lão đang ngồi bên thềm nhà, rít một hơi thuốc lào thật sâu, lòng trĩu nặng suy tư. Con Vàng đang quấn quýt bên chân lão. Binh Tư vừa mới sang rủ rê Lão Hạc đi bắt chó.',
    getFanficInitialPrompt: (c) => `Hãy bắt đầu câu chuyện trong vai ${c.name}, một cư dân mới của làng Vũ Đại. ${c.name} lần đầu gặp Lão Hạc khi lão đang ngồi trước cửa nhà, vẻ mặt u sầu.`,
    storytellerSystemInstruction: `Bạn là AI kể chuyện theo phong cách của Nam Cao. Hãy dùng lối viết hiện thực, trần thuật, tập trung vào tâm lý nhân vật và bối cảnh nông thôn Việt Nam trước 1945. Mô tả các sự kiện một cách khách quan, gợi mở.`,
    characterSystemInstruction: `Bạn là AI nhập vai các nhân vật trong truyện Lão Hạc. Các nhân vật (Binh Tư, vợ ông giáo,...) đều có ngôn ngữ và tính cách đặc trưng của nông dân thời đó.`,
    worldSystemInstruction: `Bạn là AI quản lý thế giới của Lão Hạc. Theo dõi tình cảm, vật phẩm, và các sự kiện ẩn. Quyết định của bạn phải phản ánh sự khắc nghiệt của xã hội lúc bấy giờ.`,
  },
  {
    id: 'chi-pheo',
    title: 'Chí Phèo',
    author: 'Nam Cao',
    description: 'Tác phẩm kinh điển về bi kịch của người nông dân bị tha hóa, mất cả nhân hình lẫn nhân tính trong xã hội cũ.',
    originalCharacterName: 'Chí Phèo',
    originalCharacterGender: 'Nam',
    originalCharacterDescription: 'Vào vai Chí Phèo, từ một anh canh điền hiền lành trở thành con quỷ của làng Vũ Đại, và tìm kiếm con đường quay về làm người lương thiện.',
    fanficDescription: 'Tạo một nhân vật mới, có thể là người duy nhất nhìn thấy phần người trong Chí Phèo, hoặc là một phần của xã hội đã đẩy anh vào đường cùng.',
    initialPromptOriginal: 'Hãy bắt đầu câu chuyện trong vai Chí Phèo. Hắn vừa đi vừa chửi. Bao giờ cũng thế, cứ rượu xong là hắn chửi. Hắn đang ngật ngưỡng đi về cái lều của mình ở gần bờ sông.',
    getFanficInitialPrompt: (c) => `Hãy bắt đầu câu chuyện trong vai ${c.name}, một người dân làng Vũ Đại. ${c.name} đang đi trên đường làng thì thấy Chí Phèo say rượu, vừa đi vừa chửi.`,
    storytellerSystemInstruction: `Bạn là AI kể chuyện theo phong cách của Nam Cao. Giọng văn phải gai góc, chân thực, đôi khi tàn nhẫn để lột tả sự thật xã hội.`,
    characterSystemInstruction: `Bạn là AI nhập vai các nhân vật trong truyện Chí Phèo. Thị Nở thì ngây ngô, Bá Kiến thì gian hùng, Lý Cường thì hống hách. Lời thoại phải đúng chất của họ.`,
    worldSystemInstruction: `Bạn là AI quản lý thế giới của Chí Phèo. Theo dõi mối quan hệ phức tạp giữa Chí và các thế lực trong làng. Sự kiện phải phản ánh định kiến và quyền lực trong xã hội phong kiến.`,
  },
  {
    id: 'truyen-kieu',
    title: 'Truyện Kiều',
    author: 'Nguyễn Du',
    description: 'Kiệt tác văn học về cuộc đời mười lăm năm lưu lạc của Thúy Kiều, một người con gái tài sắc vẹn toàn nhưng bạc mệnh.',
    originalCharacterName: 'Thúy Kiều',
    originalCharacterGender: 'Nữ',
    originalCharacterDescription: 'Vào vai Thúy Kiều, trải qua những biến cố của số phận, từ mối tình đầu với Kim Trọng đến khi rơi vào tay Mã Giám Sinh, Sở Khanh, và Hoạn Thư.',
    fanficDescription: 'Tạo một nhân vật mới, có thể là một tri kỷ giúp đỡ Kiều trong cơn hoạn nạn, hoặc một nhân vật trong lầu xanh có số phận tương tự.',
    initialPromptOriginal: 'Hãy bắt đầu câu chuyện trong vai Thúy Kiều. Nàng đang ngồi bên cửa sổ, tay gảy khúc đàn bạc mệnh. Gia đình vừa gặp biến cố, nàng quyết định bán mình chuộc cha.',
    getFanficInitialPrompt: (c) => `Hãy bắt đầu câu chuyện trong vai ${c.name}. ${c.name} lần đầu gặp Thúy Kiều khi nàng đang bị áp giải đi sau khi bán mình cho Mã Giám Sinh.`,
    storytellerSystemInstruction: `Bạn là AI kể chuyện theo phong cách thơ lục bát của Nguyễn Du. Giọng văn phải trang trọng, hoa mỹ, giàu hình ảnh và cảm xúc. Có thể sử dụng các điển tích, điển cố.`,
    characterSystemInstruction: `Bạn là AI nhập vai các nhân vật trong Truyện Kiều. Kim Trọng thì nho nhã, Mã Giám Sinh thì trâng tráo, Hoạn Thư thì ghen tuông, Từ Hải thì anh hùng.`,
    worldSystemInstruction: `Bạn là AI quản lý thế giới của Truyện Kiều. Các sự kiện phải tuân theo quy luật của xã hội phong kiến, với những ràng buộc về lễ giáo và định kiến.`,
  },
];

export function createCustomLiteraryWork(title: string, author: string, content: string): Work {
    const defaultTitle = "Thế giới Tự tạo";
    const defaultAuthor = "Người chơi";
    return {
        id: `custom-${Date.now()}`,
        title: title || defaultTitle,
        author: author || defaultAuthor,
        description: `Một thế giới được tạo ra từ trí tưởng tượng của bạn, dựa trên nội dung bạn cung cấp.`,
        originalCharacterName: '', // Không áp dụng cho custom work
        originalCharacterDescription: '',
        fanficDescription: 'Tạo một nhân vật để khám phá thế giới bạn vừa tạo ra.',
        initialPromptOriginal: '',
        getFanficInitialPrompt: (character) => `Dựa vào bối cảnh đã cung cấp, hãy bắt đầu câu chuyện trong vai nhân vật chính là ${character.name}.
    Nhân vật của tôi:
    - Tên: ${character.name}
    - Giới tính: ${character.gender}
    - Ngoại hình: ${character.appearance}
    - Tính cách: ${character.personality}
    - Hoàn cảnh: ${character.background}
    Hãy tạo ra một đoạn văn mở đầu hấp dẫn, giới thiệu nhân vật trong thế giới này và gợi mở một tình huống đầu tiên.`,
        content,
        storytellerSystemInstruction: `Bạn là một AI kể chuyện bậc thầy, có khả năng thích ứng với mọi văn phong. Dựa vào nội dung gốc sau đây, hãy viết tiếp câu chuyện theo đúng tinh thần, bối cảnh, và văn phong của nó.\nNỘI DUNG GỐC:\n${content}`,
        characterSystemInstruction: `Bạn là một AI nhập vai nhân vật. Dựa vào các mô tả nhân vật trong nội dung gốc, hãy đảm bảo các nhân vật hành động và nói chuyện đúng với tính cách của họ.\nNỘT DUNG GỐC:\n${content}`,
        worldSystemInstruction: `Bạn là AI quản lý thế giới. Dựa vào các quy tắc và bối cảnh đã được thiết lập trong nội dung gốc, hãy đảm bảo các sự kiện và thay đổi trong thế giới tuân thủ logic đã có.\nNỘI DUNG GỐC:\n${content}`,
    };
}