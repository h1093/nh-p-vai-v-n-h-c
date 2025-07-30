import React from 'react';
import { Item, Equipment, EquipmentSlot } from '../types';
import ChoiceButton from './ChoiceButton';

interface InventoryPanelProps {
    inventory: Item[];
    equipment: Equipment;
    onEquip: (item: Item) => void;
    onUnequip: (slot: EquipmentSlot) => void;
}

const InventoryPanel = ({ inventory, equipment, onEquip, onUnequip }: InventoryPanelProps) => {
    
    const equippedItems = Object.entries(equipment).filter(([, item]) => item !== null);
    const equippableInventory = inventory.filter(item => item.type === 'equipment');
    const otherInventory = inventory.filter(item => item.type !== 'equipment');

    const renderItem = (item: Item, context: 'inventory' | 'equipped') => (
        <li key={item.id} className="bg-gray-700 p-3 rounded-lg border border-gray-600 shadow-sm flex justify-between items-center gap-4">
            <div>
                <strong className="text-gray-200 font-bold block">{item.name}</strong>
                <p className="text-gray-300 text-sm">{item.description}</p>
            </div>
            <div className="flex-shrink-0">
                {context === 'inventory' && item.type === 'equipment' && (
                     <ChoiceButton onClick={() => onEquip(item)} size="sm" variant="secondary">Trang bị</ChoiceButton>
                )}
                 {context === 'equipped' && (
                     <ChoiceButton onClick={() => onUnequip(item.id.split('-')[0] as EquipmentSlot)} size="sm" variant="secondary">Tháo ra</ChoiceButton>
                )}
                 {/* Placeholder for 'use' action */
                 context === 'inventory' && item.type === 'consumable' && (
                     <ChoiceButton onClick={() => alert(`Sử dụng ${item.name}`)} size="sm" variant="primary" disabled>Sử dụng</ChoiceButton>
                 )}
            </div>
        </li>
    );

    return (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-72 overflow-y-auto">
            <div>
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 text-center">Đã trang bị</h4>
                {equippedItems.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 italic mt-4">Chưa trang bị vật phẩm nào.</p>
                ) : (
                    <ul className="space-y-2">
                       {Object.entries(equipment).map(([slot, item]) => (
                           <div key={slot}>
                            <p className="text-xs font-semibold text-gray-400 capitalize ml-1">{slot === 'weapon' ? 'Vũ khí' : 'Áo giáp'}</p>
                            {item ? (
                                renderItem({ ...item, id: `${slot}-${item.id}` }, 'equipped')
                            ) : (
                                <div className="bg-gray-700/50 p-3 rounded-lg border border-dashed border-gray-600 text-center text-sm text-gray-400">Trống</div>
                            )}
                           </div>
                       ))}
                    </ul>
                )}
            </div>
            <div>
                 <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 text-center">Túi đồ</h4>
                 {inventory.length === 0 ? (
                     <p className="text-center text-sm text-gray-400 italic mt-4">Túi đồ trống.</p>
                 ) : (
                    <ul className="space-y-2">
                        {equippableInventory.map(item => renderItem(item, 'inventory'))}
                        {otherInventory.length > 0 && equippableInventory.length > 0 && <hr className="my-3 border-gray-700"/>}
                        {otherInventory.map(item => renderItem(item, 'inventory'))}
                    </ul>
                 )}
            </div>
        </div>
    );
};

export default InventoryPanel;