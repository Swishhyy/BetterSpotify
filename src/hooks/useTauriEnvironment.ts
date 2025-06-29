import { useState, useEffect } from 'react';

/**
 * Hook to detect if we're running in a Tauri environment by testing API availability
 */
export const useTauriEnvironment = () => {
  const [isTauri, setIsTauri] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTauriEnvironment = async () => {
      try {
        // Try to import and use Tauri API
        const { invoke } = await import('@tauri-apps/api/core');
        
        // Try a simple command that should always be available in Tauri
        await invoke('plugin:app|name');
        
        console.log('✅ Tauri environment detected - APIs are working');
        setIsTauri(true);
      } catch (error) {
        console.log('🌐 Browser environment detected - Tauri APIs not available:', error);
        setIsTauri(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTauriEnvironment();
  }, []);

  return { isTauri, isLoading };
};
