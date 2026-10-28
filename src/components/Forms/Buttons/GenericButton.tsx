import React from 'react';

interface GenericButtonProps {
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
  label?: string;
}

const GenericButton: React.FC<GenericButtonProps> = ({
  type = 'button',
  onClick,
  className = '',
  disabled = false,
  children,
  label,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded bg-[#2196F3] hover:bg-[#1E88E5] px-4 py-1.5 text-[14px] font-medium text-white transition duration-200 ease-in-out font-['Roboto',Helvetica,Arial,sans-serif] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default GenericButton;
