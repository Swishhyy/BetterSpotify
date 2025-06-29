/**
 * Utility functions for checking the runtime environment
 */

/**
 * Check if the application is running in a Tauri desktop environment
 * @returns {boolean} True if running in Tauri, false if in browser
 */
export const isTauriApp = (): boolean => {
  // For Tauri v2, we can use the following methods
  try {
    // Method 1: Check for Tauri globals
    if ((window as any).__TAURI_INTERNALS__) {
      return true;
    }
    
    // Method 2: Check user agent for Tauri
    if (navigator.userAgent.includes('Tauri')) {
      return true;
    }
    
    // Method 3: Check for specific Tauri properties
    if ((window as any).__TAURI_INVOKE__) {
      return true;
    }
    
    // Method 4: Try to access Tauri-specific window properties
    if (typeof (window as any).__TAURI__ !== 'undefined') {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

/**
 * Alternative method to check Tauri environment by attempting to use the API
 * @returns {Promise<boolean>} True if running in Tauri, false if in browser
 */
export const isTauriAppAsync = async (): Promise<boolean> => {
  try {
    // Try to dynamically import Tauri and test if invoke works
    const { invoke } = await import('@tauri-apps/api/core');
    // Try a simple invoke that should be available
    await invoke('app_name');
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if the application is running in development mode
 * @returns {boolean} True if in development mode
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

/**
 * Check if the application is running in production mode
 * @returns {boolean} True if in production mode
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

/**
 * Get the current environment type
 * @returns {'tauri' | 'browser'} The current environment
 */
export const getEnvironmentType = (): 'tauri' | 'browser' => {
  return isTauriApp() ? 'tauri' : 'browser';
};
