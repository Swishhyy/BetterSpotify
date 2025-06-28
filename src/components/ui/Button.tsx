import React from 'react';
import { cn } from '../../utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:ring-offset-2 focus:ring-offset-spotify-black disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-spotify-green text-spotify-black hover:scale-105',
    secondary: 'bg-transparent border border-spotify-lightgray text-white hover:border-white hover:scale-105',
    ghost: 'bg-transparent text-spotify-lightgray hover:text-white hover:bg-white/10'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
