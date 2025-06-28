import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Repeat,
  Heart,
  AlertCircle
} from 'lucide-react';
import { useSpotifyPlayer } from '../../hooks';
import { useAuthStore } from '../../store';

export const Player: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    isReady,
    playPause,
    nextTrack,
    previousTrack,
    seek,
    setVolume
  } = useSpotifyPlayer();

  const [volume, setVolumeState] = useState(50);
  const [isMuted, setIsMuted] = useState(false);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newPosition = percent * duration;
    seek(newPosition);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolumeState(newVolume);
    setVolume(newVolume / 100);
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(volume || 50);
    } else {
      handleVolumeChange(0);
    }
  };

  if (!user) {
    return (
      <div className="h-20 bg-spotify-dark border-t border-spotify-gray flex items-center justify-center">
        <div className="text-center">
          <div className="text-spotify-lightgray text-sm">
            Please log in to use the music player
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="h-20 bg-spotify-dark border-t border-spotify-gray flex items-center justify-center">
        <div className="text-center">
          <div className="text-spotify-lightgray text-sm flex items-center gap-2 justify-center">
            <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
            Player initializing... Please wait
          </div>
          {user.product !== 'premium' && (
            <div className="text-xs text-amber-400 mt-2 flex items-center gap-1 justify-center">
              <AlertCircle className="w-3 h-3" />
              Spotify Premium required for playback control
            </div>
          )}
          <div className="text-xs text-spotify-gray mt-1">
            Make sure you have Spotify Web Player permissions enabled
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-20 bg-spotify-dark border-t border-spotify-gray flex items-center justify-between px-4">
      {/* Currently Playing */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {currentTrack ? (
          <>
            {currentTrack.album?.images?.[0] && (
              <img
                src={currentTrack.album.images[0].url}
                alt={currentTrack.album.name}
                className="w-14 h-14 rounded"
              />
            )}
            <div className="min-w-0">
              <p className="text-white font-medium truncate">{currentTrack.name}</p>
              <p className="text-spotify-lightgray text-sm truncate">
                {currentTrack.artists?.map((artist: any) => artist.name).join(', ')}
              </p>
            </div>
            <button className="player-control ml-2">
              <Heart className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="text-spotify-lightgray text-sm">No track selected</div>
        )}
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          <button className="player-control opacity-60 hover:opacity-100">
            <Shuffle className="w-4 h-4" />
          </button>
          
          <button 
            onClick={previousTrack}
            className="player-control"
            disabled={!currentTrack}
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button 
            onClick={playPause}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
            disabled={!currentTrack}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-black" fill="currentColor" />
            ) : (
              <Play className="w-4 h-4 text-black ml-0.5" fill="currentColor" />
            )}
          </button>
          
          <button 
            onClick={nextTrack}
            className="player-control"
            disabled={!currentTrack}
          >
            <SkipForward className="w-5 h-5" />
          </button>
          
          <button className="player-control opacity-60 hover:opacity-100">
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        {currentTrack && (
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-spotify-lightgray min-w-[40px]">
              {formatTime(position)}
            </span>
            <div 
              className="flex-1 h-1 bg-spotify-gray rounded-full cursor-pointer group"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-white rounded-full group-hover:bg-green-500 transition-colors relative"
                style={{ width: `${(position / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 w-3 h-3 bg-white rounded-full transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-xs text-spotify-lightgray min-w-[40px]">
              {formatTime(duration)}
            </span>
          </div>
        )}
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
        <button onClick={toggleMute} className="player-control">
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
        
        <div className="w-20 h-1 bg-spotify-gray rounded-full cursor-pointer group">
          <div 
            className="h-full bg-white rounded-full group-hover:bg-green-500 transition-colors relative"
            style={{ width: `${volume}%` }}
          >
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
