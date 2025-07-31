import React, { useState, useEffect, useMemo } from 'react';
import { Work, CharacterData, Character } from '../../types';

interface CharacterCreationScreenProps {
    work: Work;
    onSubmit: (character: CharacterData, shouldSave: boolean) => void;
    onBack: () => void;
    savedCharacters: Character[];
    onDeleteCharacter: (id: string) => void;
}

const CharacterCreationScreen = ({ work, onSubmit, onBack, savedCharacters, onDeleteCharacter }: CharacterCreationScreenProps) => {
    const [character, setCharacter] = useState<CharacterData>({ name: '', gender: 'Nam', appearance: '', personality: '', background: '' });
    const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
    const [customTraits, setCustomTraits] = useState('');
    const [shouldSaveCharacter, setShouldSaveCharacter] = useState(true);
    const [selectedSavedCharId, setSelectedSavedCharId] = useState('');

    const personalityTraits = [
        'Hiền lành', 'Ít nói', 'Quật cường', 'Dũng cảm', 'Gian xảo',
        'Kiêu ngạo', 'Hào hiệp', 'Nhút nhát', 'Nóng nảy', 'Tò mò',
        'Lãng mạn', 'Thực tế'
    ];

    useEffect(() => {
        const customTraitArray = customTraits.split(',').map(t => t.trim()).filter(Boolean);
        const allTraits = [...selectedTraits, ...customTraitArray];
        const uniqueTraits = [...new Set(allTraits)];
        setCharacter(c => ({ ...c, personality: uniqueTraits.join(', ') }));
    }, [selectedTraits, customTraits]);

    const handleLoadCharacter = (charId: string) => {
        setSelectedSavedCharId(charId);
        const savedChar = savedCharacters.find(c => c.id === charId);
        if (savedChar) {
            setCharacter({ ...savedChar, gender: savedChar.gender || 'Nam' });
            // Sync traits UI with loaded character
            const allTraits = savedChar.personality.split(',').map(t => t.trim()).filter(Boolean);
            const knownTraits = allTraits.filter(t => personalityTraits.includes(t));
            const newCustomTraits = allTraits.filter(t => !personalityTraits.includes(t));
            setSelectedTraits(knownTraits);
            setCustomTraits(newCustomTraits.join(', '));
        } else {
            // Reset if "new character" is selected
            setCharacter({ name: '', gender: 'Nam', appearance: '', personality: '', background: '' });
            setSelectedTraits([]);
            setCustomTraits('');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCharacter({ ...character, [e.target.name]: e.target.value });
        setSelectedSavedCharId(''); // Deselect saved character when user starts typing
    }

    const handleToggleTrait = (trait: string) => {
        setSelectedTraits(prev =>
            prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait]
        );
        setSelectedSavedCharId('');
    };
    
    const handleCustomTraitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomTraits(e.target.value);
        setSelectedSavedCharId('');
    };

    const isFormValid = useMemo(() => (
        character.name.trim() !== '' &&
        character.gender.trim() !== '' &&
        character.appearance.trim() !== '' &&
        character.personality.trim() !== '' &&
        character.background.trim() !== ''
    ), [character]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        onSubmit(character, shouldSaveCharacter);
    };
    
    return (
        <div className="max-w-2xl mx-auto p-8 bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-gray-700">
            <h1 className="text-4xl font-serif-display font-bold text-gray-100 mb-2 text-center">Tạo Nhân Vật Mới</h1>
            <p className="text-gray-300 mb-8 text-center">Hãy thổi hồn cho nhân vật của bạn để bắt đầu một câu chuyện mới trong thế giới của <span className="font-bold">{work.title}</span>.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                 {savedCharacters.length > 0 && (
                     <div className="space-y-2">
                         <label htmlFor="saved-character" className="block text-sm font-bold text-gray-300">Hoặc chọn nhân vật đã có</label>
                         <div className="flex items-center gap-2">
                             <select
                                 id="saved-character"
                                 value={selectedSavedCharId}
                                 onChange={(e) => handleLoadCharacter(e.target.value)}
                                 className="flex-grow px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                             >
                                 <option value="">-- Tạo nhân vật mới --</option>
                                 {savedCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                             </select>
                             {selectedSavedCharId && (
                                 <button
                                     type="button"
                                     onClick={() => onDeleteCharacter(selectedSavedCharId)}
                                     className="p-2 text-red-500 hover:bg-red-900/50 rounded-lg"
                                     title="Xóa nhân vật này"
                                 >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                         <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                     </svg>
                                 </button>
                             )}
                         </div>
                     </div>
                 )}
                
                <div className="border-t border-gray-700 pt-6 space-y-6">
                     <div>
                        <label htmlFor="name" className="block text-sm font-bold text-gray-300 mb-2">Tên nhân vật</label>
                        <input type="text" id="name" name="name" value={character.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Anh Ba Gánh Nước" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Giới tính</label>
                        <div className="flex space-x-4">
                            {['Nam', 'Nữ', 'Khác'].map(g => (
                                <label key={g} className="flex items-center space-x-2 cursor-pointer text-gray-300">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value={g}
                                        checked={character.gender === g}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-500 bg-gray-700"
                                    />
                                    <span>{g}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="appearance" className="block text-sm font-bold text-gray-300 mb-2">Ngoại hình</label>
                        <textarea id="appearance" name="appearance" value={character.appearance} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Thân hình gầy gò, nước da ngăm đen..." required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Tính cách</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {personalityTraits.map(trait => (
                                <button
                                    key={trait}
                                    type="button"
                                    onClick={() => handleToggleTrait(trait)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors border ${selectedTraits.includes(trait)
                                            ? 'bg-amber-600 border-amber-500 text-white'
                                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                                        }`}
                                >
                                    {trait}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            name="customPersonality"
                            value={customTraits}
                            onChange={handleCustomTraitsChange}
                            className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                            placeholder="Hoặc nhập các tính cách khác, cách nhau bằng dấu phẩy..."
                        />
                    </div>
                    <div>
                        <label htmlFor="background" className="block text-sm font-bold text-gray-300 mb-2">Hoàn cảnh</label>
                        <textarea id="background" name="background" value={character.background} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="Ví dụ: Một thầy lang trẻ từ nơi khác đến..." required />
                    </div>
                </div>
                
                <div className="flex items-center space-x-3 pt-4">
                    <input
                        id="save-character-checkbox"
                        type="checkbox"
                        checked={shouldSaveCharacter}
                        onChange={(e) => setShouldSaveCharacter(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="save-character-checkbox" className="text-sm text-gray-300">Lưu nhân vật này để sử dụng lại</label>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                    <button type="button" onClick={onBack} className="text-gray-300 font-bold py-3 px-8 rounded-lg hover:bg-gray-700 transition-colors">Quay lại</button>
                    <button type="submit" disabled={!isFormValid} className="bg-amber-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-amber-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none">Bắt đầu câu chuyện</button>
                </div>
            </form>
        </div>
    );
};

export default CharacterCreationScreen;