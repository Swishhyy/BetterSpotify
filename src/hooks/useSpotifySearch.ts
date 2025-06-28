import { useState } from 'react';
import { useAuthStore } from '../store';
import { spotifyService } from '../services';

export const useSpotifySearch = () => {
  const { accessToken } = useAuthStore();
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string, type: 'track' | 'album' | 'artist' | 'playlist' = 'track') => {
    if (!accessToken || !query.trim()) {
      setResults(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await spotifyService.search(query, type, accessToken);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  return {
    results,
    isLoading,
    error,
    search,
    clearResults
  };
};
