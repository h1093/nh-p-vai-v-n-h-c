import React, { useState, useMemo } from 'react';

interface WorldCreatorScreenProps {
    onSubmit: (data: { title: string, author: string, content: string }) => void;
    onBack: () => void;
}

const WorldCreatorScreen = ({ onSubmit, onBack }: WorldCreatorScreenProps) => {
    const [worldData, setWorldData] = useState({ title: '', author: '', content: '' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setWorldData({ ...worldData, [e.target.name]: e.target.value });
    const isFormValid = useMemo(() => worldData.content.trim().length > 50, [worldData]);
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (isFormValid) onSubmit(worldData); };

    return (
        <div className="max-w-3xl mx-auto p-8 bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-gray-700">
            <h1 className="text-4xl font-serif-display font-bold text-gray-100 mb-6 text-center">Tạo Thế Giới Mới</h1>
            <p className="text-gray-300 mb-8 text-center">Cung cấp nội dung để AI xây dựng thế giới, nhân vật và văn phong cho câu chuyện của bạn.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-bold text-gray-300 mb-2">Tên tác phẩm (Tùy chọn)</label>
                    <input type="text" id="title" name="title" value={worldData.title} onChange={handleChange} className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Số Đỏ, Lão Hạc, Harry Potter..." />
                </div>
                <div>
                    <label htmlFor="author" className="block text-sm font-bold text-gray-300 mb-2">Tác giả (Tùy chọn)</label>
                    <input type="text" id="author" name="author" value={worldData.author} onChange={handleChange} className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Vũ Trọng Phụng, Nam Cao..." />
                </div>
                <div>
                    <label htmlFor="content" className="block text-sm font-bold text-gray-300 mb-2">Nội dung, tóm tắt, hoặc trích đoạn</label>
                    <textarea id="content" name="content" value={worldData.content} onChange={handleChange} rows={10} className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Dán nội dung vào đây. Để có trải nghiệm tốt nhất, hãy mô tả chi tiết không chỉ bối cảnh mà cả **tính cách của các nhân vật chính**. Ví dụ: 'Ông Ba là một lão nông hiền lành nhưng cố chấp. Trái lại, Lý trưởng lại gian manh và xảo quyệt.' AI sẽ dùng thông tin này để làm cho họ hành động một cách sống động. (Yêu cầu tối thiểu 50 ký tự)" required />
                    {!isFormValid && worldData.content.trim() !== '' && <p className="text-sm text-red-500 mt-1">Nội dung cần dài hơn để AI có thể hiểu được bối cảnh.</p>}
                </div>
                <div className="flex items-center justify-between pt-4">
                    <button type="button" onClick={onBack} className="text-gray-300 font-bold py-3 px-8 rounded-lg hover:bg-gray-700 transition-colors">Quay lại</button>
                    <button type="submit" disabled={!isFormValid} className="bg-amber-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none">Tạo thế giới & Viết truyện</button>
                </div>
            </form>
        </div>
    );
};

export default WorldCreatorScreen;
