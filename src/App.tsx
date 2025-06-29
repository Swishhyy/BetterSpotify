import { useState, useEffect } from 'react';
import { Sidebar, TopBar, Player, SearchView } from './components';
import { useAuthStore } from './store';
import { useSpotifyAuth, useTauriEnvironment } from './hooks';
import './styles/globals.css';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const { isAuthenticated, isLoading, error } = useAuthStore();
  const { isAuthenticating, authenticateWithSpotify } = useSpotifyAuth();
  const { isTauri, isLoading: isCheckingEnvironment } = useTauriEnvironment();

  // Debug: Log auth state
  useEffect(() => {
    const { user, accessToken } = useAuthStore.getState();
    console.log('Auth State:', { isAuthenticated, user, accessToken: accessToken ? '***' : null, error });
  }, [isAuthenticated, error]);

  // Debug: Log environment detection
  useEffect(() => {
    console.log('🔍 Environment Detection Debug:');
    console.log('- isTauri:', isTauri);
    console.log('- isCheckingEnvironment:', isCheckingEnvironment);
    console.log('- window.__TAURI__:', (window as any).__TAURI__);
    console.log('- window.__TAURI_INTERNALS__:', (window as any).__TAURI_INTERNALS__);
    console.log('- window.__TAURI_METADATA__:', (window as any).__TAURI_METADATA__);
    console.log('- navigator.userAgent:', navigator.userAgent);
    console.log('- Available window properties starting with __TAURI:', 
      Object.keys(window).filter(key => key.startsWith('__TAURI')));
  }, [isTauri, isCheckingEnvironment]);

  const getViewTitle = (view: string) => {
    switch (view) {
      case 'home': return 'Home';
      case 'search': return 'Search';
      case 'library': return 'Your Library';
      case 'liked-songs': return 'Liked Songs';
      case 'create-playlist': return 'Create Playlist';
      case 'downloaded': return 'Downloaded Music';
      default: return 'Better Spotify';
    }
  };

  const renderMainContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-4">Welcome to Better Spotify</h2>
            <p className="text-spotify-lightgray text-lg mb-8">
              A faster, more efficient, and beautiful Spotify client. 
              Login with your Spotify account to get started.
            </p>
            
            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-2 gap-6 text-sm text-spotify-lightgray">
                <div className="text-left">
                  <h3 className="text-white font-medium mb-3">✨ Features</h3>
                  <ul className="space-y-2">
                    <li>• Lightning fast performance</li>
                    <li>• Minimal RAM usage</li>
                    <li>• Beautiful modern UI</li>
                    <li>• Native desktop experience</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h3 className="text-white font-medium mb-3">🎵 Spotify Integration</h3>
                  <ul className="space-y-2">
                    <li>• Full music catalog access</li>
                    <li>• Playlist management</li>
                    <li>• Search & discovery</li>
                    <li>• Playback control*</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-spotify-gray">
                *Requires Spotify Premium for playback control
              </p>
            </div>

            {isTauri === false && (
              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
                <p className="text-blue-400 text-sm">
                  <strong>Development Mode:</strong> You're running in browser mode. 
                  For full functionality including authentication, run the Tauri desktop app with: <code className="bg-blue-900/30 px-1 rounded">npm run tauri dev</code>
                </p>
              </div>
            )}

            <button
              onClick={authenticateWithSpotify}
              disabled={isAuthenticating || isLoading || isTauri === false || isCheckingEnvironment}
              className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-full transition-colors duration-200"
            >
              {isCheckingEnvironment 
                ? 'Checking Environment...' 
                : isAuthenticating 
                  ? 'Authenticating...' 
                  : isTauri 
                    ? 'Login with Spotify' 
                    : 'Login (Desktop App Required)'
              }
            </button>
            
            {isAuthenticating && (
              <p className="text-spotify-lightgray text-sm mt-4">
                A browser window will open for authentication. You can close it after logging in.
              </p>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 p-6">
        {currentView === 'search' ? (
          <SearchView />
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              {getViewTitle(currentView)}
            </h2>
            <p className="text-spotify-lightgray">
              {currentView === 'home' && 'Welcome back! Here are your recommendations.'}
              {currentView === 'search' && 'Search for songs, artists, albums, and playlists.'}
              {currentView === 'library' && 'Manage your saved music and playlists.'}
              {currentView === 'liked-songs' && 'Your liked songs collection.'}
              {currentView === 'create-playlist' && 'Create a new playlist.'}
              {currentView === 'downloaded' && 'Your downloaded music for offline listening.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onNavigate={setCurrentView} currentView={currentView} />
        
        <div className="flex-1 flex flex-col">
          <TopBar title={getViewTitle(currentView)} />
          {renderMainContent()}
        </div>
      </div>
      
      <Player />
    </div>
  );
}

export default App;
