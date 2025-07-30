import React from 'react';
import { ChangelogEntry } from '../constants';

interface ChangelogScreenProps {
  isOpen: boolean;
  onClose: () => void;
  entries: ChangelogEntry[];
}

const ChangelogScreen = ({ isOpen, onClose, entries }: ChangelogScreenProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-3xl font-serif-display font-bold text-gray-100">Nhật ký cập nhật</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-grow">
          <ul className="space-y-8">
            {entries.map(entry => (
              <li key={entry.version} className="animate-fade-in">
                <div className="flex items-baseline gap-4">
                    <h3 className="text-2xl font-serif-display font-bold text-amber-400">{entry.version}</h3>
                    <p className="text-gray-400 text-sm">{entry.date}</p>
                </div>
                <ul className="mt-3 list-disc list-inside space-y-2 text-gray-300">
                  {entry.changes.map((change, index) => (
                    <li key={index}>{change}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        
        <footer className="p-4 bg-gray-900 rounded-b-xl text-center">
           <button onClick={onClose} className="bg-amber-800 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400">
                Đóng
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ChangelogScreen;
