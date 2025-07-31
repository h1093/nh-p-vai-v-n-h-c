


import { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

import {
    GameStatus, Work, CharacterData, HistoryMessage, LorebookEntry, AffinityData, Item, Equipment, EquipmentSlot, AITypeKey, LastTurnInfo,
    Character, GameState, SaveSlot, LorebookSuggestion
} from '../types';
import {
    LITERARY_WORKS, createCustomLiteraryWork, API_KEY_STORAGE_KEY, SAVE_GAME_KEY, CHARACTERS_SAVE_KEY, CHANGELOG_ENTRIES
} from '../constants';
import { generateStorySegment, StorySegmentResult, extractEntitiesFromText } from '../services/geminiService';

const initialEquipment: Equipment = { weapon: null, armor: null };
const CURRENT_SAVE_VERSION = "v14";

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
    const [offScreenWorldUpdate, setOffScreenWorldUpdate] = useState<string | null>(null);
    const [gameTime, setGameTime] = useState(480); // Start at 8:00 AM
    const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
    const [lorebookSuggestions, setLorebookSuggestions] = useState<LorebookSuggestion[]>([]);

    // --- UI State ---
    const [isLorebookOpen, setIsLorebookOpen] = useState(false);
    const [isChangelogOpen, setIsChangelogOpen] = useState(false);

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
        setLastTurnInfo(null);
        setOffScreenWorldUpdate(null);
        setIsNsfwEnabled(false);
        setSuggestedActions([]);
        setLorebookSuggestions([]);
        setGameTime(480);
    }, []);
    
    const extractAndSetSuggestions = useCallback(async (narrative: string) => {
        if (!ai || !character) return;
        try {
            const newEntities = await extractEntitiesFromText(ai, narrative, lorebook, character);
            
            const existingLoreKeys = lorebook.map(e => e.key.toLowerCase().trim());
            const currentSuggestionKeys = lorebookSuggestions.map(s => s.key.toLowerCase().trim());

            const trulyNewSuggestions = newEntities
                .filter(entity => 
                    entity.key && 
                    !existingLoreKeys.includes(entity.key.toLowerCase().trim()) &&
                    !currentSuggestionKeys.includes(entity.key.toLowerCase().trim())
                )
                .map(entity => ({
                    ...entity,
                    id: `suggestion-${Date.now()}-${Math.random()}`
                }));

            if (trulyNewSuggestions.length > 0) {
                setLorebookSuggestions(prev => [...prev, ...trulyNewSuggestions]);
            }
        } catch (e) {
            console.error("Failed to extract lorebook suggestions:", e);
        }
    }, [ai, character, lorebook, lorebookSuggestions]);

    const processStoryResult = useCallback((result: StorySegmentResult) => {
        const { narrative, speaker, aiType, worldStateChanges, suggestedActions: newSuggestedActions } = result;

        const newModelMessage: HistoryMessage = {
            role: 'model', content: narrative, id: `model-${Date.now()}`, speaker: speaker, aiType: aiType,
        };
        setHistory(prev => [...prev, newModelMessage]);

        const { affinityUpdates, itemUpdates, companions, datingUpdate, marriageUpdate, pregnancyUpdate, offScreenWorldUpdate, timePassed } = worldStateChanges;

        if (affinityUpdates?.length > 0) {
            setAffinity(prev => affinityUpdates.reduce((acc, u) => ({...acc, [u.npcName]: Math.max(-100, Math.min(100, (acc[u.npcName] || 0) + u.change))}), {...prev}));
        }

        if (itemUpdates?.length > 0) {
            setInventory(prev => {
                let newInv = [...prev];
                itemUpdates.forEach(u => {
                    if (u.action === 'add') newInv.push({ ...u.item, id: `item-${Date.now()}-${Math.random()}` });
                    else {
                        const idx = newInv.findIndex(i => i.name.toLowerCase() === u.item.name.toLowerCase());
                        if (idx > -1) newInv.splice(idx, 1);
                    }
                });
                return newInv;
            });
        }

        if (companions) setCompanions(companions);
        if (datingUpdate?.partnerName) setDating(datingUpdate.partnerName);
        if (marriageUpdate?.spouseName) {
            setSpouse(marriageUpdate.spouseName);
            setDating(null);
        }
        if (pregnancyUpdate?.partnerName && !pregnancy) {
            setPregnancy({ 
                partnerName: pregnancyUpdate.partnerName, 
                conceptionTime: gameTime 
            });
        }

        setOffScreenWorldUpdate(offScreenWorldUpdate);
        setGameTime(prev => prev + (timePassed || 15));
        setSuggestedActions(newSuggestedActions || []);
    }, [pregnancy, gameTime]);

    // --- API CALLS ---
    const handleGenerateStory = useCallback(async (prompt: string, pwu: string | null) => {
        if (!ai || !selectedWork || !character) throw new Error("Game state not properly initialized.");
        
        setIsLoading(true);
        setError(null);
        setLastTurnInfo({ prompt, previousWorldUpdate: pwu });

        try {
            const result = await generateStorySegment(ai, prompt, selectedWork, character, lorebook, inventory, equipment, spouse, dating, pregnancy, gameTime, pwu, isNsfwEnabled, setActiveAI);
            processStoryResult(result);
            await extractAndSetSuggestions(result.narrative);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định.";
            setError(errorMessage);
            setStatus(GameStatus.Error);
        } finally {
            setIsLoading(false);
            setActiveAI(null);
        }
    }, [ai, selectedWork, character, lorebook, inventory, equipment, spouse, dating, pregnancy, gameTime, isNsfwEnabled, processStoryResult, extractAndSetSuggestions]);
    
    const startStory = useCallback(async (initialPrompt: string, storyCharacter: CharacterData) => {
        if (!ai || !selectedWork) return;

        setStatus(GameStatus.StoryStarting);
        setError(null);
        setLastTurnInfo({ prompt: initialPrompt, previousWorldUpdate: null });
        setSuggestedActions([]);
        setLorebookSuggestions([]);
        setActiveAI(null);

        try {
            const result = await generateStorySegment(ai, initialPrompt, selectedWork, storyCharacter, [], [], initialEquipment, null, null, null, gameTime, null, isNsfwEnabled, setActiveAI);
            // Reset history after getting the first result to ensure a clean start
            setHistory([]);
            processStoryResult(result);
            await extractAndSetSuggestions(result.narrative);
            setStatus(GameStatus.Playing);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định.");
            setStatus(GameStatus.Error);
            setActiveAI(null);
        }
    }, [ai, selectedWork, isNsfwEnabled, processStoryResult, gameTime, extractAndSetSuggestions]);

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
            suggestedActions, lorebookSuggestions,
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
    }, [character, selectedWork, activeSaveId, history, lorebook, affinity, inventory, equipment, companions, dating, spouse, pregnancy, gameTime, offScreenWorldUpdate, lastTurnInfo, isNsfwEnabled, suggestedActions, lorebookSuggestions, resetToWorkSelection]);

    const handleLoadGame = useCallback((saveId: string) => {
        const slot = savedGames.find(s => s.id === saveId);
        if (!slot) return;
        
        resetFullGameState();
        const { gameState } = slot;
        
        let work: Work | undefined = LITERARY_WORKS.find(w => w.id === gameState.selectedWorkId);
        if (!work && gameState.customWorkData) {
            work = createCustomLiteraryWork(gameState.customWorkData.title, gameState.customWorkData.author, gameState.customWorkData.content);
        }
        
        if (!work) {
            setError("Không thể tải màn chơi. Dữ liệu tác phẩm không hợp lệ.");
            setSavedGames(prev => prev.filter(s => s.id !== saveId)); // Remove corrupted save
            return;
        }

        setSelectedWork(work);
        setCharacter(gameState.character);
        setHistory(gameState.history);
        setLorebook(gameState.lorebook);
        setAffinity(gameState.affinity);
        setInventory(gameState.inventory);
        setEquipment(gameState.equipment);
        setCompanions(gameState.companions);
        setDating(gameState.dating);
        setSpouse(gameState.spouse);
        setPregnancy(gameState.pregnancy);
        setGameTime(gameState.gameTime);
        setOffScreenWorldUpdate(gameState.offScreenWorldUpdate);
        setLastTurnInfo(gameState.lastTurnInfo);
        setIsNsfwEnabled(gameState.isNsfwEnabled);
        setActiveSaveId(gameState.id);
        setSuggestedActions(gameState.suggestedActions || []);
        setLorebookSuggestions(gameState.lorebookSuggestions || []);
        setStatus(GameStatus.Playing);
        
    }, [savedGames, resetFullGameState]);

    const handleDeleteGame = useCallback((saveId: string) => {
        if(window.confirm("Bạn có chắc muốn xóa màn chơi này? Hành động này không thể hoàn tác.")) {
            setSavedGames(prev => prev.filter(s => s.id !== saveId));
        }
    }, []);

    const handleDeleteCharacter = useCallback((charId: string) => {
        if(window.confirm("Bạn có chắc muốn xóa nhân vật này?")) {
            setSavedCharacters(prev => prev.filter(c => c.id !== charId));
        }
    }, []);

    // --- IN-GAME ACTION HANDLERS ---
    const handleUserInput = useCallback(async (userInput: string) => {
        setSuggestedActions([]);
        setLorebookSuggestions([]);
        const newUserMessage: HistoryMessage = { role: 'user', content: userInput, id: `user-${Date.now()}` };
        setHistory(prev => [...prev, newUserMessage]);
        await handleGenerateStory(userInput, offScreenWorldUpdate);
    }, [handleGenerateStory, offScreenWorldUpdate]);
    
    const handleAddLoreEntry = useCallback((entry: { key: string, value: string }) => setLorebook(prev => [...prev, { ...entry, id: `lore-${Date.now()}` }]), []);
    const handleUpdateLoreEntry = useCallback((updatedEntry: LorebookEntry) => setLorebook(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e)), []);
    const handleDeleteLoreEntry = useCallback((id: string) => setLorebook(prev => prev.filter(e => e.id !== id)), []);
    
    const handleDismissSuggestedLoreEntry = useCallback((id: string) => {
        setLorebookSuggestions(prev => prev.filter(s => s.id !== id));
    }, []);

    const handleAddSuggestedLoreEntry = useCallback((suggestion: LorebookSuggestion) => {
        handleAddLoreEntry({ key: suggestion.key, value: suggestion.value });
        handleDismissSuggestedLoreEntry(suggestion.id);
    }, [handleAddLoreEntry, handleDismissSuggestedLoreEntry]);

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
        setLorebookSuggestions([]);
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

    return {
        status, ai, isLoading, activeAI, selectedWork, character, history, lastTurnInfo, error, isNsfwEnabled,
        lorebook, affinity, inventory, equipment, companions, dating, spouse, pregnancy, offScreenWorldUpdate, gameTime, isLorebookOpen, isChangelogOpen,
        suggestedActions, lorebookSuggestions, savedGames, savedCharacters,
        // Setters / Handlers
        setIsLorebookOpen, setIsChangelogOpen,
        handleApiKeySubmit, handleChangeApiKey, handleSelectWork, handleStartWorldCreation, handleCreateCustomWork,
        resetToWorkSelection, handleStartOriginal, handleStartFanfic, handleStartCharacterCreation, resetToModeSelection,
        setIsNsfwEnabled, handleUserInput, handleSaveAndExit, handleUpdateLastNarrative, handleRegenerate,
        handleEquipItem, handleUnequipItem, handleConfess, handlePropose, handleChatWithCompanion,
        handleGiveGiftToCompanion, handleAddLoreEntry, handleUpdateLoreEntry, handleDeleteLoreEntry,
        handleAddSuggestedLoreEntry, handleDismissSuggestedLoreEntry,
        handleLoadGame, handleDeleteGame, handleDeleteCharacter,
        // Constants
        LITERARY_WORKS, CHANGELOG_ENTRIES,
    };
}