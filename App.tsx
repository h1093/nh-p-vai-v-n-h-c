import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

import { GameStatus, Work, Character, CharacterData, HistoryMessage, LorebookEntry, LorebookSuggestion } from './types';
import { LITERARY_WORKS, createCustomLiteraryWork, SAVE_GAME_KEY, CHARACTERS_SAVE_KEY, API_KEY_STORAGE_KEY } from './constants';
import { generateStorySegment, extractLoreSuggestions } from './services/geminiService';
import LoadingIndicator from './components/LoadingIndicator';
import GameScreen from './components/GameScreen';
import LorebookModal from './components/LorebookModal';

const ApiKeyScreen = ({ onSubmit, error }: { onSubmit: (key: string) => void, error: string | null }) => {
    const [key, setKey] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (key.trim()) {
        onSubmit(key.trim());
      }
    };

    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-2xl border border-stone-300 text-center">
        <h1 className="text-3xl font-serif-display font-bold text-stone-800 mb-4">Nhập API Key</h1>
        <p className="text-stone-600 mb-6">
          Vui lòng nhập khóa API Google Gemini của bạn để bắt đầu. Khóa của bạn sẽ được lưu trữ cục bộ trên trình duyệt.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
            placeholder="Google Gemini API Key"
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-amber-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400"
          >
            Lưu & Tiếp tục
          </button>
        </form>
         <p className="text-xs text-stone-500 mt-4">
          Bạn có thể lấy API key tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-700">Google AI Studio</a>.
        </p>
      </div>
    );
};

