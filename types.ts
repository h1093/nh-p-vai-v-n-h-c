export const GameStatus = {
    ApiKeyEntry: 'ApiKeyEntry',
    WorkSelection: 'WorkSelection',
    WorldCreation: 'WorldCreation',
    Start: 'Start',
    CharacterCreation: 'CharacterCreation',
    Loading: 'Loading',
    Playing: 'Playing',
    Error: 'Error'
} as const;

export interface Character {
    id: string;
    name: string;
    appearance: string;
    personality: string;
    background: string;
}

export interface CharacterData {
    name: string;
    appearance: string;
    personality: string;
    background: string;
}

export interface Work {
    id: string;
    title: string;
    author: string;
    description: string;
    originalCharacterName: string;
    originalCharacterDescription: string;
    fanficDescription: string;
    initialPromptOriginal: string;
    content?: string;
    getFanficInitialPrompt: (character: CharacterData) => string;
    systemInstruction: string;
}

export interface HistoryMessage {
    id: string;
    role: 'user' | 'model';
    content: string;
}

export interface LorebookEntry {
    id: string;
    key: string;
    value: string;
}

export interface LorebookSuggestion {
    key: string;
    value: string;
}