import React from 'react';
import { 
  Home, 
  Search, 
  Library, 
  Plus,
  Heart,
  Download
} from 'lucide-react';

interface SidebarProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentView }) => {
  const mainItems = [
    { icon: Home, label: 'Home', id: 'home' },
    { icon: Search, label: 'Search', id: 'search' },
    { icon: Library, label: 'Your Library', id: 'library' },
  ];

  const libraryItems = [
    { icon: Plus, label: 'Create Playlist', id: 'create-playlist' },
    { icon: Heart, label: 'Liked Songs', id: 'liked-songs' },
    { icon: Download, label: 'Downloaded', id: 'downloaded' },
  ];

  return (
    <div className="w-64 bg-spotify-black h-full flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">Better Spotify</h1>
      </div>

      {/* Main Navigation */}
      <nav className="px-3">
        <ul className="space-y-2">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`sidebar-item w-full ${
                    isActive ? 'text-white bg-white/10' : ''
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Divider */}
      <div className="mx-6 my-4 border-t border-spotify-gray"></div>

      {/* Library Section */}
      <div className="px-3 flex-1 overflow-y-auto scrollbar-thin">
        <ul className="space-y-2">
          {libraryItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`sidebar-item w-full ${
                    isActive ? 'text-white bg-white/10' : ''
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Playlists will be added here */}
        <div className="mt-4">
          <h3 className="text-spotify-lightgray text-sm font-medium mb-2 px-2">
            Recently Created
          </h3>
          {/* Playlist items will be rendered here */}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-spotify-gray">
        <div className="text-xs text-spotify-gray">
          <p>© 2025 Better Spotify</p>
          <p className="mt-1">Powered by Spotify Web API</p>
        </div>
      </div>
    </div>
  );
};
