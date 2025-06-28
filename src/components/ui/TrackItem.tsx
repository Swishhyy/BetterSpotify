import React, { useState } from 'react';
import { Play, MoreHorizontal, AlertCircle } from 'lucide-react';
import { SpotifyTrack } from '../../types';

interface TrackItemProps {
  track: SpotifyTrack;
  index?: number;
  onPlay?: () => Promise<void>;
  isPlaying?: boolean;
}

export const TrackItem: React.FC<TrackItemProps> = ({ 
  track, 
  index, 
  onPlay, 
  isPlaying = false 
}) => {
  const [playError, setPlayError] = useState<string | null>(null);
  
  const handlePlay = async () => {
    if (onPlay) {
      try {
        setPlayError(null);
        await onPlay();
      } catch (error) {
        console.error('Error playing track:', error);
        setPlayError(error instanceof Error ? error.message : 'Failed to play track');
        // Clear error after 5 seconds
        setTimeout(() => setPlayError(null), 5000);
      }
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="track-item group">
      {playError && (
        <div className="col-span-full mb-2 p-2 bg-red-900/20 border border-red-500/50 rounded text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          {playError}
        </div>
      )}
      
      {/* Play button / Index */}
      <div className="flex items-center justify-center">
        {index !== undefined && (
          <span className="text-spotify-lightgray text-sm group-hover:hidden">
            {index + 1}
          </span>
        )}
        <button 
          onClick={handlePlay}
          className={`player-control hidden group-hover:flex ${isPlaying ? 'text-green-500' : ''}`}
        >
          <Play className="w-4 h-4" fill={isPlaying ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Track info */}
      <div className="flex items-center gap-3 min-w-0">
        {track.album.images && track.album.images.length > 0 && (
          <img
            src={track.album.images[track.album.images.length - 1].url}
            alt={track.album.name}
            className="w-10 h-10 rounded"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className={`font-medium truncate ${isPlaying ? 'text-green-500' : 'text-white'}`}>
            {track.name}
          </p>
          <p className="text-spotify-lightgray text-sm truncate">
            {track.artists.map(artist => artist.name).join(', ')}
          </p>
        </div>
      </div>

      {/* Album name */}
      <div className="hidden md:block min-w-0">
        <p className="text-spotify-lightgray text-sm truncate">
          {track.album.name}
        </p>
      </div>

      {/* Duration and actions */}
      <div className="flex items-center gap-4">
        <button className="player-control opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <span className="text-spotify-lightgray text-sm">
          {formatDuration(track.duration_ms)}
        </span>
      </div>
    </div>
  );
};
