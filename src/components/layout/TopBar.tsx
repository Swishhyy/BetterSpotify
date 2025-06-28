import React from 'react';
import { useAuthStore } from '../../store';
import { useSpotifyAuth } from '../../hooks';
import { User, Settings, LogOut } from 'lucide-react';
import { Button } from '../ui';

interface TopBarProps {
  title: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { authenticateWithSpotify, logout } = useSpotifyAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="h-16 bg-spotify-dark border-b border-spotify-gray flex items-center justify-between px-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-white">{title}</h1>

      {/* User Section */}
      <div className="flex items-center gap-4">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            {/* User Info */}
            <div className="flex items-center gap-3">
              {user.images && user.images.length > 0 ? (
                <img
                  src={user.images[0].url}
                  alt={user.display_name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-spotify-gray rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-spotify-lightgray" />
                </div>
              )}
              <span className="text-white font-medium text-sm">
                {user.display_name || user.id}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button className="player-control">
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={handleLogout}
                className="player-control"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={authenticateWithSpotify}
            variant="primary"
            size="sm"
          >
            Login with Spotify
          </Button>
        )}
      </div>
    </div>
  );
};
