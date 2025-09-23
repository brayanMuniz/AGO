// Image loading utilities with concurrent loading and smart caching

export type ImageSize = 'small' | 'medium' | 'large' | 'original';

export interface ImageLoadOptions {
  size?: ImageSize;
  priority?: 'high' | 'normal' | 'low';
  timeout?: number;
}

export interface ImageLoadResult {
  url: string;
  loaded: boolean;
  error?: string;
  loadTime?: number;
}

// Global configuration
const CONFIG = {
  maxConcurrentLoads: 20, // Browser default limit
  defaultTimeout: 10000, // 10 seconds
  retryAttempts: 2,
  retryDelay: 1000, // 1 second
  preloadDistance: 2000, // Preload images within 2000px of viewport
  priorityLoadDistance: 500, // High priority loading within 500px
};

// Active loading queue management
class ImageLoadQueue {
  private activeLoads = new Set<string>();
  private pendingQueue: Array<() => void> = [];
  private loadCache = new Map<string, Promise<ImageLoadResult>>();

  // Get the URL for an image with size parameter
  getImageUrl(filename: string, size: ImageSize = 'medium'): string {
    if (size === 'original') {
      return `/api/images/file/${filename}`;
    }
    return `/api/images/file/${filename}?size=${size}`;
  }

  // Load a single image with concurrency control
  async loadImage(filename: string, options: ImageLoadOptions = {}): Promise<ImageLoadResult> {
    const { size = 'medium', timeout = CONFIG.defaultTimeout } = options;
    const url = this.getImageUrl(filename, size);
    const cacheKey = `${filename}_${size}`;

    // Return cached promise if already loading/loaded
    if (this.loadCache.has(cacheKey)) {
      return this.loadCache.get(cacheKey)!;
    }

    // Create and cache the loading promise
    const loadPromise = this.executeLoad(url, filename, size, timeout);
    this.loadCache.set(cacheKey, loadPromise);

    return loadPromise;
  }

