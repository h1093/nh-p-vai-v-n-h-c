import React, { useState } from 'react';
import { Goal } from '../types';
import ChoiceButton from './ChoiceButton';

interface GoalsPanelProps {
  goals: Goal[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const GoalsPanel = ({ goals, onAdd, onToggle, onDelete }: GoalsPanelProps) => {
  const [newGoalText, setNewGoalText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalText.trim()) {
      onAdd(newGoalText);
      setNewGoalText('');
    }
  };

  return (
    <div className="p-4 space-y-4 max-h-72 overflow-y-auto">
      <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider text-center">Mục tiêu của bạn</h4>

      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          type="text"
          value={newGoalText}
          onChange={(e) => setNewGoalText(e.target.value)}
          placeholder="Thêm một mục tiêu mới..."
          className="flex-grow w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm"
        />
        <ChoiceButton type="submit" disabled={!newGoalText.trim()}>
          Thêm
        </ChoiceButton>
      </form>

      {goals.length === 0 ? (
        <p className="text-center text-sm text-gray-400 italic mt-4">
          Bạn chưa đặt ra mục tiêu nào. Hãy thêm một mục tiêu để bắt đầu!
        </p>
      ) : (
        <ul className="space-y-2">
          {goals.map((goal) => (
            <li
              key={goal.id}
              className="bg-gray-700/60 p-3 rounded-lg border border-gray-600 shadow-sm flex items-center gap-3 transition-colors"
            >
              <input
                type="checkbox"
                checked={goal.completed}
                onChange={() => onToggle(goal.id)}
                className="h-5 w-5 rounded border-gray-400 bg-gray-600 text-amber-600 focus:ring-amber-500 cursor-pointer flex-shrink-0"
              />
              <span className={`flex-grow text-gray-200 ${goal.completed ? 'line-through text-gray-400' : ''}`}>
                {goal.text}
              </span>
              <button
                onClick={() => onDelete(goal.id)}
                className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 p-1 rounded-full"
                title="Xóa mục tiêu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GoalsPanel;