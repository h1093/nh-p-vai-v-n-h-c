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

const LorebookModal = (props: LorebookModalProps) => {
  const { 
    isOpen, onClose, entries, onAdd, onUpdate, onDelete,
  } = props;

  const [isEditing, setIsEditing] = useState<LorebookEntry | null>(null);
  const [currentKey, setCurrentKey] = useState('');
  const [currentValue, setCurrentValue] = useState('');

  useEffect(() => {
    if (!isOpen) {
        setIsEditing(null);
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-3xl font-serif-display font-bold text-gray-100">Sổ tay Thế giới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white self-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        
        <div className="overflow-y-auto flex-grow p-6">
          {entries.length === 0 && !isEditing ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Sổ tay của bạn đang trống.</p>
              <p className="text-gray-400 mt-1">Sử dụng biểu mẫu bên dưới để thêm một mục mới.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {entries.map(entry => (
                <li key={entry.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600 shadow-sm flex justify-between items-start">
                  <div>
                    <strong className="text-gray-200 font-bold block">{entry.key}</strong>
                    <p className="text-gray-300 whitespace-pre-wrap">{entry.value}</p>
                  </div>
                  <div className="flex-shrink-0 ml-4 space-x-2">
                    <button onClick={() => setIsEditing(entry)} className="text-amber-500 hover:text-amber-400 font-semibold text-sm">Sửa</button>
                    <button onClick={() => onDelete(entry.id)} className="text-red-500 hover:text-red-400 font-semibold text-sm">Xóa</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <footer className="p-6 border-t border-gray-700 bg-gray-900 rounded-b-xl flex-shrink-0">
          <h3 className="text-xl font-serif-display font-bold text-gray-300 mb-4">{isEditing ? 'Chỉnh sửa mục' : 'Thêm mục mới'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Khóa (ví dụ: Nhân vật A, Địa danh B)"
              value={currentKey}
              onChange={e => setCurrentKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            />
            <textarea
              placeholder="Giá trị (ví dụ: Mô tả chi tiết về nhân vật, địa danh...)"
              value={currentValue}
              onChange={e => setCurrentValue(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            />
            <div className="flex justify-end items-center gap-4">
              {isEditing && (
                <button type="button" onClick={handleCancelEdit} className="text-gray-300 font-bold py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors">Hủy</button>
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