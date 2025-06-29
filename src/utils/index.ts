import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Export environment utilities
export * from './environment';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.getFullYear().toString();
}

export function getImageUrl(images: Array<{ url: string; width?: number | null; height?: number | null }>, size: 'small' | 'medium' | 'large' = 'medium'): string {
  if (!images || images.length === 0) return '';
  
  // Sort by size (largest first)
  const sortedImages = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
  
  switch (size) {
    case 'small':
      return sortedImages[sortedImages.length - 1]?.url || sortedImages[0]?.url || '';
    case 'large':
      return sortedImages[0]?.url || '';
    case 'medium':
    default:
      return sortedImages[Math.floor(sortedImages.length / 2)]?.url || sortedImages[0]?.url || '';
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