  // Execute the actual image loading with concurrency control
  private async executeLoad(url: string, filename: string, size: ImageSize, timeout: number): Promise<ImageLoadResult> {
    // Wait for available slot if at max concurrent loads
    if (this.activeLoads.size >= CONFIG.maxConcurrentLoads) {
      await new Promise<void>((resolve) => {
        this.pendingQueue.push(resolve);
      });
    }

    const loadKey = `${filename}_${size}`;
    this.activeLoads.add(loadKey);

    try {
      const startTime = performance.now();
      await this.loadImageWithRetry(url, timeout);
      const loadTime = performance.now() - startTime;

      return {
        url,
        loaded: true,
        loadTime,
      };
    } catch (error) {
      return {
        url,
        loaded: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.activeLoads.delete(loadKey);
      
      // Process next item in queue
      const nextResolve = this.pendingQueue.shift();
      if (nextResolve) {
        nextResolve();
      }
    }
  }

  // Load image with retry logic
  private async loadImageWithRetry(url: string, timeout: number): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= CONFIG.retryAttempts; attempt++) {
      try {
        await this.loadImagePromise(url, timeout);
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < CONFIG.retryAttempts) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
        }
      }
    }

    throw lastError;
  }

  // Core image loading promise
  private loadImagePromise(url: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let timeoutId: number | null = null;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        cleanup();
        resolve();
      };

      img.onerror = () => {
        cleanup();
        reject(new Error(`Failed to load image: ${url}`));
      };

      // Set timeout
      timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error(`Image load timeout: ${url}`));
      }, timeout);

      // Start loading
      img.src = url;
    });
  }

  // Load multiple images concurrently
  async loadImages(filenames: string[], options: ImageLoadOptions = {}): Promise<ImageLoadResult[]> {
    const loadPromises = filenames.map(filename => this.loadImage(filename, options));
    return Promise.all(loadPromises);
  }

  // Preload images (fire and forget)
  preloadImages(filenames: string[], options: ImageLoadOptions = {}): void {
    filenames.forEach(filename => {
      this.loadImage(filename, { ...options, priority: 'low' }).catch(() => {
        // Ignore preload errors
      });
    });
  }

  // Clear cache for memory management
  clearCache(): void {
    this.loadCache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; activeLoads: number; pendingQueue: number } {
    return {
      size: this.loadCache.size,
      activeLoads: this.activeLoads.size,
      pendingQueue: this.pendingQueue.length,
    };
  }

  // Intelligent preloading based on element visibility
  createIntersectionObserver(callback: (entries: IntersectionObserverEntry[]) => void): IntersectionObserver | null {
    if (!window.IntersectionObserver) {
      return null;
    }

    return new IntersectionObserver(callback, {
      root: null,
      rootMargin: `${CONFIG.preloadDistance}px`,
      threshold: [0, 0.1, 0.5, 1.0]
    });
  }

  // Batch load images with priority based on visibility
  async loadImagesWithPriority(
    imageData: Array<{ filename: string; element?: HTMLElement; priority?: 'high' | 'normal' | 'low' }>,
    size: ImageSize = 'medium'
  ): Promise<ImageLoadResult[]> {
    // Sort by priority: high -> normal -> low
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const sortedImages = imageData.sort((a, b) => {
      const aPriority = priorityOrder[a.priority || 'normal'];
      const bPriority = priorityOrder[b.priority || 'normal'];
      return aPriority - bPriority;
    });

    // Load in batches to respect concurrency limits
    const batchSize = Math.min(CONFIG.maxConcurrentLoads, sortedImages.length);
    const results: ImageLoadResult[] = [];

    for (let i = 0; i < sortedImages.length; i += batchSize) {
      const batch = sortedImages.slice(i, i + batchSize);
      const batchPromises = batch.map(({ filename }) => 
        this.loadImage(filename, { size, priority: 'normal' })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }
}

// Global image loader instance
export const imageLoader = new ImageLoadQueue();

// Utility functions for common use cases

// Load gallery thumbnails (optimized for gallery view)
export async function loadGalleryImages(filenames: string[]): Promise<ImageLoadResult[]> {
  return imageLoader.loadImages(filenames, { size: 'medium', priority: 'high' });
}

// Load full resolution image (for detail view)
export async function loadFullImage(filename: string): Promise<ImageLoadResult> {
  return imageLoader.loadImage(filename, { size: 'original', priority: 'high' });
}

// Preload next images for smooth navigation
export function preloadNextImages(filenames: string[], size: ImageSize = 'original'): void {
  imageLoader.preloadImages(filenames, { size, priority: 'low' });
}

// Get optimized image URL without loading
export function getImageUrl(filename: string, size: ImageSize = 'medium'): string {
  return imageLoader.getImageUrl(filename, size);
}

// React hook for image loading
export function useImageLoader() {
  return {
    loadImage: imageLoader.loadImage.bind(imageLoader),
    loadImages: imageLoader.loadImages.bind(imageLoader),
    preloadImages: imageLoader.preloadImages.bind(imageLoader),
    getImageUrl: imageLoader.getImageUrl.bind(imageLoader),
    clearCache: imageLoader.clearCache.bind(imageLoader),
    getCacheStats: imageLoader.getCacheStats.bind(imageLoader),
  };
}

// Adaptive image size based on device and connection
export function getAdaptiveImageSize(): ImageSize {
  // Check device pixel ratio
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Check connection speed if available
  const connection = (navigator as any).connection;
  const isSlowConnection = connection && (
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' ||
    connection.saveData === true
  );
  
  // Check viewport size
  const viewportWidth = window.innerWidth;
  
  if (isSlowConnection) {
    return 'small'; // Use smallest size for slow connections
  }
  
  if (pixelRatio >= 2 && viewportWidth > 1200) {
    return 'large'; // High DPI and large screen
  } else if (pixelRatio >= 2 || viewportWidth > 768) {
    return 'medium'; // High DPI or medium screen
  } else {
    return 'small'; // Low DPI and small screen
  }
}

// Performance monitoring
export function getLoadingStats() {
  return imageLoader.getCacheStats();
}
