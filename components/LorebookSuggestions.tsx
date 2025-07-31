import React from 'react';
import { LorebookSuggestion } from '../types';

interface LorebookSuggestionsProps {
    suggestions: LorebookSuggestion[];
    onAdd: (suggestion: LorebookSuggestion) => void;
    onDismiss: (id: string) => void;
}

const LorebookSuggestions = ({ suggestions, onAdd, onDismiss }: LorebookSuggestionsProps) => {
    if (suggestions.length === 0) {
        return null;
    }

    return (
        <div className="mb-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg animate-fade-in">
            <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3">Gợi ý cho Sổ tay</h4>
            <ul className="space-y-3">
                {suggestions.map(suggestion => (
                    <li key={suggestion.id} className="bg-gray-700/80 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:bg-gray-700">
                        <div className="flex-grow">
                            <strong className="text-gray-200 font-semibold">{suggestion.key}</strong>
                            <p className="text-sm text-gray-400 italic">"{suggestion.value}"</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                            <button
                                onClick={() => onAdd(suggestion)}
                                className="px-3 py-1 text-sm font-semibold text-green-200 bg-green-900/60 hover:bg-green-800/80 rounded-md transition-colors border border-green-700/50"
                                title={`Thêm "${suggestion.key}" vào Sổ tay`}
                            >
                                Thêm
                            </button>
                            <button
                                onClick={() => onDismiss(suggestion.id)}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition-colors"
                                title="Bỏ qua"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default LorebookSuggestions;
