import React, { useState, useEffect, useRef } from 'react';
import { HistoryMessage, AffinityData, Item, Equipment, EquipmentSlot, AITypeKey } from '../types';
import AffinityTracker from './AffinityTracker';
import InventoryPanel from './InventoryPanel';
import CompanionPanel from './CompanionPanel';
import AIStatusIndicator from './AIStatusIndicator';
import ChoiceButton from './ChoiceButton';

interface GameScreenProps {
  history: HistoryMessage[];
  onUserInput: (input: string) => void;
  loading: boolean;
  activeAI: AITypeKey | null;
  onSaveAndExit: () => void;
  onOpenLorebook: () => void;
  workTitle: string;
  onUpdateLastNarrative: (newContent: string) => void;
  onRegenerate: () => void;
  canRegenerate: boolean;
  affinity: AffinityData;
  inventory: Item[];
  equipment: Equipment;
  companions: string[];
  onEquipItem: (item: Item) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
  gameTime: number;
  dating: string | null;
  spouse: string | null;
  onConfess: (npcName: string) => void;
  onPropose: (npcName: string) => void;
  onChat: (npcName: string) => void;
  onGiveGift: (npcName: string, item: Item) => void;
  suggestedActions: string[];
}

const GameScreen = (props: GameScreenProps) => {
  const { 
      history, onUserInput, loading, activeAI, onSaveAndExit, onOpenLorebook, workTitle, 
      onUpdateLastNarrative, onRegenerate, canRegenerate, affinity, inventory, equipment,
      companions, onEquipItem, onUnequipItem, gameTime, dating, spouse, onConfess, onPropose,
      onChat, onGiveGift, suggestedActions
  } = props;

  const [input, setInput] = useState('');
  const [editingMessage, setEditingMessage] = useState<{ id: string, content: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [activePanel, setActivePanel] = useState<'affinity' | 'inventory' | 'companions' | null>(null);

  const lastModelMessage = history.slice().reverse().find(m => m.role === 'model');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const autoGrowTextarea = () => {
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
  };

  const formatGameTime = (totalMinutes: number): string => {
    const days = Math.floor(totalMinutes / (24 * 60)) + 1;
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    return `Ngày ${days}, ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  useEffect(scrollToBottom, [history, loading]);
  useEffect(autoGrowTextarea, [input]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onUserInput(input);
      setInput('');
    }
  };
  
  const handleEditClick = () => {
    if (lastModelMessage && !loading) {
      setEditingMessage({ id: lastModelMessage.id, content: lastModelMessage.content });
    }
  };

  const handleSaveEdit = () => {
    if (editingMessage) {
      onUpdateLastNarrative(editingMessage.content);
      setEditingMessage(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  const handleSuggestionClick = (action: string) => {
    if(loading) return;
    onUserInput(action);
    setInput('');
  };
  
  useEffect(() => {
    if (loading || (lastModelMessage && editingMessage && lastModelMessage.id !== editingMessage.id)) {
      setEditingMessage(null);
    }
  }, [loading, lastModelMessage, editingMessage]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleFormSubmit(e);
    }
  };

  const togglePanel = (panel: 'affinity' | 'inventory' | 'companions') => {
      setActivePanel(activePanel === panel ? null : panel);
  };

  return (
  <div className="w-full max-w-4xl mx-auto flex flex-col h-[90vh] bg-gray-900 rounded-xl shadow-2xl shadow-black/20 border border-gray-700">
     <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800 rounded-t-xl gap-2 md:gap-4">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-400" title="Thời gian trong game">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold tracking-wider font-mono">{formatGameTime(gameTime)}</span>
            </div>
            <h1 className="text-lg md:text-xl font-serif-display text-gray-100 font-bold truncate hidden md:block" title={workTitle}>{workTitle}</h1>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 md:gap-2">
           <button
              onClick={() => togglePanel('affinity')}
              className={`flex items-center gap-2 font-semibold py-2 px-3 rounded-lg shadow-sm border text-sm transition-colors ${activePanel === 'affinity' ? 'bg-rose-900/50 border-rose-700 text-rose-300' : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'}`}
              title="Tình cảm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
              <span className="hidden sm:inline">Tình cảm</span>
          </button>
           <button
              onClick={() => togglePanel('companions')}
              className={`flex items-center gap-2 font-semibold py-2 px-3 rounded-lg shadow-sm border text-sm transition-colors ${activePanel === 'companions' ? 'bg-sky-900/50 border-sky-700 text-sky-300' : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'}`}
              title="Đồng đội"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0115 8h-1a4 4 0 00-3.96 3.18l-1.07 3.22A5 5 0 015 8H4a5 5 0 014.5-5.92V2a1 1 0 112 0v.08A5 5 0 0115 8v.28a1 1 0 01-2 0V8a3 3 0 00-3-3H8a3 3 0 00-3 3v1c0 1.13.27 2.18.75 3.12L5.22 15.3A7 7 0 0012 21.054c.003-.001.006-.002.009-.003l.022-.009a1 1 0 01.428-1.935l-1.42-2.13z" /></svg>
              <span className="hidden sm:inline">Đồng đội</span>
          </button>
          <button
              onClick={() => togglePanel('inventory')}
              className={`flex items-center gap-2 font-semibold py-2 px-3 rounded-lg shadow-sm border text-sm transition-colors ${activePanel === 'inventory' ? 'bg-yellow-900/50 border-yellow-700 text-yellow-300' : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'}`}
              title="Túi đồ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4z" clipRule="evenodd" /></svg>
              <span className="hidden sm:inline">Túi đồ</span>
          </button>
          <button
              onClick={onOpenLorebook}
              className="flex items-center gap-2 bg-gray-700 text-gray-200 font-semibold py-2 px-3 rounded-lg shadow-sm border border-gray-600 hover:bg-gray-600 transition-colors text-sm"
              title="Mở sổ tay"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
              <span className="hidden sm:inline">Sổ tay</span>
          </button>
          <button
              onClick={onSaveAndExit}
              className="bg-gray-600 text-white font-bold py-2 px-3 rounded-lg shadow hover:bg-gray-500 transition-colors text-sm flex items-center gap-2"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
             <span className="hidden sm:inline">Lưu & Thoát</span>
          </button>
        </div>
    </div>
     {activePanel && (
        <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800 animate-fade-in">
            {activePanel === 'affinity' && <AffinityTracker affinityData={affinity} />}
            {activePanel === 'inventory' && <InventoryPanel inventory={inventory} equipment={equipment} onEquip={onEquipItem} onUnequip={onUnequipItem} />}
            {activePanel === 'companions' && <CompanionPanel companions={companions} affinityData={affinity} inventory={inventory} dating={dating} spouse={spouse} onConfess={onConfess} onPropose={onPropose} onChat={onChat} onGiveGift={onGiveGift} />}
        </div>
    )}
    <div className="flex-grow p-4 md:p-6 overflow-y-auto bg-gray-900 space-y-6">
        {history.map(msg => {
            const isModel = msg.role === 'model';
            const isUser = msg.role === 'user';
            const isBeingEdited = editingMessage?.id === msg.id;
            const isDialogue = isModel && msg.speaker !== 'Người dẫn chuyện';

            return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xl w-full flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 group`}>
                         {isModel && (
                           <button onClick={handleEditClick} disabled={loading || !!editingMessage} title="Chỉnh sửa" className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-white disabled:opacity-0 mb-1 self-start mt-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                        <div className={`w-full rounded-xl shadow-md ${isUser ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-200 border border-gray-700'}`}>
                            {isModel && <p className="px-4 pt-3 text-xs font-bold text-gray-400 uppercase">{msg.speaker}</p>}
                            <div className="px-4 pb-3 pt-1">
                                {isBeingEdited ? (
                                    <div className="flex flex-col">
                                        <textarea
                                            value={editingMessage.content}
                                            onChange={(e) => setEditingMessage({...editingMessage, content: e.target.value})}
                                            className="w-full p-2 border border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500 bg-gray-700 text-gray-100 text-base"
                                            rows={Math.min(20, editingMessage.content.split('\n').length + 2)}
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button onClick={handleCancelEdit} className="py-1 px-3 rounded text-gray-300 hover:bg-gray-600 text-sm font-semibold">Hủy</button>
                                            <button onClick={handleSaveEdit} className="py-1 px-3 rounded bg-amber-700 text-white hover:bg-amber-600 text-sm font-semibold">Lưu</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className={`whitespace-pre-wrap ${isDialogue ? '' : 'font-serif-display italic leading-relaxed'}`}>
                                      {msg.content}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )
        })}
        {loading && (
             <div className="flex justify-start">
                 <div className="max-w-xl flex flex-row items-end gap-2">
                     <div className="rounded-xl px-4 py-3 shadow-md bg-gray-800 text-gray-200 border border-gray-700">
                         <AIStatusIndicator activeAI={activeAI} />
                     </div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
    </div>

    <div className="flex-shrink-0 p-4 bg-gray-800 border-t border-gray-700 rounded-b-xl">
      {!loading && !editingMessage && suggestedActions.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2 border-b border-gray-700 pb-4 animate-fade-in">
              <p className="text-sm font-semibold text-gray-400 mr-2 self-center">Gợi ý:</p>
              {suggestedActions.map((action, index) => (
                  <ChoiceButton
                      key={index}
                      onClick={() => handleSuggestionClick(action)}
                      size="sm"
                      variant="secondary"
                      className="!bg-gray-700 !text-gray-300 hover:!bg-gray-600"
                  >
                      {action}
                  </ChoiceButton>
              ))}
          </div>
        )}
        <div className="flex items-center gap-2">
            <button
                onClick={onRegenerate}
                disabled={loading || !canRegenerate}
                className="p-2 text-gray-400 hover:bg-gray-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Tạo lại"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 15M20 20l-1.5-1.5A9 9 0 003.5 9" />
                </svg>
            </button>
            <form onSubmit={handleFormSubmit} className="flex-grow flex items-center gap-2">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading || !!editingMessage}
                    rows={1}
                    className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-full focus:ring-amber-500 focus:border-amber-500 resize-none transition-all duration-200 disabled:bg-gray-700/50 placeholder-gray-500"
                    placeholder="Nhập hành động hoặc lời thoại..."
                    style={{maxHeight: '120px'}}
                />
                <button 
                    type="submit" 
                    disabled={loading || !input.trim() || !!editingMessage}
                    className="bg-amber-800 text-white rounded-full p-2.5 shadow-lg hover:bg-amber-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                    title="Gửi"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </form>
        </div>
    </div>
  </div>
  );
};

export default GameScreen;