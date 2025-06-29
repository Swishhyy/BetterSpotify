import React, { useState, useEffect } from 'react';
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

  // Debug logging
  console.log('🎵 Player render state:', {
    isAuthenticated,
    user: user?.display_name,
    isReady,
    currentTrack: currentTrack?.name,
    isPlaying,
    hasSpotifySDK: !!window.Spotify
  });

  // Additional debug effect
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🎵 Player state check:', {
        isAuthenticated,
        hasUser: !!user,
        isReady,
        hasSpotifySDK: !!window.Spotify,
        hasCurrentTrack: !!currentTrack
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, isReady, currentTrack]);

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

  // Show controls if user is authenticated, regardless of SDK status
  const showControls = isAuthenticated;
  
  if (!showControls && !user) {
    return (
      <div className="h-16 bg-spotify-dark border-t border-spotify-gray flex items-center justify-center">
        <div className="text-center">
          <div className="text-spotify-lightgray text-sm">
            Please log in to use the music player
          </div>
        </div>
      </div>
    );
  }

  if (!showControls && !isReady) {
    return (
      <div className="h-16 bg-spotify-dark border-t border-spotify-gray flex items-center justify-center">
        <div className="text-center">
          <div className="text-spotify-lightgray text-sm flex items-center gap-2 justify-center">
            <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
            Player initializing... Please wait
          </div>
          {user && user.product !== 'premium' && (
            <div className="text-xs text-amber-400 mt-2 flex items-center gap-1 justify-center">
              <AlertCircle className="w-3 h-3" />
              Spotify Premium required for playback control
            </div>
          )}
          <div className="text-xs text-spotify-gray mt-1">
            Make sure you have Spotify Web Player permissions enabled
          </div>
          <div className="text-xs text-blue-400 mt-1">
            Debug: Auth: {isAuthenticated ? '✅' : '❌'} | SDK: {window.Spotify ? '✅' : '❌'} | User: {user?.display_name || 'None'}
          </div>
          <div className="text-xs text-green-400 mt-1">
            Using Spotify Web API for playback detection and control
          </div>
          {isAuthenticated && window.Spotify && (
            <div className="mt-2 space-x-2">
              <button 
                onClick={() => window.location.reload()} 
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                Reload Page
              </button>
              <button 
                onClick={() => {
                  console.log('🎵 Manual SDK test - available methods:', Object.keys(window.Spotify));
                  console.log('🎵 Manual SDK test - Player constructor:', window.Spotify.Player);
                  try {
                    const testPlayer = new window.Spotify.Player({
                      name: 'Test Player',
                      getOAuthToken: (cb) => cb('test'),
                    });
                    console.log('🎵 Test player created successfully:', testPlayer);
                  } catch (error) {
                    console.error('🎵 Test player creation failed:', error);
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Test SDK
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-14 bg-spotify-dark border-t border-spotify-gray flex items-center justify-between px-4 relative">
      {/* Progress Bar Overlay */}
      {currentTrack && (
        <div 
          className="absolute top-0 left-0 right-0 h-1 bg-spotify-gray cursor-pointer group"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-white group-hover:bg-green-500 transition-colors relative"
            style={{ width: `${(position / duration) * 100}%` }}
          >
            <div className="absolute right-0 top-1/2 w-3 h-3 bg-white rounded-full transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}
      
      {/* Currently Playing */}
      <div className="flex items-center gap-3 flex-1 min-w-0 max-w-xs">
        {currentTrack ? (
          <>
            <div className="w-8 h-8 flex-shrink-0 bg-spotify-gray rounded overflow-hidden">
              {currentTrack.album?.images?.[0] ? (
                <img
                  src={currentTrack.album.images[0].url}
                  alt={currentTrack.album.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-spotify-gray rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-spotify-lightgray rounded opacity-40"></div>
                </div>
              )}
            </div>
            <div className="ml-3 flex flex-col min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentTrack.name}</p>
              <p className="text-spotify-lightgray text-xs truncate hover:text-white hover:underline cursor-pointer">
                {currentTrack.artists?.map((artist: any) => artist.name).join(', ')}
              </p>
            </div>
            <button className="player-control opacity-60 hover:opacity-100 transition-opacity text-spotify-lightgray hover:text-white">
              <Heart className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="text-spotify-lightgray text-sm">No track selected</div>
        )}
      </div>

      {/* Player Controls */}
      <div className="flex items-center justify-center gap-4">
        <button className="player-control opacity-60 hover:opacity-100 text-spotify-lightgray hover:text-white">
          <Shuffle className="w-4 h-4" />
        </button>
        
        <button 
          onClick={previousTrack}
          className="player-control text-spotify-lightgray hover:text-white"
          disabled={!currentTrack}
        >
          <SkipBack className="w-4 h-4" />
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
          className="player-control text-spotify-lightgray hover:text-white"
          disabled={!currentTrack}
        >
          <SkipForward className="w-4 h-4" />
        </button>
        
        <button className="player-control opacity-60 hover:opacity-100 text-spotify-lightgray hover:text-white">
          <Repeat className="w-4 h-4" />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={toggleMute} className="player-control opacity-60 hover:opacity-100 text-spotify-lightgray hover:text-white">
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
            <div className="absolute right-0 top-1/2 w-3 h-3 bg-white rounded-full transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
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
