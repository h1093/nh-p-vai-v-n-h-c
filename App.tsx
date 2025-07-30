import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

import { GameStatus, Work, Character, CharacterData, HistoryMessage, LorebookEntry, LorebookSuggestion, AffinityData, Item, Equipment, ItemUpdate, EquipmentSlot, AITypeKey, LastTurnInfo } from './types';
import { LITERARY_WORKS, createCustomLiteraryWork, SAVE_GAME_KEY, CHARACTERS_SAVE_KEY, API_KEY_STORAGE_KEY, NSFW_INSTRUCTION_APPENDIX, CHANGELOG_ENTRIES } from './constants';
import { generateStorySegment, extractLoreSuggestions } from './services/geminiService';
import LoadingIndicator from './components/LoadingIndicator';
import GameScreen from './components/GameScreen';
import LorebookModal from './components/LorebookModal';
import ChangelogScreen from './components/ChangelogScreen';
import { StorySegmentResult } from './services/geminiService';

const ApiKeyScreen = ({ onSubmit, error }: { onSubmit: (key: string) => void, error: string | null }) => {
    const [key, setKey] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (key.trim()) {
        onSubmit(key.trim());
      }
    };

    return (
      <div className="max-w-md mx-auto p-8 bg-gray-900 rounded-xl shadow-2xl shadow-black/20 border border-gray-700 text-center">
        <h1 className="text-3xl font-serif-display font-bold text-gray-100 mb-4">Nhập API Key</h1>
        <p className="text-gray-400 mb-6">
          Vui lòng nhập khóa API Google Gemini của bạn để bắt đầu. Khóa của bạn sẽ được lưu trữ cục bộ trên trình duyệt.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500 placeholder-gray-500"
            placeholder="Google Gemini API Key"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-amber-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400"
          >
            Lưu & Tiếp tục
          </button>
        </form>
         <p className="text-xs text-gray-500 mt-4">
          Bạn có thể lấy API key tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-500">Google AI Studio</a>.
        </p>
      </div>
    );
};

