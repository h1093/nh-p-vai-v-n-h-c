import React, { useState } from 'react';

interface ApiKeyScreenProps {
    onSubmit: (key: string) => void;
    error: string | null;
}

const ApiKeyScreen = ({ onSubmit, error }: ApiKeyScreenProps) => {
    const [key, setKey] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim()) {
            onSubmit(key.trim());
        }
    };

    return (
        <div className="max-w-md mx-auto p-8 bg-gray-900 rounded-xl shadow-2xl shadow-black/20 border border-gray-700 text-center">
            <h1 className="text-3xl font-serif-display font-bold text-gray-100 mb-4">Nhập API Key</h1>
            <p className="text-gray-400 mb-6">
                Vui lòng nhập khóa API Google Gemini của bạn để bắt đầu. Khóa của bạn sẽ được lưu trữ cục bộ trên trình duyệt.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500 placeholder-gray-500"
                    placeholder="Google Gemini API Key"
                    required
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                    type="submit"
                    className="w-full bg-amber-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400"
                >
                    Lưu & Tiếp tục
                </button>
            </form>
            <p className="text-xs text-gray-500 mt-4">
                Bạn có thể lấy API key tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-500">Google AI Studio</a>.
            </p>
        </div>
    );
};

export default ApiKeyScreen;
