import React from 'react';

interface ChoiceButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  title?: string;
}

const ChoiceButton = ({ onClick, children, className = '', disabled = false, variant = 'primary', size = 'md', title }: ChoiceButtonProps) => {
  const baseClasses = 'font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800';
  
  const variantClasses = {
    primary: 'bg-amber-700 text-white hover:bg-amber-600 focus:ring-amber-500',
    secondary: 'bg-gray-600 text-gray-100 hover:bg-gray-500 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
  };

  const sizeClasses = {
      sm: 'py-1 px-2 text-xs',
      md: 'py-2 px-4 text-sm'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      title={title}
    >
      {children}
    </button>
  );
};

export default ChoiceButton;
