export const GameStatus = {
    ApiKeyEntry: 'ApiKeyEntry',
    WorkSelection: 'WorkSelection',
    WorldCreation: 'WorldCreation',
    Start: 'Start',
    CharacterCreation: 'CharacterCreation',
    Loading: 'Loading',
    StoryStarting: 'StoryStarting',
    Playing: 'Playing',
    Error: 'Error'
} as const;

export const AIType = {
    Storyteller: 'Storyteller',
    Character: 'Character',
    World: 'World'
} as const;

export type AITypeKey = keyof typeof AIType;

// Dữ liệu nhân vật, không đổi
export interface CharacterData {
    name: string;
    gender: string;
    appearance: string;
    personality: string;
    background: string;
}

// Lưu trữ nhân vật có ID
export interface Character extends CharacterData {
    id: string;
}


export interface Work {
    id: string;
    title: string;
    author: string;
    description: string;
    originalCharacterName: string;
    originalCharacterGender?: 'Nam' | 'Nữ' | 'Khác';
    originalCharacterDescription: string;
    fanficDescription: string;
    initialPromptOriginal: string;
    content?: string;
    getFanficInitialPrompt: (character: CharacterData) => string;
    storytellerSystemInstruction: string;
    characterSystemInstruction: string;
    worldSystemInstruction: string;
}

export interface HistoryMessage {
    id: string;
    role: 'user' | 'model';
    content: string;
    speaker?: string; // Ví dụ: "Chí Phèo", "Người dẫn chuyện"
    aiType?: AITypeKey;
}

export interface LorebookEntry {
    id:string;
    key: string;
    value: string;
}

export interface AffinityUpdate {
    npcName: string;
    change: number;
    reason: string;
}

export type AffinityData = Record<string, number>;

// --- Hệ thống Vật phẩm và Trang bị ---
export type ItemType = 'equipment' | 'consumable' | 'key';

export interface Item {
    id: string;
    name: string;
    description: string;
    type: ItemType;
}

export type EquipmentSlot = 'weapon' | 'armor';
export type Equipment = Record<EquipmentSlot, Item | null>;

export interface ItemUpdate {
    action: 'add' | 'remove';
    item: {
        name: string;
        description: string;
        type: ItemType;
    };
}

export interface LastTurnInfo {
    prompt: string;
    previousWorldUpdate: string | null;
}

// --- HỆ THỐNG LƯU TRỮ MỚI ---
export interface GameState {
    id: string; // ID duy nhất cho mỗi bản lưu
    character: CharacterData;
    history: HistoryMessage[];
    lorebook: LorebookEntry[];
    affinity: AffinityData;
    inventory: Item[];
    equipment: Equipment;
    companions: string[];
    dating: string | null;
    spouse: string | null;
    pregnancy: { partnerName: string; conceptionTime: number; } | null;
    gameTime: number;
    offScreenWorldUpdate: string | null;
    lastTurnInfo: LastTurnInfo | null;
    isNsfwEnabled: boolean;
    suggestedActions: string[];
    // Dữ liệu về tác phẩm được lưu dưới dạng có thể tuần tự hóa
    selectedWorkId: string;
    customWorkData?: {
        title: string;
        author: string;
        content: string;
    };
}

export interface SaveSlot {
    id: string;
    version: string;
    timestamp: number;
    characterName: string;
    workTitle: string;
    gameState: GameState;
}