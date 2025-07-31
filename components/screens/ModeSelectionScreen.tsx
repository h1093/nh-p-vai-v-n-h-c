import React from 'react';
import { Work } from '../../types';

interface ModeSelectionScreenProps {
    work: Work;
    onStartAsOriginal: () => void;
    onStartFanfic: () => void;
    onBack: () => void;
    isNsfwEnabled: boolean;
    onNsfwToggle: (enabled: boolean) => void;
}

const ModeSelectionScreen = ({ work, onStartAsOriginal, onStartFanfic, onBack, isNsfwEnabled, onNsfwToggle }: ModeSelectionScreenProps) => (
    <div className="relative text-center max-w-4xl mx-auto p-8 bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-gray-700">
        <button onClick={onBack} className="absolute top-4 left-4 text-gray-400 hover:text-white font-bold py-2 px-4 transition-colors">
            &larr; Chọn lại tác phẩm
        </button>
        <h1 className="text-5xl md:text-6xl font-serif-display font-bold text-gray-100 mb-2">{work.title}</h1>
        <p className="text-gray-300 text-lg mb-8">
            Mỗi lựa chọn của bạn sẽ viết nên một trang truyện khác biệt trong thế giới của {work.author}.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-600 rounded-lg p-6 flex flex-col items-center bg-gray-700/60">
                <h2 className="text-2xl font-serif-display font-bold text-gray-100 mb-2">{work.originalCharacterName}</h2>
                <p className="text-gray-300 mb-4 flex-grow">{work.originalCharacterDescription}</p>
                <button
                    onClick={onStartAsOriginal}
                    className="bg-gray-600 text-amber-50 font-bold py-3 px-10 rounded-lg shadow-lg hover:bg-gray-500 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-400 w-full"
                >
                    Vào vai {work.originalCharacterName}
                </button>
            </div>
            <div className="border border-gray-600 rounded-lg p-6 flex flex-col items-center bg-gray-700/60">
                <h2 className="text-2xl font-serif-display font-bold text-gray-100 mb-2">Đồng nhân</h2>
                <p className="text-gray-300 mb-4 flex-grow">{work.fanficDescription}</p>
                <button
                    onClick={onStartFanfic}
                    className="bg-amber-800 text-white font-bold py-3 px-10 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 w-full"
                >
                    Tạo nhân vật mới
                </button>
            </div>
        </div>
        <div className="mt-8 flex items-center justify-center space-x-3 bg-red-900/20 p-4 rounded-lg border border-red-800">
            <input
                type="checkbox"
                id="nsfw-toggle"
                checked={isNsfwEnabled}
                onChange={(e) => onNsfwToggle(e.target.checked)}
                className="h-5 w-5 rounded border-red-400 bg-gray-700 text-red-600 focus:ring-red-500 cursor-pointer"
            />
            <label htmlFor="nsfw-toggle" className="font-semibold text-red-300 cursor-pointer select-none">
                Bật nội dung 18+ (Có thể chứa các tình tiết nhạy cảm)
            </label>
        </div>
    </div>
);

export default ModeSelectionScreen;
