import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
  }
}

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: string, cb: (data: any) => void): void;
  removeListener(event: string, cb?: (data: any) => void): void;
  getCurrentState(): Promise<SpotifyPlayerState | null>;
  setName(name: string): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(position_ms: number): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
}

interface SpotifyPlayerState {
  context: any;
  disallows: any;
  paused: boolean;
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  track_window: {
    current_track: any;
    previous_tracks: any[];
    next_tracks: any[];
  };
}

export const useSpotifyPlayer = () => {
  const { accessToken } = useAuthStore();
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const initializePlayer = useCallback(() => {
    if (!accessToken || !window.Spotify) {
      console.log('🎵 Player init skipped:', { hasAccessToken: !!accessToken, hasSpotify: !!window.Spotify });
      return;
    }

    console.log('🎵 Initializing Spotify Player...');
    const spotifyPlayer = new window.Spotify.Player({
      name: 'Better Spotify',
      getOAuthToken: (cb) => {
        console.log('🔐 Player requesting OAuth token...');
        cb(accessToken);
      },
      volume: 0.5
    });

    // Ready
    spotifyPlayer.addListener('ready', ({ device_id }) => {
      console.log('✅ Player ready with Device ID:', device_id);
      setDeviceId(device_id);
      setIsReady(true);
    });

    // Not Ready
    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('❌ Player device has gone offline:', device_id);
      setIsReady(false);
    });

    // Player state changed
    spotifyPlayer.addListener('player_state_changed', (state) => {
      if (!state) {
        console.log('🎵 Player state is null');
        return;
      }

      console.log('🎵 Player state changed:', {
        paused: state.paused,
        track: state.track_window.current_track?.name
      });
      
      setCurrentTrack(state.track_window.current_track);
      setIsPlaying(!state.paused);
      setPosition(state.position);
      setDuration(state.track_window.current_track?.duration_ms || 0);
    });

    // Connect to the player
    console.log('🔗 Connecting to Spotify Player...');
    spotifyPlayer.connect();
    setPlayer(spotifyPlayer);

    return spotifyPlayer;
  }, [accessToken]);

  useEffect(() => {
    console.log('🎵 Player effect triggered:', { hasAccessToken: !!accessToken, hasSpotify: !!window.Spotify });
    
    // Don't initialize if no access token
    if (!accessToken) {
      console.log('🎵 No access token, skipping player initialization');
      return;
    }
    
    // Wait for Spotify SDK to load
    if (window.Spotify) {
      console.log('🎵 Spotify SDK available, initializing player');
      initializePlayer();
    } else {
      console.log('🎵 Waiting for Spotify SDK to load...');
      
      // Check if the SDK script is loaded but not ready
      const checkSDK = () => {
        if (window.Spotify) {
          console.log('🎵 Spotify SDK loaded, initializing player');
          initializePlayer();
        } else {
          console.log('🎵 Still waiting for Spotify SDK...');
          setTimeout(checkSDK, 1000); // Check every second
        }
      };
      
      // Set up both callback and polling
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('🎵 Spotify SDK ready callback triggered');
        initializePlayer();
      };
      
      // Start polling as fallback
      setTimeout(checkSDK, 1000);
    }

    return () => {
      if (player) {
        console.log('🎵 Disconnecting player');
        player.disconnect();
      }
    };
  }, [accessToken]); // Only depend on accessToken

  // Add polling for current playback state from Spotify Web API
  useEffect(() => {
    if (!accessToken) return;

    const fetchCurrentPlaybackState = async () => {
      try {
        const response = await fetch('https://api.spotify.com/v1/me/player', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.status === 204) {
          // No active playback
          console.log('🎵 No active playback from Web API');
          return;
        }

        if (!response.ok) {
          console.log('🎵 Failed to fetch playback state:', response.status);
          return;
        }

        const playbackState = await response.json();
        console.log('🎵 Current playback state from Web API:', {
          isPlaying: playbackState.is_playing,
          track: playbackState.item?.name,
          device: playbackState.device?.name
        });

        // Update state with current playback info
        if (playbackState.item) {
          setCurrentTrack(playbackState.item);
          setIsPlaying(playbackState.is_playing);
          setPosition(playbackState.progress_ms || 0);
          setDuration(playbackState.item.duration_ms || 0);
        }
      } catch (error) {
        console.error('🎵 Error fetching playback state:', error);
      }
    };

    // Initial fetch
    fetchCurrentPlaybackState();

    // Poll every 3 seconds for current playback state
    const interval = setInterval(fetchCurrentPlaybackState, 3000);

    return () => clearInterval(interval);
  }, [accessToken]);

  const playTrack = async (uri: string) => {
    console.log('🎵 Play track requested:', { uri, hasDeviceId: !!deviceId, hasAccessToken: !!accessToken, isReady });
    
    if (!deviceId || !accessToken) {
      console.error('❌ No device ID or access token available');
      throw new Error('Player not ready. Please wait for the player to initialize.');
    }

    try {
      console.log('📡 Making play request to Spotify API...');
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: [uri]
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Playback API error:', response.status, errorText);
        
        if (response.status === 403) {
          console.error('🚫 Playback requires Spotify Premium');
          throw new Error('Spotify Premium is required for playback control. Please upgrade your account to use this feature.');
        } else if (response.status === 404) {
          console.error('📱 No active device found');
          throw new Error('No active Spotify device found. Please open Spotify on another device or ensure this device is ready.');
        } else {
          console.error(`💥 Playback error: ${response.status} - ${errorText}`);
          throw new Error(`Playback failed: ${response.status} ${response.statusText}`);
        }
      }
      
      console.log('✅ Playback started successfully');
    } catch (error) {
      console.error('💥 Error playing track:', error);
      throw error; // Re-throw so the calling component can handle it
    }
  };

  const playPause = async () => {
    if (!accessToken) return;
    
    try {
      // Use Web API for more reliable playback control
      const endpoint = isPlaying 
        ? 'https://api.spotify.com/v1/me/player/pause'
        : 'https://api.spotify.com/v1/me/player/play';
        
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('❌ Playback control error:', response.status);
        // Fallback to SDK if available
        if (player) {
          await player.togglePlay();
        }
      } else {
        console.log('✅ Playback toggled via Web API');
        // Immediately update state for responsive UI
        setIsPlaying(!isPlaying);
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      // Fallback to SDK
      if (player) {
        try {
          await player.togglePlay();
        } catch (sdkError) {
          console.error('SDK fallback also failed:', sdkError);
        }
      }
    }
  };

  const nextTrack = async () => {
    if (!accessToken) return;
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('❌ Next track error:', response.status);
        // Fallback to SDK
        if (player) {
          await player.nextTrack();
        }
      } else {
        console.log('✅ Next track via Web API');
      }
    } catch (error) {
      console.error('Error skipping to next track:', error);
      if (player) {
        try {
          await player.nextTrack();
        } catch (sdkError) {
          console.error('SDK fallback failed:', sdkError);
        }
      }
    }
  };

  const previousTrack = async () => {
    if (!accessToken) return;
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('❌ Previous track error:', response.status);
        // Fallback to SDK
        if (player) {
          await player.previousTrack();
        }
      } else {
        console.log('✅ Previous track via Web API');
      }
    } catch (error) {
      console.error('Error going to previous track:', error);
      if (player) {
        try {
          await player.previousTrack();
        } catch (sdkError) {
          console.error('SDK fallback failed:', sdkError);
        }
      }
    }
  };

  const seek = async (position: number) => {
    if (!player) return;
    
    try {
      await player.seek(position);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const setVolume = async (volume: number) => {
    if (!player) return;
    
    try {
      await player.setVolume(volume);
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  };

  return {
    player,
    deviceId,
    isReady,
    currentTrack,
    isPlaying,
    position,
    duration,
    playTrack,
    playPause,
    nextTrack,
    previousTrack,
    seek,
    setVolume
  };
};
