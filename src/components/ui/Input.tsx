import React from 'react';
import { cn } from '../../utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-spotify-lightgray mb-2">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-4 py-3 bg-spotify-dark border border-spotify-gray rounded-md text-white placeholder-spotify-gray focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent transition-colors duration-200',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};
