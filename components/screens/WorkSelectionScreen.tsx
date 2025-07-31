import React from 'react';
import { Work, SaveSlot } from '../../types';
import ChoiceButton from '../ChoiceButton';

interface WorkSelectionScreenProps {
    works: Work[];
    savedGames: SaveSlot[];
    onSelectWork: (work: Work) => void;
    onCreateCustom: () => void;
    onChangeApiKey: () => void;
    onShowChangelog: () => void;
    onLoadGame: (id: string) => void;
    onDeleteGame: (id: string) => void;
    onExportGame: (id: string) => void;
}

const WorkSelectionScreen = ({
    works, savedGames, onSelectWork, onCreateCustom, onChangeApiKey,
    onShowChangelog, onLoadGame, onDeleteGame, onExportGame
}: WorkSelectionScreenProps) => {

    const sortedSavedGames = [...savedGames].sort((a, b) => b.timestamp - a.timestamp);

    const formatTimestamp = (ts: number) => {
        return new Date(ts).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="text-center max-w-6xl mx-auto p-8">
            <h1 className="text-5xl md:text-6xl font-serif-display font-bold text-white mb-4">Nhập Vai Văn Học</h1>
            <p className="text-gray-300 text-lg mb-10">
                Tiếp tục một cuộc phiêu lưu hoặc bắt đầu một hành trình mới.
            </p>

            {/* Saved Games Section */}
            {sortedSavedGames.length > 0 && (
                <div className="mb-16 animate-fade-in">
                    <h2 className="text-3xl font-serif-display font-semibold text-amber-300 mb-6">Tiếp tục cuộc phiêu lưu</h2>
                    <ul className="space-y-4 max-w-3xl mx-auto">
                        {sortedSavedGames.map(slot => (
                            <li key={slot.id} className="bg-gray-800 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-700 shadow-lg">
                                <div className="text-left flex-grow">
                                    <p className="font-bold text-lg text-gray-100">{slot.characterName}</p>
                                    <p className="text-sm text-gray-400">
                                        Trong <span className="font-semibold">{slot.workTitle}</span> - 
                                        Lưu lúc: {formatTimestamp(slot.timestamp)}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2">
                                    <ChoiceButton onClick={() => onLoadGame(slot.id)} variant="primary">Tải</ChoiceButton>
                                    <ChoiceButton onClick={() => onExportGame(slot.id)} variant="secondary" title="Xuất tệp lưu dưới dạng .json">Xuất</ChoiceButton>
                                    <ChoiceButton onClick={() => onDeleteGame(slot.id)} variant="danger">Xóa</ChoiceButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Start New Game Section */}
            <div>
                <h2 className="text-3xl font-serif-display font-semibold text-amber-300 mb-6">Bắt đầu màn chơi mới</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {works.map(work => (
                        <div
                            key={work.id}
                            className="bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-gray-700 overflow-hidden flex flex-col group cursor-pointer transform hover:-translate-y-2 transition-transform duration-300"
                            onClick={() => onSelectWork(work)}
                        >
                            <div className="p-8 text-left flex-grow">
                                <h2 className="text-3xl font-serif-display font-bold text-gray-100 mb-2">{work.title}</h2>
                                <p className="text-gray-400 font-semibold mb-4">Tác giả: {work.author}</p>
                                <p className="text-gray-300">{work.description}</p>
                            </div>
                            <div className="bg-gray-700 text-amber-300 font-bold py-3 px-8 group-hover:bg-amber-800 transition-colors duration-300 text-center">
                                Khám phá
                            </div>
                        </div>
                    ))}
                    <div
                        key="custom-world"
                        className="bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-amber-700/50 overflow-hidden flex flex-col group cursor-pointer transform hover:-translate-y-2 transition-transform duration-300"
                        onClick={onCreateCustom}
                    >
                        <div className="p-8 text-center flex-grow flex flex-col items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-amber-500 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <h2 className="text-3xl font-serif-display font-bold text-amber-400 mt-4">Tạo Thế Giới Mới</h2>
                            <p className="text-amber-500 mt-2">Nhập vào tác phẩm, tóm tắt, hoặc ý tưởng của bạn.</p>
                        </div>
                        <div className="bg-amber-800 text-white font-bold py-3 px-8 group-hover:bg-amber-700 transition-colors duration-300 text-center">
                            Bắt đầu sáng tạo
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-16 text-center space-x-6">
                <button
                    onClick={onShowChangelog}
                    className="text-gray-400 hover:text-white underline text-sm font-semibold"
                >
                    Nhật ký cập nhật
                </button>
                <button
                    onClick={onChangeApiKey}
                    className="text-gray-400 hover:text-white underline text-sm font-semibold"
                >
                    Thay đổi API Key
                </button>
            </div>
        </div>
    );
}

export default WorkSelectionScreen;