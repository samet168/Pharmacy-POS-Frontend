import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'default' | 'pill' | 'round';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  shape = 'default',
  className = '',
  ...rest
}) => {
  const base = 'inline-flex items-center justify-center font-medium transition-colors disabled:opacity-60';
  const variants: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-surface border border-border text-foreground hover:bg-surface/90',
    danger: 'bg-danger text-white hover:bg-danger/90',
    outline: 'border border-primary text-primary hover:bg-primary/10',
  };
  const sizes: Record<string, string> = {
    sm: 'px-2 py-1 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl',
  };
  const shapes: Record<string, string> = {
    default: '',
    pill: 'rounded-full',
    round: 'rounded-full',
  };
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${shapes[shape]} ${className}`;
  return <button className={cls} {...rest} />;
};
