import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  onSearch, 
  placeholder = "Search for songs, artists, albums...",
  disabled = false 
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-spotify-lightgray w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 bg-spotify-gray border border-spotify-lightgray/20 rounded-full text-white placeholder-spotify-lightgray focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </form>
  );
};
