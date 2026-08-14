'use client';

import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductCardProps {
  name: string;
  price: string;
  stock: number;
  onAddToCart?: () => void;
  className?: string;
}

/**
 * ProductCard with add-to-cart animation
 * Product card scales 0.97 then springs back + cart badge count bumps
 * 150ms duration - confirm the tap registered for cashier
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  stock,
  onAddToCart,
  className = '',
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150); // 150ms spring back
    if (onAddToCart) onAddToCart();
  };

  return (
    <button
      onClick={handlePress}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        bg-surface-raised border border-pine-dim rounded-pos p-4
        hover:shadow-md transition-all duration-150
        flex flex-col items-center justify-center gap-2
        min-h-[88px] min-w-[88px] text-left
        ${isPressed ? 'scale-97 shadow-inner' : 'scale-100'}
        ${className}
      `}
      style={{
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="w-12 h-12 bg-pine-dim rounded-lg flex items-center justify-center mb-2">
        <Package className="h-6 w-6 text-pine" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-ink text-sm truncate">{name}</h3>
        <p className="font-display font-bold text-pine text-lg">{price}</p>
        <p className="text-xs text-slate-500">{stock} in stock</p>
      </div>
    </button>
  );
};