import React, { useState, useEffect } from 'react';

interface ImageItem {
  id: number;
  filename: string;
  width: number;
  height: number;
}

interface SimpleImageControlsProps {
  image: ImageItem;
  onUpdate?: () => void;
  onUITimerReset?: () => void;
}

const SimpleImageControls: React.FC<SimpleImageControlsProps> = ({
  image,
  onUpdate,
  onUITimerReset,
}) => {
  const [likeCount, setLikeCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Load image data when image changes
  useEffect(() => {
    const loadImageData = async () => {
      try {
        const response = await fetch(`/api/images/${image.id}`);
        if (response.ok) {
          const imageData = await response.json();
          setLikeCount(imageData.likes || 0);
          setRating(imageData.rating || 0);
          setIsFavorited(imageData.favorite || false);
        } else {
          // Fallback to defaults if API fails
          setLikeCount(0);
          setRating(0);
          setIsFavorited(false);
        }
      } catch (error) {
        console.error('Failed to load image data:', error);
        // Fallback to defaults on error
        setLikeCount(0);
        setRating(0);
        setIsFavorited(false);
      }
    };
    
    loadImageData();
  }, [image.id]);

  const handleLikeIncrement = async () => {
    const previousCount = likeCount;
    const newLikeCount = likeCount + 1;
    setLikeCount(newLikeCount);

    try {
      const response = await fetch(`/api/images/${image.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ like_count: newLikeCount })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update like');
      }
      
      onUpdate?.();
    } catch (error) {
      console.error('Failed to increment like:', error);
      setLikeCount(previousCount);
    }
  };

  const updateRating = async (newRating: number) => {
    const previousRating = rating;
    setRating(newRating);

    try {
      const response = await fetch(`/api/images/${image.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update rating');
      }
      
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update rating:', error);
      setRating(previousRating);
    }
  };

  const toggleFavorite = async () => {
    const previousFavorited = isFavorited;
    setIsFavorited(!isFavorited);

    try {
      const response = await fetch(`/api/images/${image.id}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: !isFavorited })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update favorite');
      }
      
      onUpdate?.();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      setIsFavorited(previousFavorited);
    }
  };

  const handleInteraction = (callback: () => void) => (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    callback();
    onUpdate?.();
  };

  const handleStarClick = (starValue: number) => {
    const newRating = starValue === rating ? 0 : starValue;
    updateRating(newRating);
  };

  const resetUITimerOnly = () => {
    onUITimerReset?.();
  };

  return (
    <div
      className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/80 rounded-lg touch-manipulation ${
        isTouchDevice ? 'px-4 py-4 gap-6' : 'px-6 py-3'
      }`}
      style={{ zIndex: 65 }}
      onMouseEnter={resetUITimerOnly}
      onTouchStart={resetUITimerOnly}
    >
      {/* Like Button */}
      <button
        onClick={handleInteraction(handleLikeIncrement)}
        className={`flex items-center gap-2 rounded-lg transition touch-manipulation ${
          isTouchDevice ? 'px-4 py-3' : 'px-4 py-2'
        } bg-gray-800/80 hover:bg-gray-700/80 text-gray-300`}
      >
        <span className={isTouchDevice ? 'text-3xl' : 'text-2xl'}>♡</span>
        <span className={`${isTouchDevice ? 'text-lg' : 'text-sm'}`}>
          Like ({likeCount})
        </span>
      </button>

      {/* Rating Stars */}
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">Rating:</span>
        <div className={`flex ${isTouchDevice ? 'gap-2' : 'gap-1'}`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={handleInteraction(() => handleStarClick(star))}
              className={`hover:scale-110 transition-transform touch-manipulation ${
                isTouchDevice ? 'text-3xl p-1' : 'text-2xl'
              }`}
            >
              <span className={star <= rating ? 'text-yellow-400' : 'text-gray-600'}>
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Favorite Button */}
      <button
        onClick={handleInteraction(toggleFavorite)}
        className={`rounded-full transition touch-manipulation ${
          isTouchDevice ? 'p-3' : 'p-2'
        } ${
          isFavorited
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-gray-700/80 text-gray-300 hover:bg-red-600 hover:text-white'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={isTouchDevice ? 'h-7 w-7' : 'h-6 w-6'}
          fill={isFavorited ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    </div>
  );
};

export default SimpleImageControls;
