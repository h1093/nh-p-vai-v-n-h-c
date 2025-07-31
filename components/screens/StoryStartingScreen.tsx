import React from 'react';
import { AITypeKey } from '../../types';
import AIStatusIndicator from '../AIStatusIndicator';

interface StoryStartingScreenProps {
    activeAI: AITypeKey | null;
}

const StoryStartingScreen = ({ activeAI }: StoryStartingScreenProps) => (
    <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto p-8 bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-gray-700 animate-fade-in">
        <h1 className="text-4xl font-serif-display font-bold text-gray-100 mb-6">Đang kiến tạo thế giới...</h1>
        <p className="text-gray-300 mb-8">Xin chờ một chút trong khi các AI dựng nên câu chuyện cho bạn.</p>
        <div className="w-full bg-gray-900/50 p-4 rounded-lg">
            <AIStatusIndicator activeAI={activeAI} />
        </div>
    </div>
);

export default StoryStartingScreen;
