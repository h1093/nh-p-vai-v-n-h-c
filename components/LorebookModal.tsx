import React, { useState, useEffect } from 'react';
import { LorebookEntry } from '../types';

interface LorebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LorebookEntry[];
  onAdd: (entry: { key: string, value: string }) => void;
  onUpdate: (entry: LorebookEntry) => void;
  onDelete: (id: string) => void;
}

const LorebookModal = ({ isOpen, onClose, entries, onAdd, onUpdate, onDelete }: LorebookModalProps) => {
  const [isEditing, setIsEditing] = useState<LorebookEntry | null>(null);
  const [currentKey, setCurrentKey] = useState('');
  const [currentValue, setCurrentValue] = useState('');

  useEffect(() => {
    if (isEditing) {
      setCurrentKey(isEditing.key);
      setCurrentValue(isEditing.value);
    } else {
      setCurrentKey('');
      setCurrentValue('');
    }
  }, [isEditing]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentKey.trim() === '' || currentValue.trim() === '') return;

    if (isEditing) {
      onUpdate({ ...isEditing, key: currentKey, value: currentValue });
    } else {
      onAdd({ key: currentKey, value: currentValue });
    }
    setIsEditing(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-stone-50 rounded-xl shadow-2xl border border-stone-300 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-stone-200 flex justify-between items-center">
          <h2 className="text-3xl font-serif-display font-bold text-stone-800">Sổ tay Thế giới</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        
        <div className="p-6 overflow-y-auto flex-grow">
          {entries.length === 0 && !isEditing ? (
            <div className="text-center py-12">
              <p className="text-stone-500">Sổ tay của bạn đang trống.</p>
              <p className="text-stone-500 mt-1">Thêm một mục mới bên dưới hoặc chờ gợi ý tự động từ câu chuyện.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {entries.map(entry => (
                <li key={entry.id} className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex justify-between items-start">
                  <div>
                    <strong className="text-stone-800 font-bold block">{entry.key}</strong>
                    <p className="text-stone-600 whitespace-pre-wrap">{entry.value}</p>
                  </div>
                  <div className="flex-shrink-0 ml-4 space-x-2">
                    <button onClick={() => setIsEditing(entry)} className="text-amber-700 hover:text-amber-900 font-semibold text-sm">Sửa</button>
                    <button onClick={() => onDelete(entry.id)} className="text-red-600 hover:text-red-800 font-semibold text-sm">Xóa</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <footer className="p-6 border-t border-stone-200 bg-stone-100 rounded-b-xl">
          <h3 className="text-xl font-serif-display font-bold text-stone-700 mb-4">{isEditing ? 'Chỉnh sửa mục' : 'Thêm mục mới'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Khóa (ví dụ: Nhân vật A, Địa danh B)"
              value={currentKey}
              onChange={e => setCurrentKey(e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            />
            <textarea
              placeholder="Giá trị (ví dụ: Mô tả chi tiết về nhân vật, địa danh...)"
              value={currentValue}
              onChange={e => setCurrentValue(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            />
            <div className="flex justify-end items-center gap-4">
              {isEditing && (
                <button type="button" onClick={handleCancelEdit} className="text-stone-700 font-bold py-2 px-6 rounded-lg hover:bg-stone-200 transition-colors">Hủy</button>
              )}
              <button type="submit" className="bg-amber-800 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400">
                {isEditing ? 'Lưu thay đổi' : 'Thêm vào Sổ tay'}
              </button>
            </div>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default LorebookModal;
