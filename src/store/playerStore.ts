import { create } from 'zustand';
import { SpotifyTrack } from '../types';

interface PlayerState {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: 'off' | 'context' | 'track';
  queue: SpotifyTrack[];
}

interface PlayerActions {
  setCurrentTrack: (track: SpotifyTrack | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: SpotifyTrack) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  // State
  currentTrack: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  volume: 80,
  shuffle: false,
  repeat: 'off',
  queue: [],

  // Actions
  setCurrentTrack: (currentTrack) => set(() => ({ currentTrack })),
  setIsPlaying: (isPlaying) => set(() => ({ isPlaying })),
  setPosition: (position) => set(() => ({ position })),
  setDuration: (duration) => set(() => ({ duration })),
  setVolume: (volume) => set(() => ({ volume: Math.max(0, Math.min(100, volume)) })),
  
  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
  
  toggleRepeat: () => set((state) => ({
    repeat: state.repeat === 'off' 
      ? 'context' 
      : state.repeat === 'context' 
        ? 'track' 
        : 'off'
  })),
  
  addToQueue: (track) => set((state) => ({
    queue: [...state.queue, track]
  })),
  
  removeFromQueue: (index) => set((state) => ({
    queue: state.queue.filter((_, i) => i !== index)
  })),
  
  clearQueue: () => set(() => ({ queue: [] }))
}));
