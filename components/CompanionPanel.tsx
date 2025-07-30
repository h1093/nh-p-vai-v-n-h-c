import React, { useState } from 'react';
import { AffinityData, Item } from '../types';
import ChoiceButton from './ChoiceButton';

interface CompanionPanelProps {
  companions: string[];
  affinityData: AffinityData;
  inventory: Item[];
  dating: string | null;
  spouse: string | null;
  onConfess: (npcName: string) => void;
  onPropose: (npcName: string) => void;
  onChat: (npcName: string) => void;
  onGiveGift: (npcName: string, item: Item) => void;
}

const getBarColor = (score: number) => {
    if (score < -50) return 'bg-red-600';
    if (score < 0) return 'bg-red-500';
    if (score > 50) return 'bg-green-500';
    if (score > 0) return 'bg-green-600';
    return 'bg-gray-500';
};

const CompanionPanel = ({ companions, affinityData, inventory, dating, spouse, onConfess, onPropose, onChat, onGiveGift }: CompanionPanelProps) => {
  const [giftingTo, setGiftingTo] = useState<string | null>(null);

  if (companions.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-400 italic">
        Bạn đang phiêu lưu một mình.
      </div>
    );
  }

  const hasGrassRing = inventory.some(item => item.name.toLowerCase() === 'nhẫn cỏ');

  return (
    <div className="p-4 space-y-4 max-h-72 overflow-y-auto">
        <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider text-center">Đồng đội</h4>
        <ul className="space-y-3">
            {companions.map(name => {
                const score = affinityData[name] || 0;
                const percentage = ((score + 100) / 200) * 100;
                const isSpouse = spouse === name;
                const isDating = dating === name;
                const canConfess = !isSpouse && !isDating && !dating && !spouse && score > 70;
                const canPropose = isDating && score > 90 && hasGrassRing;

                return (
                    <li key={name} className="bg-gray-700/60 p-3 rounded-lg border border-gray-600">
                        <div className="flex justify-between items-center mb-1 text-sm">
                            <div className="flex items-center gap-2">
                                {isSpouse ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                                        <title>Bạn đời</title>
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                ) : isDating && (
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-300" viewBox="0 0 20 20" fill="currentColor">
                                        <title>Người yêu</title>
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span className="font-semibold text-gray-200">{name}</span>
                                {isSpouse && <span className="text-xs text-pink-400 font-bold tracking-wide">(Bạn đời)</span>}
                                {isDating && <span className="text-xs text-rose-300 font-bold tracking-wide">(Người yêu)</span>}
                            </div>
                            <span className={`font-mono font-bold ${score > 0 ? 'text-green-400' : score < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                {score}
                            </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 shadow-inner">
                            <div
                                className={`h-2.5 rounded-full transition-all duration-500 ease-out ${getBarColor(score)}`}
                                style={{ width: `${percentage}%` }}
                                title={`Tình cảm: ${score}`}
                            ></div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 justify-end">
                            <ChoiceButton onClick={() => onChat(name)} size="sm" variant="secondary">
                                Tán gẫu
                            </ChoiceButton>
                            <ChoiceButton onClick={() => setGiftingTo(giftingTo === name ? null : name)} size="sm" variant="secondary" disabled={inventory.length === 0} title={inventory.length === 0 ? "Túi đồ trống" : "Tặng quà"}>
                                Tặng quà
                            </ChoiceButton>
                            {canConfess && (
                                <ChoiceButton onClick={() => onConfess(name)} size="sm" variant="secondary" className="!bg-rose-800 hover:!bg-rose-700 !text-white">
                                    Tỏ tình
                                </ChoiceButton>
                            )}
                            {canPropose && (
                                <ChoiceButton onClick={() => onPropose(name)} size="sm" variant="primary">
                                    Cầu hôn
                                </ChoiceButton>
                            )}
                        </div>
                        {giftingTo === name && (
                            <div className="mt-2 p-2 bg-gray-900/50 rounded-md">
                                <p className="text-xs text-gray-300 mb-2 font-semibold">Chọn một vật phẩm để tặng:</p>
                                {inventory.length > 0 ? (
                                    <ul className="max-h-28 overflow-y-auto space-y-1">
                                        {inventory.map(item => (
                                            <li key={item.id}>
                                                <button 
                                                    onClick={() => { onGiveGift(name, item); setGiftingTo(null); }}
                                                    className="w-full text-left text-sm p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
                                                >
                                                    {item.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">Túi đồ của bạn trống.</p>
                                )}
                            </div>
                        )}
                    </li>
                )
            })}
        </ul>
    </div>
  );
};

export default CompanionPanel;