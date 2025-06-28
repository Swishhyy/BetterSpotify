import { SpotifyTrack, SpotifyPlaylist, SpotifyUser, SpotifyAlbum } from '../types';

class SpotifyService {
  private baseUrl = 'https://api.spotify.com/v1';
  private refreshTokenFn: (() => Promise<string | null>) | null = null;
  
  // Set the token refresh function from the auth hook
  setRefreshTokenFunction(refreshFn: () => Promise<string | null>) {
    this.refreshTokenFn = refreshFn;
  }
  
  private async makeRequest<T>(endpoint: string, accessToken: string, options?: RequestInit): Promise<T> {
    let currentToken = accessToken;
    
    const makeAPICall = async (token: string): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }
    };

    let response = await makeAPICall(currentToken);

    // If we get a 401 and have a refresh function, try to refresh the token
    if (response.status === 401 && this.refreshTokenFn) {
      console.log('Token expired, attempting to refresh...');
      const newToken = await this.refreshTokenFn();
      
      if (newToken) {
        console.log('Token refreshed, retrying request...');
        response = await makeAPICall(newToken);
        currentToken = newToken;
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Spotify API Error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = `Spotify API Error: ${errorJson.error.message}`;
        }
      } catch {
        // If we can't parse the error, use the default message
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getCurrentUser(accessToken: string): Promise<SpotifyUser> {
    return this.makeRequest<SpotifyUser>('/me', accessToken);
  }

  async search(query: string, type: 'track' | 'album' | 'artist' | 'playlist', accessToken: string, limit = 20): Promise<any> {
    const endpoint = `/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`;
    return this.makeRequest(endpoint, accessToken);
  }

  async getUserPlaylists(accessToken: string, limit = 50): Promise<{ items: SpotifyPlaylist[] }> {
    return this.makeRequest<{ items: SpotifyPlaylist[] }>(`/me/playlists?limit=${limit}`, accessToken);
  }

  async getPlaylist(playlistId: string, accessToken: string): Promise<SpotifyPlaylist> {
    return this.makeRequest<SpotifyPlaylist>(`/playlists/${playlistId}`, accessToken);
  }

  async getPlaylistTracks(playlistId: string, accessToken: string, limit = 50): Promise<{ items: Array<{ track: SpotifyTrack }> }> {
    return this.makeRequest(`/playlists/${playlistId}/tracks?limit=${limit}`, accessToken);
  }

  async getAlbum(albumId: string, accessToken: string): Promise<SpotifyAlbum> {
    return this.makeRequest<SpotifyAlbum>(`/albums/${albumId}`, accessToken);
  }

  async getRecommendations(accessToken: string, seedTracks?: string[], seedArtists?: string[], limit = 20): Promise<{ tracks: SpotifyTrack[] }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    
    if (seedTracks?.length) {
      params.append('seed_tracks', seedTracks.join(','));
    }
    if (seedArtists?.length) {
      params.append('seed_artists', seedArtists.join(','));
    }

    return this.makeRequest(`/recommendations?${params.toString()}`, accessToken);
  }

  async getFeaturedPlaylists(accessToken: string, limit = 20): Promise<{ playlists: { items: SpotifyPlaylist[] } }> {
    return this.makeRequest(`/browse/featured-playlists?limit=${limit}`, accessToken);
  }

  async getNewReleases(accessToken: string, limit = 20): Promise<{ albums: { items: SpotifyAlbum[] } }> {
    return this.makeRequest(`/browse/new-releases?limit=${limit}`, accessToken);
  }

  // Player control methods (requires Spotify Premium)
  async play(accessToken: string, uris?: string[], contextUri?: string): Promise<void> {
    const body: any = {};
    if (uris) body.uris = uris;
    if (contextUri) body.context_uri = contextUri;

    await this.makeRequest('/me/player/play', accessToken, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async pause(accessToken: string): Promise<void> {
    await this.makeRequest('/me/player/pause', accessToken, { method: 'PUT' });
  }

  async next(accessToken: string): Promise<void> {
    await this.makeRequest('/me/player/next', accessToken, { method: 'POST' });
  }

  async previous(accessToken: string): Promise<void> {
    await this.makeRequest('/me/player/previous', accessToken, { method: 'POST' });
  }

  async setVolume(volume: number, accessToken: string): Promise<void> {
    await this.makeRequest(`/me/player/volume?volume_percent=${volume}`, accessToken, { method: 'PUT' });
  }

  async getCurrentPlayback(accessToken: string): Promise<any> {
    return this.makeRequest('/me/player', accessToken);
  }
}

export const spotifyService = new SpotifyService();
