import React, { useState, useEffect, useRef } from 'react';
import { HistoryMessage, LorebookSuggestion } from '../types';

const TypingIndicator = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce"></div>
    </div>
);

const LorebookSuggestions = ({ suggestions, onAdd, onDismiss }: { suggestions: LorebookSuggestion[], onAdd: (suggestion: LorebookSuggestion) => void, onDismiss: () => void }) => {
  if (suggestions.length === 0) return null;
  
  return (
    <div className="animate-fade-in p-4 bg-amber-50 border-t border-b border-amber-200">
      <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">Gợi ý cho Sổ tay</h4>
          <button onClick={onDismiss} className="text-amber-700 hover:text-amber-900" title="Bỏ qua">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
      </div>
      <ul className="space-y-2">
        {suggestions.map(suggestion => (
          <li key={suggestion.key} className="flex items-center justify-between text-sm bg-white p-2 rounded-md border border-amber-100">
            <div>
              <strong className="font-semibold text-stone-800">{suggestion.key}:</strong>
              <span className="text-stone-600 ml-2">{suggestion.value}</span>
            </div>
            <button 
              onClick={() => onAdd(suggestion)}
              className="ml-4 flex-shrink-0 bg-amber-200 text-amber-800 hover:bg-amber-300 font-bold text-xs py-1 px-2 rounded-full transition-colors"
              title="Thêm vào Sổ tay"
            >
              + Thêm
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface GameScreenProps {
  history: HistoryMessage[];
  onUserInput: (input: string) => void;
  loading: boolean;
  onSaveAndExit: () => void;
  onOpenLorebook: () => void;
  workTitle: string;
  onUpdateLastNarrative: (newContent: string) => void;
  onRegenerate: () => void;
  canRegenerate: boolean;
  lorebookSuggestions: LorebookSuggestion[];
  onAddSuggestion: (suggestion: LorebookSuggestion) => void;
  onDismissSuggestions: () => void;
}

const GameScreen = ({ history, onUserInput, loading, onSaveAndExit, onOpenLorebook, workTitle, onUpdateLastNarrative, onRegenerate, canRegenerate, lorebookSuggestions, onAddSuggestion, onDismissSuggestions }: GameScreenProps) => {
  const [input, setInput] = useState('');
  const [editingMessage, setEditingMessage] = useState<{ id: string, content: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
  <div className="w-full max-w-4xl mx-auto flex flex-col h-[90vh] bg-white rounded-xl shadow-2xl border border-stone-300">
     <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-stone-200 bg-stone-50 rounded-t-xl gap-4">
        <h1 className="text-xl font-serif-display text-stone-800 font-bold truncate" title={workTitle}>{workTitle}</h1>
        <div className="flex-shrink-0 flex items-center gap-2">
          <button
              onClick={onOpenLorebook}
              className="flex items-center gap-2 bg-white text-stone-800 font-semibold py-2 px-3 rounded-lg shadow-sm border border-stone-300 hover:bg-stone-100 transition-colors text-sm"
              title="Mở sổ tay"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
              <span className="hidden sm:inline">Sổ tay</span>
          </button>
          <button
              onClick={onSaveAndExit}
              className="bg-stone-700 text-white font-bold py-2 px-3 rounded-lg shadow hover:bg-stone-600 transition-colors text-sm flex items-center gap-2"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
             <span className="hidden sm:inline">Lưu & Thoát</span>
          </button>
        </div>
    </div>
    <div className="flex-grow p-4 md:p-6 overflow-y-auto bg-stone-100 space-y-6">
        {history.map(msg => {
            const isModel = msg.role === 'model';
            const isUser = msg.role === 'user';
            const isBeingEdited = editingMessage?.id === msg.id;
            return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xl w-full flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 group`}>
                        {isModel && (
                           <button onClick={handleEditClick} disabled={loading || !!editingMessage} title="Chỉnh sửa" className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-stone-500 hover:text-stone-800 disabled:opacity-0 mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                        <div className={`w-full rounded-xl px-4 py-3 shadow-md ${isUser ? 'bg-amber-700 text-white' : 'bg-amber-50 text-stone-800 border border-stone-200'}`}>
                            {isBeingEdited ? (
                                <div className="flex flex-col">
                                    <textarea
                                        value={editingMessage.content}
                                        onChange={(e) => setEditingMessage({...editingMessage, content: e.target.value})}
                                        className="w-full p-2 border border-stone-300 rounded-md focus:ring-amber-500 focus:border-amber-500 bg-white text-stone-800 text-base"
                                        rows={Math.min(20, editingMessage.content.split('\n').length + 2)}
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={handleCancelEdit} className="py-1 px-3 rounded text-stone-700 hover:bg-stone-200 text-sm font-semibold">Hủy</button>
                                        <button onClick={handleSaveEdit} className="py-1 px-3 rounded bg-amber-700 text-white hover:bg-amber-600 text-sm font-semibold">Lưu</button>
                                    </div>
                                </div>
                            ) : (
                                <p className={`whitespace-pre-wrap ${isModel ? 'font-serif-display italic leading-relaxed' : ''}`}>
                                  {msg.content}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )
        })}
        {loading && (
             <div className="flex justify-start">
                 <div className="max-w-xl flex flex-row items-end gap-2">
                     <div className="rounded-xl px-4 py-3 shadow-md bg-amber-50 text-stone-800 border border-stone-200">
                         <TypingIndicator />
                     </div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
    </div>

    <LorebookSuggestions 
      suggestions={lorebookSuggestions}
      onAdd={onAddSuggestion}
      onDismiss={onDismissSuggestions}
    />
    
    <div className="flex-shrink-0 p-4 bg-white border-t border-stone-200 rounded-b-xl">
        <div className="flex items-center gap-2">
            <button
                onClick={onRegenerate}
                disabled={loading || !canRegenerate}
                className="p-2 text-stone-600 hover:bg-stone-200 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    className="w-full px-4 py-2 border border-stone-300 rounded-full focus:ring-amber-500 focus:border-amber-500 resize-none transition-all duration-200 disabled:bg-stone-100"
                    placeholder="Nhập hành động hoặc lời thoại..."
                    style={{maxHeight: '120px'}}
                />
                <button 
                    type="submit" 
                    disabled={loading || !input.trim() || !!editingMessage}
                    className="bg-amber-800 text-white rounded-full p-2.5 shadow-lg hover:bg-amber-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 disabled:bg-stone-400 disabled:cursor-not-allowed disabled:transform-none"
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
