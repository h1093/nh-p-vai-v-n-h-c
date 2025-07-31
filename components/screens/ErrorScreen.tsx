import React from 'react';

interface ErrorScreenProps {
    error: string | null;
    onChangeApiKey: () => void;
    onRetry: () => void;
}

const ErrorScreen = ({ error, onChangeApiKey, onRetry }: ErrorScreenProps) => {
    const isApiKeyError = error && (error.includes("API key") || error.includes("API Key"));

    return (
        <div className="text-center max-w-xl mx-auto p-8 bg-red-900/20 rounded-xl shadow-lg border border-red-700">
            <h2 className="text-3xl font-serif-display font-bold text-red-200 mb-4">Ôi, có lỗi rồi!</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <button
                onClick={() => isApiKeyError ? onChangeApiKey() : onRetry()}
                className="bg-red-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 transition-colors duration-300"
            >
                {isApiKeyError ? "Nhập lại API Key" : "Thử lại từ đầu"}
            </button>
        </div>
    );
};

export default ErrorScreen;
