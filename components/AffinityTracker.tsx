import React from 'react';
import { AffinityData } from '../types';

const getBarColor = (score: number) => {
  if (score < -50) return 'bg-red-600';
  if (score < 0) return 'bg-red-500';
  if (score > 50) return 'bg-green-500';
  if (score > 0) return 'bg-green-600';
  return 'bg-gray-500';
};

const AffinityTracker = ({ affinityData }: { affinityData: AffinityData }) => {
  const affinityEntries = Object.entries(affinityData);

  if (affinityEntries.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-400 italic">
        Chưa có thông tin tình cảm nào. Hãy tương tác với các nhân vật trong truyện!
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider text-center">Tình cảm nhân vật</h4>
      <ul className="space-y-3">
        {affinityEntries.map(([name, score]) => {
          const percentage = ((score + 100) / 200) * 100;
          return (
            <li key={name}>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-semibold text-gray-200">{name}</span>
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
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AffinityTracker;