import React, { useState } from 'react';
import { SearchInput, TrackItem } from '../ui';
import { useAuthStore } from '../../store';
import { spotifyService } from '../../services';
import { useSpotifyPlayer } from '../../hooks';
import { SpotifyTrack } from '../../types';

export const SearchView: React.FC = () => {
  const { accessToken } = useAuthStore();
  const { playTrack, currentTrack, isPlaying } = useSpotifyPlayer();
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlayTrack = async (track: SpotifyTrack) => {
    if (!track.uri) return;
    await playTrack(track.uri);
  };

  const handleSearch = async (query: string) => {
    console.log('🔍 Search initiated:', { query, hasAccessToken: !!accessToken });
    
    if (!accessToken) {
      console.error('❌ No access token available');
      setError('Not authenticated. Please wait for login to complete.');
      return;
    }

    // Prevent multiple simultaneous searches
    if (loading) {
      console.log('⚠️ Search already in progress, ignoring new request');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTracks([]); // Clear previous results immediately
      
      console.log('📡 Making search API call...');
      
      // Add a timeout wrapper
      const searchPromise = spotifyService.search(query, 'track', accessToken, 20);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timed out')), 15000)
      );
      
      const results = await Promise.race([searchPromise, timeoutPromise]);
      console.log('✅ Search results received:', results);
      
      setTracks(results.tracks?.items || []);
      
      if (!results.tracks?.items?.length) {
        console.log('⚠️ No tracks found in results');
        setError('No tracks found for this search');
      } else {
        console.log(`✅ Found ${results.tracks.items.length} tracks`);
      }
    } catch (err) {
      console.error('❌ Search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Session expired. Please refresh the page to log in again.');
      } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        setError('Search timed out. Please try again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(errorMessage);
      }
      
      setTracks([]); // Clear tracks on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Search</h2>
        <p className="text-spotify-lightgray mb-6">
          Search for songs, artists, albums, and playlists.
        </p>
        
        <SearchInput 
          onSearch={handleSearch}
          disabled={!accessToken || loading}
        />
      </div>

      {loading && (
        <div className="text-center text-spotify-lightgray">
          <p>Searching...</p>
        </div>
      )}

      {error && (
        <div className="text-center">
          <div className="inline-block p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {tracks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white mb-4">
            Songs ({tracks.length})
          </h3>
          <div className="space-y-1">
            {tracks.map((track, index) => (
              <TrackItem
                key={track.id}
                track={track}
                index={index}
                onPlay={() => handlePlayTrack(track)}
                isPlaying={currentTrack?.id === track.id && isPlaying}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && !error && tracks.length === 0 && (
        <div className="text-center text-spotify-lightgray">
          <p>Enter a search term to find music</p>
        </div>
      )}
    </div>
  );
};