const WorkSelectionScreen = ({ works, onSelect, onCreateCustom, hasSavedGame, onResume, onChangeApiKey, onShowChangelog }: { works: Work[], onSelect: (work: Work) => void, onCreateCustom: () => void, hasSavedGame: boolean, onResume: () => void, onChangeApiKey: () => void, onShowChangelog: () => void }) => (
    <div className="text-center max-w-5xl mx-auto p-8">
        <h1 className="text-5xl md:text-6xl font-serif-display font-bold text-white mb-4">Nhập Vai Văn Học</h1>
        <p className="text-gray-300 text-lg mb-10">
            Chọn một tác phẩm kinh điển, hoặc tạo ra thế giới của riêng bạn.
        </p>

        {hasSavedGame && (
            <div className="mb-12 animate-fade-in-slow">
                <button
                    onClick={onResume}
                    className="bg-emerald-700 text-white font-bold py-4 px-10 rounded-lg shadow-lg hover:bg-emerald-600 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-400 w-full md:w-auto text-xl"
                >
                    Tiếp tục câu chuyện
                </button>
                <p className="text-gray-400 mt-3 text-sm">hoặc bắt đầu một câu chuyện mới bên dưới</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {works.map(work => (
                <div 
                    key={work.id}
                    className="bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-gray-700 overflow-hidden flex flex-col group cursor-pointer transform hover:-translate-y-2 transition-transform duration-300"
                    onClick={() => onSelect(work)}
                >
                    <div className="p-8 text-left flex-grow">
                        <h2 className="text-3xl font-serif-display font-bold text-gray-100 mb-2">{work.title}</h2>
                        <p className="text-gray-400 font-semibold mb-4">Tác giả: {work.author}</p>
                        <p className="text-gray-300">{work.description}</p>
                    </div>
                    <div className="bg-gray-700 text-amber-300 font-bold py-3 px-8 group-hover:bg-amber-800 transition-colors duration-300 text-center">
                        Khám phá
                    </div>
                </div>
            ))}
            <div 
                key="custom-world"
                className="bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-amber-700/50 overflow-hidden flex flex-col group cursor-pointer transform hover:-translate-y-2 transition-transform duration-300"
                onClick={onCreateCustom}
            >
                <div className="p-8 text-center flex-grow flex flex-col items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-amber-500 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <h2 className="text-3xl font-serif-display font-bold text-amber-400 mt-4">Tạo Thế Giới Mới</h2>
                    <p className="text-amber-500 mt-2">Nhập vào tác phẩm, tóm tắt, hoặc ý tưởng của bạn.</p>
                </div>
                <div className="bg-amber-800 text-white font-bold py-3 px-8 group-hover:bg-amber-700 transition-colors duration-300 text-center">
                    Bắt đầu sáng tạo
                </div>
            </div>
        </div>
         <div className="mt-12 text-center space-x-6">
            <button
              onClick={onShowChangelog}
              className="text-gray-400 hover:text-white underline text-sm font-semibold"
            >
              Nhật ký cập nhật
            </button>
            <button
              onClick={onChangeApiKey}
              className="text-gray-400 hover:text-white underline text-sm font-semibold"
            >
              Thay đổi API Key
            </button>
          </div>
    </div>
);

const WorldCreatorScreen = ({ onSubmit, onBack }: { onSubmit: (data: { title: string, author: string, content: string }) => void, onBack: () => void }) => {
    const [worldData, setWorldData] = useState({ title: '', author: '', content: '' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setWorldData({ ...worldData, [e.target.name]: e.target.value });
    const isFormValid = useMemo(() => worldData.content.trim().length > 50, [worldData]);
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (isFormValid) onSubmit(worldData); };

    return (
        <div className="max-w-3xl mx-auto p-8 bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-gray-700">
            <h1 className="text-4xl font-serif-display font-bold text-gray-100 mb-6 text-center">Tạo Thế Giới Mới</h1>
            <p className="text-gray-300 mb-8 text-center">Cung cấp nội dung để AI xây dựng thế giới, nhân vật và văn phong cho câu chuyện của bạn.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label htmlFor="title" className="block text-sm font-bold text-gray-300 mb-2">Tên tác phẩm (Tùy chọn)</label>
                    <input type="text" id="title" name="title" value={worldData.title} onChange={handleChange} className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Số Đỏ, Lão Hạc, Harry Potter..."/>
                </div>
                 <div>
                    <label htmlFor="author" className="block text-sm font-bold text-gray-300 mb-2">Tác giả (Tùy chọn)</label>
                    <input type="text" id="author" name="author" value={worldData.author} onChange={handleChange} className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Vũ Trọng Phụng, Nam Cao..."/>
                </div>
                <div>
                    <label htmlFor="content" className="block text-sm font-bold text-gray-300 mb-2">Nội dung, tóm tắt, hoặc trích đoạn</label>
                    <textarea id="content" name="content" value={worldData.content} onChange={handleChange} rows={10} className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Dán nội dung vào đây. Nội dung càng chi tiết, AI sẽ tạo ra thế giới càng sâu sắc và đúng với văn phong gốc. (Yêu cầu tối thiểu 50 ký tự)" required />
                    {!isFormValid && worldData.content.trim() !== '' && <p className="text-sm text-red-500 mt-1">Nội dung cần dài hơn để AI có thể hiểu được bối cảnh.</p>}
                </div>
                <div className="flex items-center justify-between pt-4">
                    <button type="button" onClick={onBack} className="text-gray-300 font-bold py-3 px-8 rounded-lg hover:bg-gray-700 transition-colors">Quay lại</button>
                    <button type="submit" disabled={!isFormValid} className="bg-amber-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none">Tạo thế giới & Viết truyện</button>
                </div>
            </form>
        </div>
    );
};

const ModeSelectionScreen = ({ work, onStartAsOriginal, onStartFanfic, onBack, isNsfwEnabled, onNsfwToggle }: { work: Work, onStartAsOriginal: () => void, onStartFanfic: () => void, onBack: () => void, isNsfwEnabled: boolean, onNsfwToggle: (enabled: boolean) => void }) => (
  <div className="relative text-center max-w-4xl mx-auto p-8 bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-gray-700">
    <button onClick={onBack} className="absolute top-4 left-4 text-gray-400 hover:text-white font-bold py-2 px-4 transition-colors">
        &larr; Chọn lại tác phẩm
    </button>
    <h1 className="text-5xl md:text-6xl font-serif-display font-bold text-gray-100 mb-2">{work.title}</h1>
    <p className="text-gray-300 text-lg mb-8">
        Mỗi lựa chọn của bạn sẽ viết nên một trang truyện khác biệt trong thế giới của {work.author}.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border border-gray-600 rounded-lg p-6 flex flex-col items-center bg-gray-700/60">
        <h2 className="text-2xl font-serif-display font-bold text-gray-100 mb-2">{work.originalCharacterName}</h2>
        <p className="text-gray-300 mb-4 flex-grow">{work.originalCharacterDescription}</p>
        <button
          onClick={onStartAsOriginal}
          className="bg-gray-600 text-amber-50 font-bold py-3 px-10 rounded-lg shadow-lg hover:bg-gray-500 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-400 w-full"
        >
          Vào vai {work.originalCharacterName}
        </button>
      </div>
      <div className="border border-gray-600 rounded-lg p-6 flex flex-col items-center bg-gray-700/60">
        <h2 className="text-2xl font-serif-display font-bold text-gray-100 mb-2">Đồng nhân</h2>
        <p className="text-gray-300 mb-4 flex-grow">{work.fanficDescription}</p>
        <button
          onClick={onStartFanfic}
          className="bg-amber-800 text-white font-bold py-3 px-10 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 w-full"
        >
          Tạo nhân vật mới
        </button>
      </div>
    </div>
    <div className="mt-8 flex items-center justify-center space-x-3 bg-red-900/20 p-4 rounded-lg border border-red-800">
      <input
        type="checkbox"
        id="nsfw-toggle"
        checked={isNsfwEnabled}
        onChange={(e) => onNsfwToggle(e.target.checked)}
        className="h-5 w-5 rounded border-red-400 bg-gray-700 text-red-600 focus:ring-red-500 cursor-pointer"
      />
      <label htmlFor="nsfw-toggle" className="font-semibold text-red-300 cursor-pointer select-none">
        Bật nội dung 18+ (Có thể chứa các tình tiết nhạy cảm)
      </label>
    </div>
  </div>
);

const CharacterCreationScreen = ({ work, onSubmit, onBack, savedCharacters, onSaveCharacter }: { work: Work, onSubmit: (character: CharacterData) => void, onBack: () => void, savedCharacters: Character[], onSaveCharacter: (character: CharacterData) => void }) => {
  const [character, setCharacter] = useState<CharacterData>({ name: '', appearance: '', personality: '', background: '' });
  const [shouldSave, setShouldSave] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCharacter({ ...character, [e.target.name]: e.target.value });
  
  const isFormValid = useMemo(() => (
    character.name.trim() !== '' &&
    character.appearance.trim() !== '' &&
    character.personality.trim() !== '' &&
    character.background.trim() !== ''
  ), [character]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    if (shouldSave) {
      onSaveCharacter(character);
    }
    onSubmit(character);
  };

  const handleSelectCharacter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setCharacter({ name: '', appearance: '', personality: '', background: '' });
      return;
    }
    const selectedChar = savedCharacters.find(c => c.id === selectedId);
    if (selectedChar) {
      const { id, ...charData } = selectedChar;
      setCharacter(charData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-gray-700">
      <h1 className="text-4xl font-serif-display font-bold text-gray-100 mb-6 text-center">Tạo Nhân Vật Mới</h1>
      <p className="text-gray-300 mb-8 text-center">Hãy thổi hồn cho nhân vật của bạn để bắt đầu một câu chuyện mới trong thế giới của <span className="font-bold">{work.title}</span>.</p>
      
      {savedCharacters.length > 0 && (
        <div className="mb-8">
          <label htmlFor="character-select" className="block text-sm font-bold text-gray-300 mb-2">Hoặc chọn nhân vật đã có</label>
          <select
            id="character-select"
            onChange={handleSelectCharacter}
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500 shadow-sm"
          >
            <option value="">-- Tạo một nhân vật mới --</option>
            {savedCharacters.map(char => (
              <option key={char.id} value={char.id}>{char.name}</option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-gray-300 mb-2">Tên nhân vật</label>
          <input type="text" id="name" name="name" value={character.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Anh Ba Gánh Nước" required />
        </div>
        <div>
          <label htmlFor="appearance" className="block text-sm font-bold text-gray-300 mb-2">Ngoại hình</label>
          <textarea id="appearance" name="appearance" value={character.appearance} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Thân hình gầy gò, nước da ngăm đen..." required />
        </div>
        <div>
          <label htmlFor="personality" className="block text-sm font-bold text-gray-300 mb-2">Tính cách</label>
          <textarea id="personality" name="personality" value={character.personality} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Hiền lành, ít nói nhưng quật cường..." required />
        </div>
        <div>
          <label htmlFor="background" className="block text-sm font-bold text-gray-300 mb-2">Hoàn cảnh</label>
          <textarea id="background" name="background" value={character.background} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Một thầy lang trẻ từ nơi khác đến..." required />
        </div>
        
        <div className="flex items-center gap-3 pt-2">
            <input 
                type="checkbox" 
                id="saveCharacter" 
                name="saveCharacter" 
                checked={shouldSave} 
                onChange={(e) => setShouldSave(e.target.checked)}
                className="h-5 w-5 rounded border-gray-500 bg-gray-700 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="saveCharacter" className="text-sm text-gray-300 font-medium">Lưu nhân vật này để sử dụng lại</label>
        </div>

        <div className="flex items-center justify-between pt-4">
           <button type="button" onClick={onBack} className="text-gray-300 font-bold py-3 px-8 rounded-lg hover:bg-gray-700 transition-colors">Quay lại</button>
          <button type="submit" disabled={!isFormValid} className="bg-amber-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none">Bắt đầu câu chuyện</button>
        </div>
      </form>
    </div>
  );
};

const initialEquipment: Equipment = { weapon: null, armor: null };

const App = () => {
  const [status, setStatus] = useState<keyof typeof GameStatus>(GameStatus.Loading);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAI, setActiveAI] = useState<AITypeKey | null>(null);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const [lastTurnInfo, setLastTurnInfo] = useState<LastTurnInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [savedCharacters, setSavedCharacters] = useState<Character[]>([]);
  const [isNsfwEnabled, setIsNsfwEnabled] = useState(false);

  // Game State
  const [lorebook, setLorebook] = useState<LorebookEntry[]>([]);
  const [affinity, setAffinity] = useState<AffinityData>({});
  const [inventory, setInventory] = useState<Item[]>([]);
  const [equipment, setEquipment] = useState<Equipment>(initialEquipment);
  const [companions, setCompanions] = useState<string[]>([]);
  const [dating, setDating] = useState<string | null>(null);
  const [spouse, setSpouse] = useState<string | null>(null);
  const [offScreenWorldUpdate, setOffScreenWorldUpdate] = useState<string | null>(null);
  const [gameTime, setGameTime] = useState(480); // Start at 8:00 AM
  
  // UI State
  const [isLorebookOpen, setIsLorebookOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [lorebookSuggestions, setLorebookSuggestions] = useState<LorebookSuggestion[]>([]);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);

  useEffect(() => {
    try {
      // Show changelog on first visit to new version
      const lastVersion = localStorage.getItem('changelog-version');
      if (lastVersion !== CHANGELOG_ENTRIES[0].version) {
          setIsChangelogOpen(true);
          localStorage.setItem('changelog-version', CHANGELOG_ENTRIES[0].version);
      }

      const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (savedKey) {
          setAi(new GoogleGenAI({ apiKey: savedKey }));
          const savedData = localStorage.getItem(SAVE_GAME_KEY);
          if (savedData) setHasSavedGame(true);
          
          const savedChars = localStorage.getItem(CHARACTERS_SAVE_KEY);
          if (savedChars) setSavedCharacters(JSON.parse(savedChars));

          setStatus(GameStatus.WorkSelection);
      } else {
          setStatus(GameStatus.ApiKeyEntry);
      }
    } catch (e) {
        console.error("Lỗi khởi tạo:", e);
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        setStatus(GameStatus.ApiKeyEntry);
    }
  }, []);
  
  const processStoryResult = useCallback((result: StorySegmentResult) => {
      const { narrative, speaker, aiType, worldStateChanges, suggestedActions } = result;

      const newModelMessage: HistoryMessage = {
          role: 'model',
          content: narrative,
          id: `model-${Date.now()}`,
          speaker: speaker,
          aiType: aiType,
      };
      setHistory(prev => [...prev, newModelMessage]);
      
      const { affinityUpdates, itemUpdates, companions, datingUpdate, marriageUpdate, offScreenWorldUpdate, timePassed } = worldStateChanges;

      if (affinityUpdates && affinityUpdates.length > 0) {
        setAffinity(prevAffinity => {
          const newAffinity = { ...prevAffinity };
          affinityUpdates.forEach(update => {
            const currentScore = newAffinity[update.npcName] || 0;
            newAffinity[update.npcName] = Math.max(-100, Math.min(100, currentScore + update.change));
          });
          return newAffinity;
        });
      }

      if(itemUpdates && itemUpdates.length > 0) {
          setInventory(prevInventory => {
              let newInventory = [...prevInventory];
              itemUpdates.forEach(update => {
                  if (update.action === 'add') {
                      newInventory.push({ ...update.item, id: `item-${Date.now()}-${Math.random()}` });
                  } else if (update.action === 'remove') {
                      const itemIndex = newInventory.findIndex(i => i.name.toLowerCase() === update.item.name.toLowerCase());
                      if (itemIndex > -1) {
                          newInventory.splice(itemIndex, 1);
                      }
                  }
              });
              return newInventory;
          });
      }

      if (companions) {
          setCompanions(companions);
      }
      
      if (datingUpdate && datingUpdate.partnerName) {
        setDating(datingUpdate.partnerName);
      }

      if (marriageUpdate && marriageUpdate.spouseName) {
        setSpouse(marriageUpdate.spouseName);
        setDating(null); // When married, no longer just "dating"
      }
      
      setOffScreenWorldUpdate(offScreenWorldUpdate);
      setGameTime(prev => prev + timePassed);
      setSuggestedActions(suggestedActions || []);

      // Fire-and-forget suggestion extraction
      if (ai) {
          extractLoreSuggestions(ai, narrative, lorebook).then(setLorebookSuggestions);
      }
  }, [ai, lorebook]);

  const handleGenerateStory = useCallback(async (prompt: string, pwu: string | null) => {
    if (!ai || !selectedWork || !character) {
        throw new Error("Game state not properly initialized.");
    }
    setIsLoading(true);
    setError(null);
    setLastTurnInfo({ prompt, previousWorldUpdate: pwu });
    setLorebookSuggestions([]);

    try {
        const result = await generateStorySegment(ai, prompt, selectedWork, character, lorebook, inventory, equipment, spouse, dating, pwu, setActiveAI);
        processStoryResult(result);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định.";
        setError(errorMessage);
        setStatus(GameStatus.Error);
    } finally {
        setIsLoading(false);
        setActiveAI(null);
    }
  }, [ai, selectedWork, character, lorebook, inventory, equipment, spouse, dating, processStoryResult]);

  const startStory = useCallback(async (initialPrompt: string) => {
      if (!ai || !selectedWork || !character) return;
      
      setIsLoading(true);
      setError(null);
      setLastTurnInfo({ prompt: initialPrompt, previousWorldUpdate: null });
      setLorebookSuggestions([]);
      setSuggestedActions([]);
      
      try {
          const result = await generateStorySegment(ai, initialPrompt, selectedWork, character, [], [], initialEquipment, null, null, null, setActiveAI);
          setHistory([]); // Clear history before processing
          processStoryResult(result);
          setStatus(GameStatus.Playing);
      } catch (e) {
          setError(e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định.");
          setStatus(GameStatus.Error);
      } finally {
          setIsLoading(false);
          setActiveAI(null);
      }
  }, [ai, selectedWork, character, processStoryResult]);
  
  const handleUserInput = useCallback(async (userInput: string) => {
    if (!selectedWork || !ai || !character) return;
    
    setSuggestedActions([]);
    const newUserMessage: HistoryMessage = { role: 'user', content: userInput, id: `user-${Date.now()}`};
    setHistory(prev => [...prev, newUserMessage]);
    
    await handleGenerateStory(userInput, offScreenWorldUpdate);
  }, [selectedWork, ai, character, handleGenerateStory, offScreenWorldUpdate]);

  const handleConfess = async (npcName: string) => {
    const prompt = `Tôi lấy hết can đảm, bày tỏ tình cảm của mình và ngỏ lời muốn bắt đầu một mối quan hệ hẹn hò với ${npcName}.`;
    await handleUserInput(prompt);
  };

  const handlePropose = async (npcName: string) => {
    if (dating !== npcName) {
        alert("Bạn cần phải trong mối quan hệ hẹn hò với người này trước khi cầu hôn!");
        return;
    }
    const ringName = "nhẫn cỏ";
    const ringIndex = inventory.findIndex(item => item.name.toLowerCase() === ringName);
    if (ringIndex === -1) {
        alert("Bạn cần một chiếc Nhẫn Cỏ để cầu hôn!");
        return;
    }

    setInventory(prev => prev.filter((_, index) => index !== ringIndex));
    const prompt = `Tôi lấy ra một chiếc nhẫn được bện bằng cỏ và ngỏ lời cầu hôn với ${npcName}, người tôi đang hẹn hò.`;
    await handleUserInput(prompt);
  };

  const handleRegenerate = useCallback(async () => {
      if (!lastTurnInfo || isLoading) return;
      
      setSuggestedActions([]);
      // This logic will be imperfect with time, but it's the best we can do without complex state snapshots.
      // We will revert the last model message, but game state changes (affinity, items, time) from that turn will persist.
      const historyWithoutLastModelMessage = history.filter(m => m.role !== 'model' || m.id !== history[history.length - 1].id);
      setHistory(historyWithoutLastModelMessage);
      
      await handleGenerateStory(lastTurnInfo.prompt, lastTurnInfo.previousWorldUpdate);

  }, [lastTurnInfo, isLoading, handleGenerateStory, history]);
  
  const handleUpdateLastNarrative = (newContent: string) => {
      setHistory(prev => {
        const newHistory = [...prev];
        const lastMessageIndex = newHistory.length -1;
        if(lastMessageIndex >= 0 && newHistory[lastMessageIndex].role === 'model'){
            newHistory[lastMessageIndex] = { ...newHistory[lastMessageIndex], content: newContent };
            return newHistory;
        }
        return prev;
      });
  };

  const handleApiKeySubmit = (key: string) => {
      try {
          const newAi = new GoogleGenAI({ apiKey: key });
          localStorage.setItem(API_KEY_STORAGE_KEY, key);
          setAi(newAi);
          setStatus(GameStatus.WorkSelection);
          setError(null);
      } catch (e) {
          console.error("Lỗi khởi tạo API key:", e);
          setError("Khóa API không hợp lệ. Vui lòng thử lại.");
      }
  };

  const handleChangeApiKey = () => {
      if (window.confirm("Bạn có muốn thay đổi API Key? Hành động này sẽ đưa bạn về màn hình chính và xóa game đã lưu.")) {
          localStorage.removeItem(API_KEY_STORAGE_KEY);
          localStorage.removeItem(SAVE_GAME_KEY);
          setAi(null);
          setHasSavedGame(false);
          resetToWorkSelection(true);
          setStatus(GameStatus.ApiKeyEntry);
      }
  };

  const resetGameState = () => {
      setHistory([]);
      setLorebook([]);
      setAffinity({});
      setInventory([]);
      setEquipment(initialEquipment);
      setCompanions([]);
      setDating(null);
      setSpouse(null);
      setLastTurnInfo(null);
      setOffScreenWorldUpdate(null);
      setIsNsfwEnabled(false);
      setLorebookSuggestions([]);
      setSuggestedActions([]);
      setCharacter(null);
      setGameTime(480); // Reset time to 8:00 AM
  };

  const handleStartNewGame = (startAction: () => void) => {
    if (hasSavedGame) {
        if (window.confirm("Bạn có chắc muốn bắt đầu một câu chuyện mới? Tiến trình hiện tại sẽ bị xóa.")) {
            localStorage.removeItem(SAVE_GAME_KEY);
            setHasSavedGame(false);
            resetGameState();
            startAction();
        }
    } else {
        resetGameState();
        startAction();
    }
  };

  const handleSelectWork = (work: Work) => {
    handleStartNewGame(() => {
        setSelectedWork(work);
        setStatus(work.originalCharacterName ? GameStatus.Start : GameStatus.CharacterCreation);
    });
  };

  const handleStartOriginal = () => {
    if (selectedWork) {
        setCharacter({
            name: selectedWork.originalCharacterName,
            appearance: 'Như trong nguyên tác',
            personality: 'Như trong nguyên tác',
            background: 'Như trong nguyên tác'
        });
        // useEffect will trigger startStory when character is set
    }
  };

  useEffect(() => {
      if (character && selectedWork && status === GameStatus.Start) {
          startStory(selectedWork.initialPromptOriginal);
      }
  }, [character, selectedWork, status, startStory]);
  
  const handleStartFanfic = (charData: CharacterData) => {
    if (selectedWork) {
        setCharacter(charData);
        const prompt = selectedWork.getFanficInitialPrompt(charData);
        startStory(prompt);
    }
  };

  const handleSaveCharacter = (characterToSave: CharacterData) => {
    setSavedCharacters(prevChars => {
        const newChar: Character = { ...characterToSave, id: `char-lib-${Date.now()}`};
        const newCharsList = [...prevChars, newChar];
        localStorage.setItem(CHARACTERS_SAVE_KEY, JSON.stringify(newCharsList));
        return newCharsList;
    });
  };

  const handleStartCharacterCreation = () => setStatus(GameStatus.CharacterCreation);
  const handleStartWorldCreation = () => handleStartNewGame(() => setStatus(GameStatus.WorldCreation));
  
  const handleCreateCustomWork = (data: { title: string, author: string, content: string }) => {
    const customWork = createCustomLiteraryWork(data.title, data.author, data.content);
    setSelectedWork(customWork);
    setStatus(GameStatus.CharacterCreation);
  };
  
  const resetToWorkSelection = (clearSave = true) => {
    if (clearSave) {
        localStorage.removeItem(SAVE_GAME_KEY);
        setHasSavedGame(false);
    }
    setStatus(GameStatus.WorkSelection);
    setSelectedWork(null);
    setError(null);
    resetGameState();
  }

  const resetToModeSelection = () => {
    if(selectedWork && selectedWork.id.startsWith('custom-')) {
        setStatus(GameStatus.WorldCreation);
    } else {
        setStatus(GameStatus.Start);
    }
    resetGameState();
  }

  const handleSaveAndExit = () => {
    if (status === GameStatus.Playing && selectedWork && history.length > 0) {
        const stateToSave = {
            version: 'v12',
            selectedWork,
            character,
            history,
            lorebook,
            affinity,
            inventory,
            equipment,
            companions,
            dating,
            spouse,
            lastTurnInfo,
            isNsfwEnabled,
            offScreenWorldUpdate,
            gameTime
        };
        localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(stateToSave));
        setHasSavedGame(true);
    }
    resetToWorkSelection(false);
  };

  const handleResumeGame = () => {
    const savedData = localStorage.getItem(SAVE_GAME_KEY);
    if (!savedData) return;

    try {
        const savedState = JSON.parse(savedData);
        if(savedState.version !== 'v12'){
            resetToWorkSelection(true);
            alert("Phiên bản lưu cũ không tương thích. Bắt đầu trò chơi mới.");
            return;
        }

        let workInstance;
        if (savedState.selectedWork.id.startsWith('custom-')) {
            workInstance = createCustomLiteraryWork(savedState.selectedWork.title, savedState.selectedWork.author, savedState.selectedWork.content || '');
            workInstance.id = savedState.selectedWork.id; 
        } else {
            const foundWork = LITERARY_WORKS.find(w => w.id === savedState.selectedWork.id);
            if (!foundWork) throw new Error("Could not find saved work.");
            workInstance = foundWork;
        }

        setSelectedWork(workInstance);
        setCharacter(savedState.character || null);
        setHistory(savedState.history || []);
        setLorebook(savedState.lorebook || []);
        setAffinity(savedState.affinity || {});
        setInventory(savedState.inventory || []);
        setEquipment(savedState.equipment || initialEquipment);
        setCompanions(savedState.companions || []);
        setDating(savedState.dating || null);
        setSpouse(savedState.spouse || null);
        setLastTurnInfo(savedState.lastTurnInfo || null);
        setIsNsfwEnabled(savedState.isNsfwEnabled || false);
        setOffScreenWorldUpdate(savedState.offScreenWorldUpdate || null);
        setGameTime(savedState.gameTime || 480);
        setStatus(GameStatus.Playing);
        setLorebookSuggestions([]);

    } catch (e) {
        console.error("Failed to load game:", e);
        resetToWorkSelection(true);
    }
  };

  const handleAddLoreEntry = (entry: {key: string, value: string}) => {
    setLorebook(prev => [...prev, { ...entry, id: `lore-${Date.now()}` }]);
  };
  const handleUpdateLoreEntry = (updatedEntry: LorebookEntry) => {
    setLorebook(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };
  const handleDeleteLoreEntry = (id: string) => {
    setLorebook(prev => prev.filter(e => e.id !== id));
  };
  
  const handleAddSuggestionToLorebook = (suggestion: LorebookSuggestion) => {
      handleAddLoreEntry({ key: suggestion.key, value: suggestion.value });
      setLorebookSuggestions(prev => prev.filter(s => s.key !== suggestion.key));
  };

  const handleEquipItem = (itemToEquip: Item) => {
    let slot: EquipmentSlot | null = null;
    if (itemToEquip.name.toLowerCase().includes('kiếm') || itemToEquip.name.toLowerCase().includes('gươm') || itemToEquip.name.toLowerCase().includes('dao')) {
        slot = 'weapon';
    } else if (itemToEquip.name.toLowerCase().includes('áo') || itemToEquip.name.toLowerCase().includes('giáp')) {
        slot = 'armor';
    }
    if (!slot) return;

    setEquipment(prev => {
        const newEquipment = { ...prev };
        const currentlyEquipped = newEquipment[slot!];
        
        if (currentlyEquipped) {
            setInventory(inv => [...inv, currentlyEquipped]);
        }
        
        newEquipment[slot!] = itemToEquip;
        
        setInventory(inv => inv.filter(i => i.id !== itemToEquip.id));

        return newEquipment;
    });
  };

  const handleUnequipItem = (slot: EquipmentSlot) => {
    setEquipment(prev => {
        const itemToUnequip = prev[slot];
        if (itemToUnequip) {
            setInventory(inv => [...inv, itemToUnequip]);
        }
        return { ...prev, [slot]: null };
    });
  };

  const renderContent = () => {
    switch (status) {
      case GameStatus.ApiKeyEntry:
        return <ApiKeyScreen onSubmit={handleApiKeySubmit} error={error} />;
      case GameStatus.WorkSelection:
        return <WorkSelectionScreen works={LITERARY_WORKS} onSelect={handleSelectWork} onCreateCustom={handleStartWorldCreation} hasSavedGame={hasSavedGame} onResume={handleResumeGame} onChangeApiKey={handleChangeApiKey} onShowChangelog={() => setIsChangelogOpen(true)} />;
      case GameStatus.WorldCreation:
        return <WorldCreatorScreen onSubmit={handleCreateCustomWork} onBack={() => resetToWorkSelection(false)} />;
      case GameStatus.Start:
        return selectedWork && <ModeSelectionScreen 
                                  work={selectedWork} 
                                  onStartAsOriginal={handleStartOriginal} 
                                  onStartFanfic={handleStartCharacterCreation} 
                                  onBack={() => resetToWorkSelection(false)}
                                  isNsfwEnabled={isNsfwEnabled}
                                  onNsfwToggle={setIsNsfwEnabled}
                                />;
      case GameStatus.CharacterCreation:
        return selectedWork && <CharacterCreationScreen work={selectedWork} onSubmit={handleStartFanfic} onBack={resetToModeSelection} savedCharacters={savedCharacters} onSaveCharacter={handleSaveCharacter} />;
      case GameStatus.Playing:
        return selectedWork && <GameScreen 
                                  history={history} 
                                  onUserInput={handleUserInput} 
                                  loading={isLoading}
                                  activeAI={activeAI}
                                  onSaveAndExit={handleSaveAndExit} 
                                  onOpenLorebook={() => setIsLorebookOpen(true)} 
                                  workTitle={selectedWork.title} 
                                  onUpdateLastNarrative={handleUpdateLastNarrative} 
                                  onRegenerate={handleRegenerate} 
                                  canRegenerate={!!lastTurnInfo}
                                  lorebookSuggestions={lorebookSuggestions}
                                  onAddSuggestion={handleAddSuggestionToLorebook}
                                  onDismissSuggestions={() => setLorebookSuggestions([])}
                                  affinity={affinity}
                                  inventory={inventory}
                                  equipment={equipment}
                                  companions={companions}
                                  onEquipItem={handleEquipItem}
                                  onUnequipItem={handleUnequipItem}
                                  gameTime={gameTime}
                                  dating={dating}
                                  spouse={spouse}
                                  onConfess={handleConfess}
                                  onPropose={handlePropose}
                                  suggestedActions={suggestedActions}
                               />;
      case GameStatus.Error:
        const isApiKeyError = error && (error.includes("API key") || error.includes("API Key"));
        return (
          <div className="text-center max-w-xl mx-auto p-8 bg-red-900/20 rounded-xl shadow-lg border border-red-700">
            <h2 className="text-3xl font-serif-display font-bold text-red-200 mb-4">Ôi, có lỗi rồi!</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={() => isApiKeyError ? handleChangeApiKey() : resetToWorkSelection(true)}
              className="bg-red-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 transition-colors duration-300"
            >
              {isApiKeyError ? "Nhập lại API Key" : "Thử lại từ đầu"}
            </button>
          </div>
        );
      default:
        return <LoadingIndicator />;
    }
  };

  return (
    <div className="min-h-screen w-full text-gray-200 flex items-center justify-center p-4">
      <main className="relative z-10 w-full">
        {renderContent()}
      </main>
      <LorebookModal 
        isOpen={isLorebookOpen}
        onClose={() => setIsLorebookOpen(false)}
        entries={lorebook}
        onAdd={handleAddLoreEntry}
        onUpdate={handleUpdateLoreEntry}
        onDelete={handleDeleteLoreEntry}
      />
      <ChangelogScreen
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
        entries={CHANGELOG_ENTRIES}
      />
    </div>
  );
};

export default App;