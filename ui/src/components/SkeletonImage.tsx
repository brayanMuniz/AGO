import { useState, useEffect } from 'react';

interface SkeletonImageProps {
  width: number;
  height: number;
  className?: string;
}

const SkeletonImage: React.FC<SkeletonImageProps> = ({ 
  width, 
  height, 
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Auto-hide skeleton after a reasonable time to prevent permanent placeholders
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000); // Hide after 3 seconds if real image hasn't loaded
    
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const aspectRatio = width / height;

  return (
    <div 
      className={`relative w-full bg-gray-800 animate-pulse ${className}`}
      style={{ aspectRatio: aspectRatio.toString() }}
    >
      {/* Subtle loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-gray-600 border-t-gray-500 rounded-full animate-spin opacity-40"></div>
      </div>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-30 animate-shimmer"></div>
    </div>
  );
};

export default SkeletonImage;
