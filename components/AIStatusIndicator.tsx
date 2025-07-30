import React from 'react';
import { AIType, AITypeKey } from '../types';

const aiConfig = {
    [AIType.Storyteller]: {
        Icon: (props: any) => (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
        ),
        label: 'Người Kể Chuyện',
        color: 'text-amber-500'
    },
    [AIType.Character]: {
        Icon: (props: any) => (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75s.168-.75.375-.75.375.336.375.75Zm4.5 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Z" />
            </svg>
        ),
        label: 'Tương Tác Nhân Vật',
        color: 'text-sky-500'
    },
    [AIType.World]: {
        Icon: (props: any) => (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.73-.626 1.18-.796l.07-.029a1.875 1.875 0 0 1 2.28.021L22.5 12.879M11.42 15.17 4.217 8.083a2.652 2.652 0 0 0-3.75 0L.22 8.322a1.875 1.875 0 0 0 0 2.653l6.578 6.578a2.652 2.652 0 0 0 3.75 0Z" />
            </svg>
        ),
        label: 'Quản Lý Thế Giới',
        color: 'text-emerald-500'
    }
};

const AIStatusIndicator = ({ activeAI }: { activeAI: AITypeKey | null }) => {
    return (
        <div className="flex flex-col items-start space-y-2 p-2">
            <p className="text-xs font-bold text-gray-400 uppercase">Hội Đồng AI đang làm việc...</p>
            <div className="flex items-center space-x-4">
            {(Object.keys(AIType) as AITypeKey[]).map((key) => {
                const { Icon, label, color } = aiConfig[key];
                const isActive = activeAI === key;
                return (
                    <div
                        key={key}
                        className={`flex items-center space-x-2 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}
                        title={label}
                    >
                        <Icon className={`h-6 w-6 ${isActive ? `${color} animate-spin-slow` : 'text-gray-500'}`} />
                        <span className={`text-sm font-semibold ${isActive ? `${color}` : 'text-gray-400'}`}>
                           {isActive ? `${label}...` : label}
                        </span>
                    </div>
                );
            })}
            </div>
            <style>
            {`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 2s linear infinite;
                }
            `}
            </style>
        </div>
    );
};

export default AIStatusIndicator;