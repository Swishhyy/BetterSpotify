// Spotify API Types
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  explicit: boolean;
  external_urls: {
    spotify: string;
  };
  preview_url: string | null;
  popularity: number;
  uri: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
  external_urls: {
    spotify: string;
  };
  images?: SpotifyImage[];
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  images: SpotifyImage[];
  release_date: string;
  total_tracks: number;
  uri: string;
}

export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  owner: {
    id: string;
    display_name: string;
  };
  tracks: {
    total: number;
  };
  uri: string;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: SpotifyImage[];
  country: string;
  product: string;
}

// Application State Types
export interface PlayerState {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: 'off' | 'context' | 'track';
  queue: SpotifyTrack[];
}

export interface AppState {
  user: SpotifyUser | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

// UI Component Types
export interface PlaylistItemProps {
  playlist: SpotifyPlaylist;
  onClick: () => void;
}

export interface TrackItemProps {
  track: SpotifyTrack;
  index: number;
  onPlay: () => void;
  isPlaying: boolean;
}
