'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Dropdown component for consistent dropdown UI
 * Provides accessible dropdown functionality
 */
export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignStyles = {
    left: 'left-0',
    right: 'right-0',
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className={`absolute top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50 ${alignStyles[align]}`}>
          <div className="p-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  onClick,
  danger = false,
  disabled = false,
}) => {
  return (
    <button
      onClick={() => {
        onClick?.();
      }}
      disabled={disabled}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
        disabled
          ? 'text-slate-400 cursor-not-allowed'
          : danger
          ? 'text-danger-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
};

interface DropdownDividerProps {
  className?: string;
}

export const DropdownDivider: React.FC<DropdownDividerProps> = ({ className = '' }) => {
  return <div className={`my-1 border-t border-border ${className}`} />;
};