const WorkSelectionScreen = ({ works, onSelect, onCreateCustom, hasSavedGame, onResume, onChangeApiKey }: { works: Work[], onSelect: (work: Work) => void, onCreateCustom: () => void, hasSavedGame: boolean, onResume: () => void, onChangeApiKey: () => void }) => (
    <div className="text-center max-w-5xl mx-auto p-8">
        <h1 className="text-5xl md:text-6xl font-serif-display font-bold text-stone-900 mb-4">Nhập Vai Văn Học</h1>
        <p className="text-stone-600 text-lg mb-10">
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
                <p className="text-stone-500 mt-3 text-sm">hoặc bắt đầu một câu chuyện mới bên dưới</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {works.map(work => (
                <div 
                    key={work.id}
                    className="bg-white rounded-xl shadow-2xl border border-stone-300 overflow-hidden flex flex-col group cursor-pointer transform hover:-translate-y-2 transition-transform duration-300"
                    onClick={() => onSelect(work)}
                >
                    <div className="p-8 text-left flex-grow">
                        <h2 className="text-3xl font-serif-display font-bold text-stone-800 mb-2">{work.title}</h2>
                        <p className="text-stone-500 font-semibold mb-4">Tác giả: {work.author}</p>
                        <p className="text-stone-600">{work.description}</p>
                    </div>
                    <div className="bg-stone-800 text-amber-50 font-bold py-3 px-8 group-hover:bg-amber-800 transition-colors duration-300 text-center">
                        Khám phá
                    </div>
                </div>
            ))}
            <div 
                key="custom-world"
                className="bg-amber-50 rounded-xl shadow-2xl border border-amber-300 overflow-hidden flex flex-col group cursor-pointer transform hover:-translate-y-2 transition-transform duration-300"
                onClick={onCreateCustom}
            >
                <div className="p-8 text-center flex-grow flex flex-col items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-amber-800 group-hover:text-amber-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <h2 className="text-3xl font-serif-display font-bold text-amber-900 mt-4">Tạo Thế Giới Mới</h2>
                    <p className="text-amber-800 mt-2">Nhập vào tác phẩm, tóm tắt, hoặc ý tưởng của bạn.</p>
                </div>
                <div className="bg-amber-800 text-white font-bold py-3 px-8 group-hover:bg-amber-700 transition-colors duration-300 text-center">
                    Bắt đầu sáng tạo
                </div>
            </div>
        </div>
         <div className="mt-12 text-center">
            <button
              onClick={onChangeApiKey}
              className="text-stone-500 hover:text-stone-800 underline text-sm font-semibold"
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
        <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow-2xl border border-stone-300">
            <h1 className="text-4xl font-serif-display font-bold text-stone-800 mb-6 text-center">Tạo Thế Giới Mới</h1>
            <p className="text-stone-600 mb-8 text-center">Cung cấp nội dung để AI xây dựng thế giới, nhân vật và văn phong cho câu chuyện của bạn.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label htmlFor="title" className="block text-sm font-bold text-stone-700 mb-2">Tên tác phẩm (Tùy chọn)</label>
                    <input type="text" id="title" name="title" value={worldData.title} onChange={handleChange} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Số Đỏ, Lão Hạc, Harry Potter..."/>
                </div>
                 <div>
                    <label htmlFor="author" className="block text-sm font-bold text-stone-700 mb-2">Tác giả (Tùy chọn)</label>
                    <input type="text" id="author" name="author" value={worldData.author} onChange={handleChange} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Vũ Trọng Phụng, Nam Cao..."/>
                </div>
                <div>
                    <label htmlFor="content" className="block text-sm font-bold text-stone-700 mb-2">Nội dung, tóm tắt, hoặc trích đoạn</label>
                    <textarea id="content" name="content" value={worldData.content} onChange={handleChange} rows={10} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Dán nội dung vào đây. Nội dung càng chi tiết, AI sẽ tạo ra thế giới càng sâu sắc và đúng với văn phong gốc. (Yêu cầu tối thiểu 50 ký tự)" required />
                    {!isFormValid && worldData.content.trim() !== '' && <p className="text-sm text-red-600 mt-1">Nội dung cần dài hơn để AI có thể hiểu được bối cảnh.</p>}
                </div>
                <div className="flex items-center justify-between pt-4">
                    <button type="button" onClick={onBack} className="text-stone-700 font-bold py-3 px-8 rounded-lg hover:bg-stone-200 transition-colors">Quay lại</button>
                    <button type="submit" disabled={!isFormValid} className="bg-amber-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 disabled:bg-stone-400 disabled:cursor-not-allowed disabled:transform-none">Tạo thế giới & Viết truyện</button>
                </div>
            </form>
        </div>
    );
};

