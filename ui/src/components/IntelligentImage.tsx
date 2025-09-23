import React, { useEffect, useRef, useState } from 'react';
import { getImageUrl, imageLoader } from '../utils/imageLoader';

interface IntelligentImageProps {
  filename: string;
  alt: string;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'original';
  priority?: 'high' | 'normal' | 'low';
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  width?: number;
  height?: number;
  aspectRatio?: number;
}

const IntelligentImage: React.FC<IntelligentImageProps> = ({
  filename,
  alt,
  className = '',
  size = 'medium',
  priority = 'normal',
  onLoad,
  onError,
  loading = 'lazy',
  decoding = 'async',
  width,
  height,
  aspectRatio
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [, setIsInView] = useState(false);

  // Intersection Observer for intelligent loading
  useEffect(() => {
    const observer = imageLoader.createIntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === imgRef.current) {
          setIsInView(entry.isIntersecting);
          
          // Start loading when image comes into view or is close
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            imageLoader.loadImage(filename, { size, priority }).catch(() => {
              setIsError(true);
              onError?.();
            });
          }
        }
      });
    });

    if (observer && imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [filename, size, priority, onError]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // Calculate container style for stable dimensions
  const containerStyle: React.CSSProperties = {};
  
  if (aspectRatio) {
    containerStyle.aspectRatio = aspectRatio.toString();
  } else if (width && height) {
    containerStyle.aspectRatio = (width / height).toString();
  }

  return (
    <div className="relative w-full" style={containerStyle}>
      <img
        ref={imgRef}
        src={getImageUrl(filename, size)}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        decoding={decoding}
      />
      
      {/* Loading placeholder with stable dimensions */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin opacity-60"></div>
        </div>
      )}
      
      {/* Error placeholder */}
      {isError && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <svg className="w-6 h-6 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-xs opacity-75">Failed to load</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentImage;
