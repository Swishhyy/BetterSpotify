import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useAuthStore } from '../store';
import { spotifyService } from '../services';

interface AuthResult {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  error?: string;
}

interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export const useSpotifyAuth = () => {
  const { user, accessToken, setUser, setAccessToken, setLoading, setError } = useAuthStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check for stored tokens on app start
  useEffect(() => {
    const checkStoredTokens = async () => {
      try {
        console.log('🔐 Checking for stored tokens...');
        setLoading(true);
        let tokens = await invoke<StoredTokens | null>('load_tokens');
        
        if (tokens) {
          console.log('✅ Found stored tokens:', { hasAccessToken: !!tokens.access_token, expiresAt: new Date(tokens.expires_at * 1000) });
          
          // Check if tokens are expired (with 5-minute buffer)
          const now = Math.floor(Date.now() / 1000);
          if (tokens.expires_at && tokens.expires_at > now + 300) {
            console.log('✅ Stored tokens are valid, using them');
            await handleAuthSuccess(tokens.access_token);
          } else {
            console.log('⏰ Stored tokens have expired, clearing them');
            await invoke('clear_tokens');
            setLoading(false);
            return;
          }
        } else {
          console.log('❌ No stored tokens found');
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Failed to load stored tokens:', error);
        setLoading(false);
      }
    };

    checkStoredTokens();
  }, []);

  // Listen for auth results from the Tauri backend
  useEffect(() => {
    const unlisten = listen<AuthResult>('auth-result', async (event) => {
      const authResult = event.payload;
      
      if (authResult.success && authResult.access_token) {
        // Save tokens for future sessions
        if (authResult.refresh_token) {
          try {
            await invoke('save_tokens', {
              accessToken: authResult.access_token,
              refreshToken: authResult.refresh_token,
              expiresIn: 3600, // 1 hour default
            });
            console.log('Tokens saved successfully');
          } catch (error) {
            console.error('Failed to save tokens:', error);
          }
        }
        
        await handleAuthSuccess(authResult.access_token);
      } else {
        setError(authResult.error || 'Authentication failed');
        setIsAuthenticating(false);
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  // Set up the refresh token function in the Spotify service
  useEffect(() => {
    spotifyService.setRefreshTokenFunction(refreshToken);
  }, []);

  const authenticateWithSpotify = async () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    
    if (!clientId) {
      setError('Spotify Client ID not configured. Please set VITE_SPOTIFY_CLIENT_ID in your .env file');
      return;
    }

    try {
      setIsAuthenticating(true);
      setLoading(true);
      setError(null);

      // Get the authorization URL and port from the backend
      const result = await invoke<[string, number]>('start_spotify_auth', {
        clientId: clientId
      });

      const [authUrl, port] = result;

      // Start the local HTTP server to handle the callback with the assigned port
      await invoke('start_auth_server', { port: port });

      // Open the browser to the authorization URL
      window.open(authUrl, '_blank');

    } catch (error) {
      console.error('Authentication error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start authentication');
      setIsAuthenticating(false);
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (token: string) => {
    try {
      console.log('🎉 Processing auth success with token:', token.substring(0, 20) + '...');
      setAccessToken(token);
      
      console.log('👤 Fetching user data...');
      const userData = await spotifyService.getCurrentUser(token);
      console.log('✅ User data received:', userData.display_name);
      setUser(userData);
      
      setError(null);
      console.log('🎊 Authentication successful:', userData.display_name);
    } catch (error) {
      console.error('💥 Failed to fetch user data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch user data');
      
      // If token is invalid, clear stored tokens
      try {
        console.log('🧹 Clearing invalid tokens...');
        await invoke('clear_tokens');
      } catch (clearError) {
        console.error('Failed to clear tokens:', clearError);
      }
    } finally {
      setIsAuthenticating(false);
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await invoke('clear_tokens');
      setUser(null);
      setAccessToken(null);
      setError(null);
      setIsAuthenticating(false);
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Failed to clear tokens during logout:', error);
      // Still clear the frontend state even if backend fails
      setUser(null);
      setAccessToken(null);
      setError(null);
      setIsAuthenticating(false);
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    try {
      console.log('🔄 Attempting to refresh token...');
      
      // Load current tokens to get refresh token
      const tokens = await invoke<StoredTokens | null>('load_tokens');
      if (!tokens?.refresh_token) {
        console.log('❌ No refresh token available');
        return null;
      }

      // For now, if we have stored tokens that are close to expiring,
      // we'll just return the current token and let it fail naturally
      // A full refresh implementation would call Spotify's refresh endpoint
      console.log('⚠️ Token refresh not fully implemented, using existing token');
      return tokens.access_token;
      
    } catch (error) {
      console.error('💥 Token refresh failed:', error);
      return null;
    }
  };

  return {
    user,
    accessToken,
    isAuthenticated: !!user,
    isAuthenticating,
    authenticateWithSpotify,
    logout,
    refreshToken
  };
};
