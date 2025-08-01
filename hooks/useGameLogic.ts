import { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

import {
    GameStatus, Work, CharacterData, HistoryMessage, LorebookEntry, AffinityData, Item, Equipment, EquipmentSlot, AITypeKey, LastTurnInfo,
    Character, GameState, SaveSlot, Goal
} from '../types';
import {
    LITERARY_WORKS, createCustomLiteraryWork, API_KEY_STORAGE_KEY, SAVE_GAME_KEY, CHARACTERS_SAVE_KEY, CHANGELOG_ENTRIES, SUMMARY_TURN_THRESHOLD
} from '../constants';
import { generateStorySegment, StorySegmentResult, generateSummary, generateBackgroundSuggestions } from '../services/geminiService';

const initialEquipment: Equipment = { weapon: null, armor: null };
const CURRENT_SAVE_VERSION = "v14";

/**
 * Áp dụng các thay đổi trạng thái thế giới từ AI vào trạng thái trò chơi.
 * Hàm này đóng gói logic để cập nhật các biến trạng thái khác nhau,
 * làm cho logic trò chơi chính sạch hơn và module hóa hơn.
 * @param changes Đối tượng worldStateChanges từ AI.
 * @param setters Một đối tượng chứa tất cả các hàm thiết lập trạng thái.
 * @param currentState Một đối tượng chứa các giá trị trạng thái hiện tại cần thiết cho logic.
 */
const applyWorldStateChanges = (
    changes: StorySegmentResult['worldStateChanges'],
    setters: {
        setAffinity: React.Dispatch<React.SetStateAction<AffinityData>>,
        setInventory: React.Dispatch<React.SetStateAction<Item[]>>,
        setCompanions: React.Dispatch<React.SetStateAction<string[]>>,
        setDating: React.Dispatch<React.SetStateAction<string | null>>,
        setSpouse: React.Dispatch<React.SetStateAction<string | null>>,
        setPregnancy: React.Dispatch<React.SetStateAction<{ partnerName: string; conceptionTime: number; } | null>>,
        setOffScreenWorldUpdate: React.Dispatch<React.SetStateAction<string | null>>,
        setGameTime: React.Dispatch<React.SetStateAction<number>>
    },
    currentState: {
        pregnancy: { partnerName: string; conceptionTime: number; } | null,
        gameTime: number
    }
) => {
    const { 
        affinityUpdates, 
        itemUpdates, 
        companions, 
        datingUpdate, 
        marriageUpdate, 
        pregnancyUpdate, 
        offScreenWorldUpdate, 
        timePassed 
    } = changes;

    if (affinityUpdates && affinityUpdates.length > 0) {
        setters.setAffinity(prev => affinityUpdates.reduce((acc, u) => ({
            ...acc,
            [u.npcName]: Math.max(-100, Math.min(100, (acc[u.npcName] || 0) + u.change))
        }), { ...prev }));
    }

    if (itemUpdates && itemUpdates.length > 0) {
        setters.setInventory(prev => {
            let newInv = [...prev];
            itemUpdates.forEach(u => {
                if (u.action === 'add') {
                    newInv.push({ ...u.item, id: `item-${Date.now()}-${Math.random()}` });
                } else {
                    const idx = newInv.findIndex(i => i.name.toLowerCase() === u.item.name.toLowerCase());
                    if (idx > -1) newInv.splice(idx, 1);
                }
            });
            return newInv;
        });
    }
    
    if (companions) setters.setCompanions(companions);
    if (datingUpdate?.partnerName) setters.setDating(datingUpdate.partnerName);
    if (marriageUpdate?.spouseName) {
        setters.setSpouse(marriageUpdate.spouseName);
        setters.setDating(null); // Khi đã kết hôn, ngừng hẹn hò
    }
    if (pregnancyUpdate?.partnerName && !currentState.pregnancy) {
        setters.setPregnancy({ 
            partnerName: pregnancyUpdate.partnerName, 
            conceptionTime: currentState.gameTime 
        });
    }

    setters.setOffScreenWorldUpdate(offScreenWorldUpdate);
    setters.setGameTime(prev => prev + (timePassed || 15));
};

/**
 * Tải trạng thái từ một đối tượng GameState vào các state hook của React.
 * Hàm này đóng gói logic để thiết lập các state riêng lẻ,
 * làm cho logic tải game chính sạch hơn.
 * @param gameState Đối tượng GameState chứa dữ liệu cần tải.
 * @param setters Một đối tượng chứa tất cả các hàm thiết lập state.
 * @returns Work object nếu thành công, null nếu thất bại.
 */
const loadStateFromGameState = (
    gameState: GameState,
    setters: {
        setSelectedWork: React.Dispatch<React.SetStateAction<Work | null>>,
        setCharacter: React.Dispatch<React.SetStateAction<CharacterData | null>>,
        setHistory: React.Dispatch<React.SetStateAction<HistoryMessage[]>>,
        setLorebook: React.Dispatch<React.SetStateAction<LorebookEntry[]>>,
        setAffinity: React.Dispatch<React.SetStateAction<AffinityData>>,
        setInventory: React.Dispatch<React.SetStateAction<Item[]>>,
        setEquipment: React.Dispatch<React.SetStateAction<Equipment>>,
        setCompanions: React.Dispatch<React.SetStateAction<string[]>>,
        setDating: React.Dispatch<React.SetStateAction<string | null>>,
        setSpouse: React.Dispatch<React.SetStateAction<string | null>>,
        setPregnancy: React.Dispatch<React.SetStateAction<{ partnerName: string; conceptionTime: number; } | null>>,
        setGameTime: React.Dispatch<React.SetStateAction<number>>,
        setOffScreenWorldUpdate: React.Dispatch<React.SetStateAction<string | null>>,
        setLastTurnInfo: React.Dispatch<React.SetStateAction<LastTurnInfo | null>>,
        setIsNsfwEnabled: React.Dispatch<React.SetStateAction<boolean>>,
        setActiveSaveId: React.Dispatch<React.SetStateAction<string | null>>,
        setSuggestedActions: React.Dispatch<React.SetStateAction<string[]>>,
        setTurnCount: React.Dispatch<React.SetStateAction<number>>,
        setGoals: React.Dispatch<React.SetStateAction<Goal[]>>,
        setStatus: React.Dispatch<React.SetStateAction<keyof typeof GameStatus>>,
    }
): Work | null => {
    let work: Work | undefined = LITERARY_WORKS.find(w => w.id === gameState.selectedWorkId);
    if (!work && gameState.customWorkData) {
        work = createCustomLiteraryWork(gameState.customWorkData.title, gameState.customWorkData.author, gameState.customWorkData.content);
    }
    
    if (!work) {
        return null;
    }

    setters.setSelectedWork(work);
    setters.setCharacter(gameState.character);
    setters.setHistory(gameState.history);
    setters.setLorebook(gameState.lorebook);
    setters.setAffinity(gameState.affinity);
    setters.setInventory(gameState.inventory);
    setters.setEquipment(gameState.equipment);
    setters.setCompanions(gameState.companions);
    setters.setDating(gameState.dating);
    setters.setSpouse(gameState.spouse);
    setters.setPregnancy(gameState.pregnancy);
    setters.setGameTime(gameState.gameTime);
    setters.setOffScreenWorldUpdate(gameState.offScreenWorldUpdate);
    setters.setLastTurnInfo(gameState.lastTurnInfo);
    setters.setIsNsfwEnabled(gameState.isNsfwEnabled);
    setters.setActiveSaveId(gameState.id);
    setters.setSuggestedActions(gameState.suggestedActions || []);
    setters.setTurnCount(gameState.turnCount || 0);
    setters.setGoals(gameState.goals || []);
    setters.setStatus(GameStatus.Playing);

    return work;
};

export const useGameLogic = () => {
    // --- Core State ---
    const [status, setStatus] = useState<keyof typeof GameStatus>(GameStatus.Loading);
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeAI, setActiveAI] = useState<AITypeKey | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // --- Save Data State ---
    const [savedGames, setSavedGames] = useState<SaveSlot[]>([]);
    const [savedCharacters, setSavedCharacters] = useState<Character[]>([]);

    // --- Active Game State ---
    const [activeSaveId, setActiveSaveId] = useState<string | null>(null);
    const [selectedWork, setSelectedWork] = useState<Work | null>(null);
    const [character, setCharacter] = useState<CharacterData | null>(null);
    const [history, setHistory] = useState<HistoryMessage[]>([]);
    const [lastTurnInfo, setLastTurnInfo] = useState<LastTurnInfo | null>(null);
    const [isNsfwEnabled, setIsNsfwEnabled] = useState(false);
    const [lorebook, setLorebook] = useState<LorebookEntry[]>([]);
    const [affinity, setAffinity] = useState<AffinityData>({});
    const [inventory, setInventory] = useState<Item[]>([]);
    const [equipment, setEquipment] = useState<Equipment>(initialEquipment);
    const [companions, setCompanions] = useState<string[]>([]);
    const [dating, setDating] = useState<string | null>(null);
    const [spouse, setSpouse] = useState<string | null>(null);
    const [pregnancy, setPregnancy] = useState<{ partnerName: string; conceptionTime: number; } | null>(null);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [offScreenWorldUpdate, setOffScreenWorldUpdate] = useState<string | null>(null);
    const [gameTime, setGameTime] = useState(480); // Start at 8:00 AM
    const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
    const [turnCount, setTurnCount] = useState(0);
    const [isSummarizing, setIsSummarizing] = useState(false);

    // --- UI State ---
    const [isLorebookOpen, setIsLorebookOpen] = useState(false);
    const [isChangelogOpen, setIsChangelogOpen] = useState(false);
    const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);

    // --- EFFECT HOOKS for Initialization & Persistence ---

    // Load initial data and API key on mount
    useEffect(() => {
        try {
            // Show changelog on new version
            const lastVersion = localStorage.getItem('changelog-version');
            if (lastVersion !== CHANGELOG_ENTRIES[0].version) {
                setIsChangelogOpen(true);
                localStorage.setItem('changelog-version', CHANGELOG_ENTRIES[0].version);
            }
            
            // Load saves & characters
            const storedGames = localStorage.getItem(SAVE_GAME_KEY);
            if (storedGames) {
                const parsedGames = JSON.parse(storedGames);
                // Filter out old, incompatible saves
                const validGames = parsedGames.filter((g: SaveSlot) => g.version === CURRENT_SAVE_VERSION);
                setSavedGames(validGames);
            }
            const storedChars = localStorage.getItem(CHARACTERS_SAVE_KEY);
            if (storedChars) setSavedCharacters(JSON.parse(storedChars));

            // Setup API key
            const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
            if (savedKey) {
                setAi(new GoogleGenAI({ apiKey: savedKey }));
                setStatus(GameStatus.WorkSelection);
            } else {
                setStatus(GameStatus.ApiKeyEntry);
            }
        } catch (e) {
            console.error("Lỗi khởi tạo hoặc tải dữ liệu:", e);
            localStorage.clear();
            setStatus(GameStatus.ApiKeyEntry);
        }
    }, []);
    
    // Auto-save games to localStorage whenever the list changes
    useEffect(() => {
        try {
            localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(savedGames));
        } catch (e) {
            console.error("Lỗi khi lưu game:", e);
            setError("Không thể lưu tiến trình trò chơi vào bộ nhớ cục bộ. Có thể bộ nhớ đã đầy.");
        }
    }, [savedGames]);
    
    // Auto-save characters to localStorage whenever the list changes
    useEffect(() => {
        try {
            localStorage.setItem(CHARACTERS_SAVE_KEY, JSON.stringify(savedCharacters));
        } catch (e) {
            console.error("Lỗi khi lưu nhân vật:", e);
        }
    }, [savedCharacters]);
    
    // --- GAME STATE MANAGEMENT ---
    const resetFullGameState = useCallback(() => {
        setActiveSaveId(null);
        setSelectedWork(null);
        setCharacter(null);
        setHistory([]);
        setLorebook([]);
        setAffinity({});
        setInventory([]);
        setEquipment(initialEquipment);
        setCompanions([]);
        setDating(null);
        setSpouse(null);
        setPregnancy(null);
        setGoals([]);
        setLastTurnInfo(null);
        setOffScreenWorldUpdate(null);
        setIsNsfwEnabled(false);
        setSuggestedActions([]);
        setGameTime(480);
        setTurnCount(0);
    }, []);
    
    const handleAddLoreEntry = useCallback((entry: { key: string, value: string }) => setLorebook(prev => [...prev, { ...entry, id: `lore-${Date.now()}` }]), []);
    
    const processStoryResult = useCallback((result: StorySegmentResult) => {
        const { narrative, speaker, aiType, worldStateChanges, suggestedActions: newSuggestedActions } = result;

        const newModelMessage: HistoryMessage = {
            role: 'model',
            content: narrative,
            id: `model-${Date.now()}`,
            speaker: speaker,
            aiType: aiType,
        };
        setHistory(prev => [...prev, newModelMessage]);

        applyWorldStateChanges(
            worldStateChanges,
            {
                setAffinity,
                setInventory,
                setCompanions,
                setDating,
                setSpouse,
                setPregnancy,
                setOffScreenWorldUpdate,
                setGameTime,
            },
            { pregnancy, gameTime }
        );

        setSuggestedActions(newSuggestedActions || []);
        setTurnCount(prev => prev + 1);
    }, [pregnancy, gameTime]);
    
     // --- Automatic Summarization Effect ---
    useEffect(() => {
        if (turnCount >= SUMMARY_TURN_THRESHOLD && !isSummarizing) {
            setIsSummarizing(true);

            const runSummarization = async () => {
                if (!ai || !character) {
                    setIsSummarizing(false);
                    return;
                }
                
                const systemMessageId = `system-${Date.now()}`;
                const systemMessage: HistoryMessage = {
                    id: systemMessageId,
                    role: 'model',
                    content: 'Đang tóm tắt các sự kiện gần đây để AI ghi nhớ...',
                    speaker: 'Hệ thống'
                };
                setHistory(prev => [...prev, systemMessage]);
                
                try {
                    const historyToSummarize = history.slice(-(SUMMARY_TURN_THRESHOLD * 2));
                    const summary = await generateSummary(ai, historyToSummarize, character);
                    
                    const summaryCount = lorebook.filter(e => e.key.startsWith("Tóm tắt chương")).length;
                    const newSummaryEntry = {
                        key: `Tóm tắt chương ${summaryCount + 1}`,
                        value: summary,
                    };
                    handleAddLoreEntry(newSummaryEntry);

                    setHistory(prev => prev.map(msg => 
                        msg.id === systemMessageId 
                        ? { ...msg, content: 'Đã tóm tắt các sự kiện gần đây và lưu vào Sổ tay.' }
                        : msg
                    ));

                    setTurnCount(0);

                } catch (e) {
                    console.error("Lỗi khi tóm tắt câu chuyện:", e);
                    setHistory(prev => prev.map(msg => 
                        msg.id === systemMessageId 
                        ? { ...msg, content: 'Tóm tắt tự động thất bại. Sẽ thử lại sau.' }
                        : msg
                    ));
                } finally {
                    setIsSummarizing(false);
                }
            };
            
            runSummarization();
        }
    }, [turnCount, isSummarizing, ai, character, history, lorebook, handleAddLoreEntry]);


    // --- API CALLS ---
    const handleGenerateStory = useCallback(async (prompt: string, pwu: string | null) => {
        if (!ai || !selectedWork || !character) throw new Error("Game state not properly initialized.");
        
        setIsLoading(true);
        setError(null);
        setLastTurnInfo({ prompt, previousWorldUpdate: pwu });

        try {
            const result = await generateStorySegment(ai, prompt, selectedWork, character, lorebook, inventory, equipment, spouse, dating, pregnancy, gameTime, pwu, isNsfwEnabled, setActiveAI);
            processStoryResult(result);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định.";
            setError(errorMessage);
            setStatus(GameStatus.Error);
        } finally {
            setIsLoading(false);
            setActiveAI(null);
        }
    }, [ai, selectedWork, character, lorebook, inventory, equipment, spouse, dating, pregnancy, gameTime, isNsfwEnabled, processStoryResult]);
    
    const startStory = useCallback(async (initialPrompt: string, storyCharacter: CharacterData) => {
        if (!ai || !selectedWork) return;

        setStatus(GameStatus.StoryStarting);
        setError(null);
        setLastTurnInfo({ prompt: initialPrompt, previousWorldUpdate: null });
        setSuggestedActions([]);
        setActiveAI(null);

        try {
            const result = await generateStorySegment(ai, initialPrompt, selectedWork, storyCharacter, [], [], initialEquipment, null, null, null, gameTime, null, isNsfwEnabled, setActiveAI);
            // Reset history after getting the first result to ensure a clean start
            setHistory([]);
            processStoryResult(result);
            setStatus(GameStatus.Playing);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định.");
            setStatus(GameStatus.Error);
            setActiveAI(null);
        }
    }, [ai, selectedWork, isNsfwEnabled, processStoryResult, gameTime]);

    // --- UI FLOW AND NAVIGATION HANDLERS ---
    
    const handleApiKeySubmit = useCallback((key: string) => {
        try {
            const newAi = new GoogleGenAI({ apiKey: key });
            localStorage.setItem(API_KEY_STORAGE_KEY, key);
            setAi(newAi);
            setStatus(GameStatus.WorkSelection);
            setError(null);
        } catch (e) {
            setError("Khóa API không hợp lệ. Vui lòng thử lại.");
        }
    }, []);

    const resetToWorkSelection = useCallback(() => {
        setStatus(GameStatus.WorkSelection);
        setError(null);
        resetFullGameState();
    }, [resetFullGameState]);

    const handleChangeApiKey = useCallback(() => {
        if (window.confirm("Bạn có muốn thay đổi API Key? Bạn sẽ được đưa về màn hình chính.")) {
            localStorage.removeItem(API_KEY_STORAGE_KEY);
            setAi(null);
            resetToWorkSelection();
            setStatus(GameStatus.ApiKeyEntry);
        }
    }, [resetToWorkSelection]);

    const handleSelectWork = useCallback((work: Work) => {
        resetFullGameState();
        setSelectedWork(work);
        setStatus(work.originalCharacterName ? GameStatus.Start : GameStatus.CharacterCreation);
    }, [resetFullGameState]);
    
    const handleStartWorldCreation = useCallback(() => {
        resetFullGameState();
        setStatus(GameStatus.WorldCreation);
    }, [resetFullGameState]);
    
    const handleCreateCustomWork = useCallback((data: { title: string, author: string, content: string }) => {
        const customWork = createCustomLiteraryWork(data.title, data.author, data.content);
        setSelectedWork(customWork);
        setStatus(GameStatus.CharacterCreation);
    }, []);
    
    const handleStartOriginal = useCallback(() => {
        if (selectedWork) {
            const originalCharData: CharacterData = {
                name: selectedWork.originalCharacterName,
                gender: selectedWork.originalCharacterGender || 'Khác',
                appearance: 'Như trong nguyên tác',
                personality: 'Như trong nguyên tác',
                background: 'Như trong nguyên tác'
            };
            setCharacter(originalCharData);
            setActiveSaveId(`game-${Date.now()}`);
            startStory(selectedWork.initialPromptOriginal, originalCharData);
        }
    }, [selectedWork, startStory]);

    const handleStartFanfic = useCallback((charData: Partial<Character>, shouldSaveChar: boolean) => {
        if (selectedWork && charData.name && charData.gender && charData.appearance && charData.personality && charData.background) {
            if (shouldSaveChar) {
                // If character has an ID, it's an update.
                if (charData.id) {
                    setSavedCharacters(prev => prev.map(c => c.id === charData.id ? charData as Character : c));
                } else { // No ID, it's a new character.
                    const newChar: Character = {
                        ...charData,
                        id: `char-${Date.now()}`
                    } as Character;
                    setSavedCharacters(prev => [...prev.filter(c => c.name !== newChar.name), newChar]);
                }
            }
            
            const storyCharacter: CharacterData = {
                name: charData.name,
                gender: charData.gender,
                appearance: charData.appearance,
                personality: charData.personality,
                background: charData.background,
            };

            setCharacter(storyCharacter);
            setActiveSaveId(`game-${Date.now()}`);
            const prompt = selectedWork.getFanficInitialPrompt(storyCharacter);
            startStory(prompt, storyCharacter);
        }
    }, [selectedWork, startStory]);
    
    const handleStartCharacterCreation = useCallback(() => setStatus(GameStatus.CharacterCreation), []);
    
    const resetToModeSelection = useCallback(() => {
        resetFullGameState();
        if (selectedWork?.id.startsWith('custom-')) {
            setStatus(GameStatus.WorldCreation);
        } else {
            setStatus(GameStatus.Start);
        }
    }, [selectedWork, resetFullGameState]);
    
    // --- SAVE / LOAD / DELETE HANDLERS ---
    
    const handleSaveAndExit = useCallback(() => {
        if (!character || !selectedWork || !activeSaveId) return;

        const currentGameState: GameState = {
            id: activeSaveId, character, history, lorebook, affinity, inventory, equipment,
            companions, dating, spouse, pregnancy, gameTime, offScreenWorldUpdate, lastTurnInfo, isNsfwEnabled,
            suggestedActions, turnCount, goals,
            selectedWorkId: selectedWork.id,
            customWorkData: selectedWork.id.startsWith('custom-') ? {
                title: selectedWork.title, author: selectedWork.author, content: selectedWork.content || ''
            } : undefined
        };

        const newSaveSlot: SaveSlot = {
            id: activeSaveId,
            version: CURRENT_SAVE_VERSION,
            timestamp: Date.now(),
            characterName: character.name,
            workTitle: selectedWork.title,
            gameState: currentGameState
        };

        setSavedGames(prev => {
            const existingIndex = prev.findIndex(s => s.id === activeSaveId);
            if (existingIndex > -1) {
                const updatedGames = [...prev];
                updatedGames[existingIndex] = newSaveSlot;
                return updatedGames;
            }
            return [...prev, newSaveSlot];
        });
        
        resetToWorkSelection();
    }, [character, selectedWork, activeSaveId, history, lorebook, affinity, inventory, equipment, companions, dating, spouse, pregnancy, gameTime, offScreenWorldUpdate, lastTurnInfo, isNsfwEnabled, suggestedActions, turnCount, goals, resetToWorkSelection]);

    const handleLoadGame = useCallback((saveId: string) => {
        const slot = savedGames.find(s => s.id === saveId);
        if (!slot) return;
        
        resetFullGameState();
        
        const work = loadStateFromGameState(slot.gameState, {
            setSelectedWork, setCharacter, setHistory, setLorebook, setAffinity,
            setInventory, setEquipment, setCompanions, setDating, setSpouse,
            setPregnancy, setGameTime, setOffScreenWorldUpdate, setLastTurnInfo,
            setIsNsfwEnabled, setActiveSaveId, setSuggestedActions, setTurnCount, setStatus,
            setGoals
        });
        
        if (!work) {
            setError("Không thể tải màn chơi. Dữ liệu tác phẩm không hợp lệ.");
            setSavedGames(prev => prev.filter(s => s.id !== saveId)); // Remove corrupted save
            return;
        }
        
    }, [savedGames, resetFullGameState]);

    const handleDeleteGame = useCallback((saveId: string) => {
        if(window.confirm("Bạn có chắc muốn xóa màn chơi này? Hành động này không thể hoàn tác.")) {
            setSavedGames(prev => prev.filter(s => s.id !== saveId));
        }
    }, []);

    const handleExportGame = useCallback((saveId: string) => {
        const slot = savedGames.find(s => s.id === saveId);
        if (!slot) {
            console.error("Không tìm thấy tệp lưu để xuất.");
            return;
        }

        try {
            const characterName = slot.characterName.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
            const workTitle = slot.workTitle.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
            const timestamp = new Date(slot.timestamp).toISOString().split('T')[0];
            const fileName = `save_${workTitle}_${characterName}_${timestamp}.json`;

            const dataStr = JSON.stringify(slot.gameState, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Lỗi khi xuất tệp lưu:", e);
            setError("Đã có lỗi xảy ra khi cố gắng xuất tệp lưu.");
        }
    }, [savedGames]);

    const handleImportGame = useCallback(async (file: File) => {
        if (!file) return;
    
        try {
            const text = await file.text();
            const importedGameState: GameState = JSON.parse(text);
    
            // Validation
            if (!importedGameState.id || !importedGameState.character?.name || !importedGameState.history || !importedGameState.selectedWorkId) {
                throw new Error("File save không chứa đủ dữ liệu cần thiết.");
            }
    
            // Re-create Work object
            let work: Work | undefined = LITERARY_WORKS.find(w => w.id === importedGameState.selectedWorkId);
            if (!work && importedGameState.customWorkData) {
                work = createCustomLiteraryWork(
                    importedGameState.customWorkData.title,
                    importedGameState.customWorkData.author,
                    importedGameState.customWorkData.content
                );
            }
            if (!work) {
                throw new Error(`Không tìm thấy tác phẩm với ID: ${importedGameState.selectedWorkId}`);
            }
    
            // Create SaveSlot
            const newSaveSlot: SaveSlot = {
                id: importedGameState.id,
                version: CURRENT_SAVE_VERSION,
                timestamp: Date.now(),
                characterName: importedGameState.character.name,
                workTitle: work.title,
                gameState: importedGameState,
            };
    
            // Update Saved Games State
            setSavedGames(prev => {
                const existingIndex = prev.findIndex(s => s.id === newSaveSlot.id);
                if (existingIndex > -1) {
                    const updatedGames = [...prev];
                    updatedGames[existingIndex] = newSaveSlot;
                    alert("Đã cập nhật màn chơi đã có bằng file import.");
                    return updatedGames;
                }
                alert("Nhập file save thành công!");
                return [...prev, newSaveSlot];
            });
            
            setError(null);
    
        } catch (err) {
            console.error("Lỗi khi nhập file save:", err);
            const message = err instanceof Error ? err.message : "Định dạng file JSON không hợp lệ.";
            alert(`Lỗi khi nhập file save: ${message}`);
            setError(`Lỗi khi nhập file save: ${message}`);
        }
    }, [setSavedGames, setError]);

    const handleDeleteCharacter = useCallback((charId: string) => {
        if(window.confirm("Bạn có chắc muốn xóa nhân vật này?")) {
            setSavedCharacters(prev => prev.filter(c => c.id !== charId));
        }
    }, []);

    const handleGenerateBackground = useCallback(async (partialCharacter: Partial<Character>): Promise<string[] | undefined> => {
        if (!ai || !selectedWork || isGeneratingBackground) {
            return;
        }
        setIsGeneratingBackground(true);
        setError(null);
        try {
            const suggestions = await generateBackgroundSuggestions(ai, selectedWork, partialCharacter);
            return suggestions;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Đã xảy ra lỗi khi lấy gợi ý.";
            console.error("Lỗi khi tạo gợi ý hoàn cảnh:", e);
            setError(errorMessage);
            return undefined;
        } finally {
            setIsGeneratingBackground(false);
        }
    }, [ai, selectedWork, isGeneratingBackground]);

    // --- IN-GAME ACTION HANDLERS ---
    const handleUserInput = useCallback(async (userInput: string) => {
        setSuggestedActions([]);
        const newUserMessage: HistoryMessage = { role: 'user', content: userInput, id: `user-${Date.now()}` };
        setHistory(prev => [...prev, newUserMessage]);
        await handleGenerateStory(userInput, offScreenWorldUpdate);
    }, [handleGenerateStory, offScreenWorldUpdate]);
    

    const handleUpdateLoreEntry = useCallback((updatedEntry: LorebookEntry) => setLorebook(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e)), []);
    const handleDeleteLoreEntry = useCallback((id: string) => setLorebook(prev => prev.filter(e => e.id !== id)), []);
    
    const handleUpdateLastNarrative = useCallback((messageId: string, newContent: string) => {
        setHistory(prev =>
            prev.map(msg =>
                msg.id === messageId ? { ...msg, content: newContent } : msg
            )
        );
    }, []);

    const handleRegenerate = useCallback(async () => {
        if (!lastTurnInfo || isLoading) return;
        setSuggestedActions([]);
        setTurnCount(prev => Math.max(0, prev -1)); // Decrement turn count on regenerate
        const historyWithoutLastModelMessage = history.slice(0, -1);
        setHistory(historyWithoutLastModelMessage);
        await handleGenerateStory(lastTurnInfo.prompt, lastTurnInfo.previousWorldUpdate);
    }, [lastTurnInfo, isLoading, handleGenerateStory, history]);
    
    const handleEquipItem = useCallback((itemToEquip: Item) => {
        let slot: EquipmentSlot | null = null;
        const itemNameLower = itemToEquip.name.toLowerCase();
        if (itemNameLower.includes('kiếm') || itemNameLower.includes('gươm') || itemNameLower.includes('dao')) slot = 'weapon';
        else if (itemNameLower.includes('áo') || itemNameLower.includes('giáp')) slot = 'armor';
        if (!slot) return;

        setEquipment(prev => {
            const newEquipment = { ...prev };
            const currentlyEquipped = newEquipment[slot!];
            setInventory(inv => {
                const newInv = inv.filter(i => i.id !== itemToEquip.id);
                if(currentlyEquipped) newInv.push(currentlyEquipped);
                return newInv;
            });
            newEquipment[slot!] = itemToEquip;
            return newEquipment;
        });
    }, []);

    const handleUnequipItem = useCallback((slot: EquipmentSlot) => {
        setEquipment(prev => {
            const itemToUnequip = prev[slot];
            if (itemToUnequip) setInventory(inv => [...inv, itemToUnequip]);
            return { ...prev, [slot]: null };
        });
    }, []);

    const handleConfess = useCallback((npcName: string) => handleUserInput(`Tôi lấy hết can đảm, bày tỏ tình cảm của mình và ngỏ lời muốn bắt đầu một mối quan hệ hẹn hò với ${npcName}.`), [handleUserInput]);
    const handlePropose = useCallback((npcName: string) => {
        if (dating !== npcName) return alert("Bạn cần phải trong mối quan hệ hẹn hò với người này trước khi cầu hôn!");
        const ringIndex = inventory.findIndex(item => item.name.toLowerCase() === "nhẫn cỏ");
        if (ringIndex === -1) return alert("Bạn cần một chiếc Nhẫn Cỏ để cầu hôn!");
        handleUserInput(`Tôi lấy ra một chiếc nhẫn được bện bằng cỏ và ngỏ lời cầu hôn với ${npcName}, người tôi đang hẹn hò.`);
    }, [inventory, dating, handleUserInput]);

    const handleChatWithCompanion = useCallback((npcName: string) => handleUserInput(`Tôi chủ động bắt chuyện, tán gẫu vui vẻ với ${npcName}.`), [handleUserInput]);
    const handleGiveGiftToCompanion = useCallback((npcName: string, item: Item) => {
        setInventory(prev => prev.filter(i => i.id !== item.id));
        handleUserInput(`Tôi lấy ${item.name} từ trong túi đồ của mình và tặng nó cho ${npcName}.`);
    }, [handleUserInput]);

    const handleAddGoal = useCallback((text: string) => {
        if (text.trim()) {
            const newGoal: Goal = {
                id: `goal-${Date.now()}`,
                text: text.trim(),
                completed: false,
            };
            setGoals(prev => [...prev, newGoal]);
        }
    }, []);

    const handleToggleGoal = useCallback((goalId: string) => {
        setGoals(prev => prev.map(goal => 
            goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
        ));
    }, []);

    const handleDeleteGoal = useCallback((goalId: string) => {
        setGoals(prev => prev.filter(goal => goal.id !== goalId));
    }, []);
    
    return {
        status, ai, isLoading, activeAI, selectedWork, character, history, lastTurnInfo, error, isNsfwEnabled,
        lorebook, affinity, inventory, equipment, companions, dating, spouse, pregnancy, offScreenWorldUpdate, gameTime, isLorebookOpen, isChangelogOpen,
        suggestedActions, savedGames, savedCharacters, goals, isGeneratingBackground,
        // Setters / Handlers
        setIsLorebookOpen, setIsChangelogOpen,
        handleApiKeySubmit, handleChangeApiKey, handleSelectWork, handleStartWorldCreation, handleCreateCustomWork,
        resetToWorkSelection, handleStartOriginal, handleStartFanfic, handleStartCharacterCreation, resetToModeSelection,
        setIsNsfwEnabled, handleUserInput, handleSaveAndExit, handleUpdateLastNarrative, handleRegenerate,
        handleEquipItem, handleUnequipItem, handleConfess, handlePropose, handleChatWithCompanion,
        handleGiveGiftToCompanion, handleAddLoreEntry, handleUpdateLoreEntry, handleDeleteLoreEntry,
        handleAddGoal, handleToggleGoal, handleDeleteGoal,
        handleLoadGame, handleDeleteGame, handleExportGame, handleImportGame, handleDeleteCharacter,
        handleGenerateBackground,
        // Constants
        LITERARY_WORKS, CHANGELOG_ENTRIES,
    };
}