import { create } from 'zustand';
import { SpotifyUser } from '../types';

interface AuthState {
  user: SpotifyUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: SpotifyUser | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // State
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => set(() => ({ 
    user, 
    isAuthenticated: !!user,
    error: null 
  })),
  
  setAccessToken: (accessToken) => set(() => ({ 
    accessToken,
    error: null 
  })),
  
  setLoading: (isLoading) => set(() => ({ isLoading })),
  
  setError: (error) => set(() => ({ error, isLoading: false })),
  
  logout: () => set(() => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    error: null,
    isLoading: false
  }))
}));
