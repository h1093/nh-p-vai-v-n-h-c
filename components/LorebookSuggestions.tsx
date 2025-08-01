import React from 'react';
import { LorebookSuggestion } from '../types';

interface LorebookSuggestionsProps {
  suggestions: LorebookSuggestion[];
  onAccept: (suggestion: LorebookSuggestion) => void;
  onDismiss: (suggestion: LorebookSuggestion) => void;
  onDismissAll: () => void;
}

const LorebookSuggestions = ({ suggestions, onAccept, onDismiss, onDismissAll }: LorebookSuggestionsProps) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 border-b border-gray-700 pb-4 bg-gray-900/50 animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Gợi ý cho Sổ tay</h4>
        <button
          onClick={onDismissAll}
          className="text-gray-400 hover:text-white text-xs font-semibold"
        >
          Bỏ qua tất cả
        </button>
      </div>
      <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
        {suggestions.map((sugg, index) => (
          <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <p className="font-bold text-gray-200">{sugg.key}</p>
            <p className="text-sm text-gray-300 mt-1">{sugg.value}</p>
            <p className="text-xs text-gray-400 italic mt-2">Lý do: {sugg.reason}</p>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => onDismiss(sugg)} className="px-3 py-1 text-xs font-semibold text-gray-300 rounded-md hover:bg-gray-700">Bỏ qua</button>
              <button onClick={() => onAccept(sugg)} className="px-3 py-1 text-xs font-semibold text-white bg-amber-700 rounded-md hover:bg-amber-600">Thêm vào Sổ tay</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LorebookSuggestions;