const ModeSelectionScreen = ({ work, onStartAsOriginal, onStartFanfic, onBack }: { work: Work, onStartAsOriginal: () => void, onStartFanfic: () => void, onBack: () => void }) => (
  <div className="relative text-center max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-2xl border border-stone-300">
    <button onClick={onBack} className="absolute top-4 left-4 text-stone-600 hover:text-stone-900 font-bold py-2 px-4 transition-colors">
        &larr; Chọn lại tác phẩm
    </button>
    <h1 className="text-5xl md:text-6xl font-serif-display font-bold text-stone-800 mb-2">{work.title}</h1>
    <p className="text-stone-600 text-lg mb-8">
        Mỗi lựa chọn của bạn sẽ viết nên một trang truyện khác biệt trong thế giới của {work.author}.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border border-stone-300 rounded-lg p-6 flex flex-col items-center bg-stone-50">
        <h2 className="text-2xl font-serif-display font-bold text-stone-800 mb-2">{work.originalCharacterName}</h2>
        <p className="text-stone-600 mb-4 flex-grow">{work.originalCharacterDescription}</p>
        <button
          onClick={onStartAsOriginal}
          className="bg-stone-800 text-amber-50 font-bold py-3 px-10 rounded-lg shadow-lg hover:bg-stone-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-stone-400 w-full"
        >
          Vào vai {work.originalCharacterName}
        </button>
      </div>
      <div className="border border-stone-300 rounded-lg p-6 flex flex-col items-center bg-stone-50">
        <h2 className="text-2xl font-serif-display font-bold text-stone-800 mb-2">Đồng nhân</h2>
        <p className="text-stone-600 mb-4 flex-grow">{work.fanficDescription}</p>
        <button
          onClick={onStartFanfic}
          className="bg-amber-800 text-white font-bold py-3 px-10 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 w-full"
        >
          Tạo nhân vật mới
        </button>
      </div>
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
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-2xl border border-stone-300">
      <h1 className="text-4xl font-serif-display font-bold text-stone-800 mb-6 text-center">Tạo Nhân Vật Mới</h1>
      <p className="text-stone-600 mb-8 text-center">Hãy thổi hồn cho nhân vật của bạn để bắt đầu một câu chuyện mới trong thế giới của <span className="font-bold">{work.title}</span>.</p>
      
      {savedCharacters.length > 0 && (
        <div className="mb-8">
          <label htmlFor="character-select" className="block text-sm font-bold text-stone-700 mb-2">Hoặc chọn nhân vật đã có</label>
          <select
            id="character-select"
            onChange={handleSelectCharacter}
            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm"
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
          <label htmlFor="name" className="block text-sm font-bold text-stone-700 mb-2">Tên nhân vật</label>
          <input type="text" id="name" name="name" value={character.name} onChange={handleChange} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Anh Ba Gánh Nước" required />
        </div>
        <div>
          <label htmlFor="appearance" className="block text-sm font-bold text-stone-700 mb-2">Ngoại hình</label>
          <textarea id="appearance" name="appearance" value={character.appearance} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Thân hình gầy gò, nước da ngăm đen..." required />
        </div>
        <div>
          <label htmlFor="personality" className="block text-sm font-bold text-stone-700 mb-2">Tính cách</label>
          <textarea id="personality" name="personality" value={character.personality} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Hiền lành, ít nói nhưng quật cường..." required />
        </div>
        <div>
          <label htmlFor="background" className="block text-sm font-bold text-stone-700 mb-2">Hoàn cảnh</label>
          <textarea id="background" name="background" value={character.background} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Một thầy lang trẻ từ nơi khác đến..." required />
        </div>
        
        <div className="flex items-center gap-3 pt-2">
            <input 
                type="checkbox" 
                id="saveCharacter" 
                name="saveCharacter" 
                checked={shouldSave} 
                onChange={(e) => setShouldSave(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="saveCharacter" className="text-sm text-stone-700 font-medium">Lưu nhân vật này để sử dụng lại</label>
        </div>

        <div className="flex items-center justify-between pt-4">
           <button type="button" onClick={onBack} className="text-stone-700 font-bold py-3 px-8 rounded-lg hover:bg-stone-200 transition-colors">Quay lại</button>
          <button type="submit" disabled={!isFormValid} className="bg-amber-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 disabled:bg-stone-400 disabled:cursor-not-allowed disabled:transform-none">Bắt đầu câu chuyện</button>
        </div>
      </form>
    </div>
  );
};

const App = () => {
  const [status, setStatus] = useState<keyof typeof GameStatus>(GameStatus.Loading);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [savedCharacters, setSavedCharacters] = useState<Character[]>([]);
  const [lorebook, setLorebook] = useState<LorebookEntry[]>([]);
  const [isLorebookOpen, setIsLorebookOpen] = useState(false);
  const [lorebookSuggestions, setLorebookSuggestions] = useState<LorebookSuggestion[]>([]);

  useEffect(() => {
    try {
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

  const handleGenerateStory = useCallback(async (prompt: string, systemInstruction: string, currentLorebook: LorebookEntry[]) => {
      if (!ai) {
        throw new Error("Ứng dụng chưa được khởi tạo với API Key.");
      }
      setIsLoading(true);
      setError(null);
      setLastPrompt(prompt);
      setLorebookSuggestions([]);
      try {
        const segment = await generateStorySegment(ai, prompt, systemInstruction, currentLorebook);
        const newModelMessage = { role: 'model' as const, content: segment.narrative, id: `model-${Date.now()}` };
        setHistory(prev => [...prev, newModelMessage]);
        
        // Fire-and-forget suggestion extraction
        extractLoreSuggestions(ai, segment.narrative, currentLorebook).then(setLorebookSuggestions);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định.";
        setError(errorMessage);
        setStatus(GameStatus.Error);
      } finally {
        setIsLoading(false);
      }
  }, [ai]);

  const startStory = useCallback(async (initialPrompt: string, systemInstruction: string) => {
    setIsLoading(true);
    setError(null);
    setLastPrompt(initialPrompt);
    setLorebookSuggestions([]);
    try {
      if (!ai) throw new Error("API client not initialized.");
      const firstSegment = await generateStorySegment(ai, initialPrompt, systemInstruction, []);
      setHistory([{ role: 'model', content: firstSegment.narrative, id: `model-${Date.now()}` }]);
      setStatus(GameStatus.Playing);
      extractLoreSuggestions(ai, firstSegment.narrative, []).then(setLorebookSuggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định.");
      setStatus(GameStatus.Error);
    } finally {
      setIsLoading(false);
    }
  }, [ai]);
  
  const handleUserInput = useCallback(async (userInput: string) => {
    if (!selectedWork || !ai) return;
    
    const newUserMessage: HistoryMessage = { role: 'user', content: userInput, id: `user-${Date.now()}`};
    const newHistory = [...history, newUserMessage];
    setHistory(newHistory);

    await handleGenerateStory(userInput, selectedWork.systemInstruction, lorebook);
  }, [selectedWork, ai, history, lorebook, handleGenerateStory]);

  const handleRegenerate = useCallback(async () => {
      if (!selectedWork || !lastPrompt || isLoading || !ai) return;
      
      const historyWithoutLastModelMessage = history.filter(m => m.role !== 'model' || m.id !== history[history.length - 1].id);
      setHistory(historyWithoutLastModelMessage);

      await handleGenerateStory(lastPrompt, selectedWork.systemInstruction, lorebook);

  }, [selectedWork, lastPrompt, lorebook, isLoading, ai, history, handleGenerateStory]);
  
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
      if (window.confirm("Bạn có muốn thay đổi API Key? Hành động này sẽ đưa bạn về màn hình chính.")) {
          localStorage.removeItem(API_KEY_STORAGE_KEY);
          localStorage.removeItem(SAVE_GAME_KEY); // Also clear save game
          setAi(null);
          setHistory([]);
          setSelectedWork(null);
          setHasSavedGame(false);
          setStatus(GameStatus.ApiKeyEntry);
          setError(null);
      }
  };

  const handleStartNewGame = (startAction: () => void) => {
    if (hasSavedGame) {
        if (window.confirm("Bạn có chắc muốn bắt đầu một câu chuyện mới? Tiến trình hiện tại sẽ bị xóa.")) {
            localStorage.removeItem(SAVE_GAME_KEY);
            setHasSavedGame(false);
            setLorebook([]);
            setLastPrompt(null);
            setHistory([]);
            startAction();
        }
    } else {
        setLorebook([]);
        setLastPrompt(null);
        setHistory([]);
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
        startStory(selectedWork.initialPromptOriginal, selectedWork.systemInstruction);
    }
  };
  
  const handleStartFanfic = (character: CharacterData) => {
    if (selectedWork) {
        const prompt = selectedWork.getFanficInitialPrompt(character);
        startStory(prompt, selectedWork.systemInstruction);
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
    setHistory([]);
    setError(null);
    setLorebook([]);
    setLastPrompt(null);
    setLorebookSuggestions([]);
  }

  const resetToModeSelection = () => {
    if(selectedWork && selectedWork.id.startsWith('custom-')) {
        setStatus(GameStatus.WorldCreation);
    } else {
        setStatus(GameStatus.Start);
    }
    setHistory([]);
    setError(null);
    setLorebookSuggestions([]);
  }

  const handleSaveAndExit = () => {
    if (status === GameStatus.Playing && selectedWork && history.length > 0) {
        const stateToSave = {
            version: 'v4',
            selectedWork,
            history,
            lorebook,
            lastPrompt,
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
        const { version, selectedWork: savedWork, history: savedHistory, lorebook: savedLorebook, lastPrompt: savedLastPrompt } = JSON.parse(savedData);
        if(version !== 'v4'){
            resetToWorkSelection(true);
            alert("Phiên bản lưu cũ không tương thích. Bắt đầu trò chơi mới.");
            return;
        }

        let workInstance;
        if (savedWork.id.startsWith('custom-')) {
            workInstance = createCustomLiteraryWork(savedWork.title, savedWork.author, savedWork.content || '');
            workInstance.id = savedWork.id; 
        } else {
            const foundWork = LITERARY_WORKS.find(w => w.id === savedWork.id);
            if (!foundWork) throw new Error("Could not find saved work.");
            workInstance = foundWork;
        }

        setSelectedWork(workInstance);
        setHistory(savedHistory || []);
        setLorebook(savedLorebook || []);
        setLastPrompt(savedLastPrompt || null);
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

  const renderContent = () => {
    switch (status) {
      case GameStatus.ApiKeyEntry:
        return <ApiKeyScreen onSubmit={handleApiKeySubmit} error={error} />;
      case GameStatus.WorkSelection:
        return <WorkSelectionScreen works={LITERARY_WORKS} onSelect={handleSelectWork} onCreateCustom={handleStartWorldCreation} hasSavedGame={hasSavedGame} onResume={handleResumeGame} onChangeApiKey={handleChangeApiKey} />;
      case GameStatus.WorldCreation:
        return <WorldCreatorScreen onSubmit={handleCreateCustomWork} onBack={() => resetToWorkSelection(false)} />;
      case GameStatus.Start:
        return selectedWork && <ModeSelectionScreen work={selectedWork} onStartAsOriginal={handleStartOriginal} onStartFanfic={handleStartCharacterCreation} onBack={() => resetToWorkSelection(false)} />;
      case GameStatus.CharacterCreation:
        return selectedWork && <CharacterCreationScreen work={selectedWork} onSubmit={handleStartFanfic} onBack={resetToModeSelection} savedCharacters={savedCharacters} onSaveCharacter={handleSaveCharacter} />;
      case GameStatus.Playing:
        return selectedWork && <GameScreen 
                                  history={history} 
                                  onUserInput={handleUserInput} 
                                  loading={isLoading} 
                                  onSaveAndExit={handleSaveAndExit} 
                                  onOpenLorebook={() => setIsLorebookOpen(true)} 
                                  workTitle={selectedWork.title} 
                                  onUpdateLastNarrative={handleUpdateLastNarrative} 
                                  onRegenerate={handleRegenerate} 
                                  canRegenerate={!!lastPrompt}
                                  lorebookSuggestions={lorebookSuggestions}
                                  onAddSuggestion={handleAddSuggestionToLorebook}
                                  onDismissSuggestions={() => setLorebookSuggestions([])}
                               />;
      case GameStatus.Error:
        const isApiKeyError = error && (error.includes("API key") || error.includes("API Key"));
        return (
          <div className="text-center max-w-xl mx-auto p-8 bg-red-50 rounded-xl shadow-lg border border-red-300">
            <h2 className="text-3xl font-serif-display font-bold text-red-800 mb-4">Ôi, có lỗi rồi!</h2>
            <p className="text-red-700 mb-6">{error}</p>
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
    <div className="min-h-screen w-full text-stone-900 flex items-center justify-center p-4">
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
    </div>
  );
};

export default App;
