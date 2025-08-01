import React from 'react';
import { CharacterData } from '../types';

interface CharacterPanelProps {
  character: CharacterData;
}

const CharacterPanel = ({ character }: CharacterPanelProps) => {
  return (
    <div className="p-4 md:p-6 space-y-4 max-h-72 overflow-y-auto">
      <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider text-center">Hồ sơ nhân vật</h4>
      <div className="bg-gray-700/60 p-4 rounded-lg border border-gray-600 space-y-3 text-gray-200">
        <div>
          <p className="text-xs font-bold text-amber-300 uppercase">Tên</p>
          <p className="font-serif-display text-xl">{character.name}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-amber-300 uppercase">Giới tính</p>
          <p>{character.gender}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-amber-300 uppercase">Ngoại hình</p>
          <p className="italic">{character.appearance}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-amber-300 uppercase">Tính cách</p>
          <p>{character.personality}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-amber-300 uppercase">Hoàn cảnh</p>
          <p>{character.background}</p>
        </div>
      </div>
    </div>
  );
};

export default CharacterPanel;
