import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleImageControls from './SimpleImageControls';

interface ImageItem {
  id: number;
  filename: string;
  width: number;
  height: number;
  favorite?: boolean;
  likes?: number;
  rating?: number;
}

interface ImageViewerProps {
  images: ImageItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const [showUI, setShowUI] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [imageData, setImageData] = useState<{ likes: number, rating: number, favorite: boolean } | null>(null);
  const hideUITimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastInteractionTime = useRef<number>(Date.now());

  const currentImage = images[currentIndex];

  // Load current image data
  useEffect(() => {
    const loadImageData = async () => {
      if (!currentImage) return;
      try {
        const response = await fetch(`/api/images/${currentImage.id}`);
        if (response.ok) {
          const data = await response.json();
          setImageData({
            likes: data.likes || 0,
            rating: data.rating || 0,
            favorite: data.favorite || false
          });
        }
      } catch (error) {
        console.error('Failed to load image data:', error);
      }
    };
    loadImageData();
  }, [currentImage]);

  // API helper functions
  const updateImageRating = async (newRating: number) => {
    if (!currentImage || !imageData) return;
    try {
      const response = await fetch(`/api/images/${currentImage.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating })
      });
      if (response.ok) {
        setImageData(prev => prev ? { ...prev, rating: newRating } : null);
      }
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  };

  const toggleImageFavorite = async () => {
    if (!currentImage || !imageData) return;
    const newFavorite = !imageData.favorite;
    try {
      const response = await fetch(`/api/images/${currentImage.id}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: newFavorite })
      });
      if (response.ok) {
        setImageData(prev => prev ? { ...prev, favorite: newFavorite } : null);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const incrementImageLike = async () => {
    if (!currentImage || !imageData) return;
    const newLikes = imageData.likes + 1;
    try {
      const response = await fetch(`/api/images/${currentImage.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ like_count: newLikes })
      });
      if (response.ok) {
        setImageData(prev => prev ? { ...prev, likes: newLikes } : null);
      }
    } catch (error) {
      console.error('Failed to increment like:', error);
    }
  };

  // Detect if device supports touch
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Fullscreen handling
  const enterFullscreen = () => {
    if (containerRef.current && containerRef.current.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.fullscreenElement) {
        exitFullscreen();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Toggle UI visibility
  const toggleUI = useCallback(() => {
    if (showUI) {
      if (hideUITimer.current) clearTimeout(hideUITimer.current);
      setShowUI(false);
    } else {
      resetUITimer();
    }
  }, [showUI]);

  // Reset UI timer and show UI
  const resetUITimer = useCallback(() => {
    if (hideUITimer.current) clearTimeout(hideUITimer.current);
    setShowUI(true);
    lastInteractionTime.current = Date.now();

    const timeout = isTouchDevice ? 8000 : 6000;
    hideUITimer.current = window.setTimeout(() => {
      setShowUI(false);
    }, timeout);
  }, [isTouchDevice]);

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      resetUITimer();
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          onNavigate('prev');
          break;
        case 'ArrowRight':
          event.preventDefault();
          onNavigate('next');
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case ' ': // Spacebar to toggle UI
          event.preventDefault();
          toggleUI();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          event.preventDefault();
          const rating = parseInt(event.key);
          updateImageRating(rating);
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          toggleImageFavorite();
          break;
        case 'l':
        case 'L':
          event.preventDefault();
          incrementImageLike();
          break;
        default:
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNavigate, onClose, resetUITimer, toggleUI, updateImageRating, toggleImageFavorite, incrementImageLike]);

  // Handle mouse movement (desktop)
  const handleMouseMove = useCallback(() => {
    if (!isTouchDevice) {
      const now = Date.now();
      if (now - lastInteractionTime.current > 100) {
        resetUITimer();
      }
    }
  }, [resetUITimer, isTouchDevice]);

  // Handle touch events (mobile)
  const handleTouchStart = useCallback(() => {
    resetUITimer();
  }, [resetUITimer]);

  const handleTouchMove = useCallback(() => {
    resetUITimer();
  }, [resetUITimer]);

  // Handle screen tap/click for navigation and UI toggle
  const handleScreenClick = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    // Handle middle click to open in new tab
    if ('button' in e && e.button === 1) {
      e.preventDefault();
      window.open(`/image/${currentImage.id}`, '_blank');
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    let clientX: number;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    const x = clientX - rect.left;
    const width = rect.width;

    const leftThird = width / 3;
    const rightThird = (2 * width) / 3;

    if (x < leftThird) {
      resetUITimer();
      onNavigate('prev');
    } else if (x > rightThird) {
      resetUITimer();
      onNavigate('next');
    } else {
      toggleUI();
    }
  }, [onNavigate, resetUITimer, toggleUI, currentImage]);

  // Initialize UI timer
  useEffect(() => {
    resetUITimer();
    return () => {
      if (hideUITimer.current) clearTimeout(hideUITimer.current);
    };
  }, [resetUITimer]);

  // Update timer when image changes
  useEffect(() => {
    resetUITimer();
  }, [currentIndex, resetUITimer]);


  if (!currentImage) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center select-none z-50"
      onClick={handleScreenClick}
      onMouseDown={handleScreenClick}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{
        cursor: showUI ? "pointer" : "none",
        touchAction: "manipulation",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none"
      }}
    >
      {/* Main Image - Better mobile styling */}
      <img
        src={`/api/images/file/${currentImage.filename}`}
        alt={currentImage.filename}
        className="max-w-full max-h-full object-contain"
        style={{
          zIndex: 50,
          width: 'auto',
          height: 'auto',
          maxWidth: '100vw',
          maxHeight: '100vh'
        }}
        draggable={false}
      />

      {/* UI Overlay */}
      {showUI && (
        <>
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 left-4 md:top-6 md:left-8 bg-black/60 rounded p-2 md:p-2 hover:bg-black/80 transition touch-manipulation"
            style={{ zIndex: 60 }}
            aria-label="Close viewer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 md:h-6 md:w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Fullscreen Button */}
          {!isFullscreen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                enterFullscreen();
              }}
              className="absolute top-4 left-16 md:top-6 md:left-24 bg-black/60 rounded p-2 hover:bg-black/80 transition text-white touch-manipulation"
              style={{ zIndex: 60 }}
              aria-label="Enter Fullscreen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 md:h-6 md:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 3H5a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3m8-16h3a2 2 0 012 2v3m0 8v3a2 2 0 01-2 2h-3"
                />
              </svg>
            </button>
          )}
          {isFullscreen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                exitFullscreen();
              }}
              className="absolute top-4 left-16 md:top-6 md:left-24 bg-black/60 rounded p-2 hover:bg-black/80 transition text-white touch-manipulation"
              style={{ zIndex: 60 }}
              aria-label="Exit Fullscreen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 md:h-6 md:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 21h3a2 2 0 002-2v-3m0-8V5a2 2 0 00-2-2h-3M8 21H5a2 2 0 01-2-2v-3m0-8V5a2 2 0 012-2h3"
                />
              </svg>
            </button>
          )}

          {/* Image Counter */}
          <span
            className="absolute top-4 right-4 md:top-6 md:right-8 text-white bg-black/60 px-3 py-1 md:px-4 md:py-2 rounded text-sm md:text-lg"
            style={{ pointerEvents: "none", zIndex: 60 }}
          >
            {currentIndex + 1} / {images.length}
          </span>

          {/* Navigation Arrows - Responsive sizing */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('prev');
            }}
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-black/60 rounded-full hover:bg-black/80 transition text-white touch-manipulation p-3 md:p-3"
            style={{ zIndex: 60 }}
            aria-label="Previous image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 md:h-8 md:w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('next');
            }}
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-black/60 rounded-full hover:bg-black/80 transition text-white touch-manipulation p-3 md:p-3"
            style={{ zIndex: 60 }}
            aria-label="Next image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 md:h-8 md:w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Image Controls */}
          <SimpleImageControls
            image={currentImage}
            externalData={imageData || undefined}
            onUpdate={() => {
              resetUITimer();
              // Reload image data after update
              if (currentImage) {
                fetch(`/api/images/${currentImage.id}`)
                  .then(res => res.json())
                  .then(data => {
                    setImageData({
                      likes: data.likes || 0,
                      rating: data.rating || 0,
                      favorite: data.favorite || false
                    });
                  })
                  .catch(console.error);
              }
            }}
            onUITimerReset={resetUITimer}
          />

          {/* Go to Image Page Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              navigate(`/image/${currentImage.id}`);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              
              // Handle middle click to open in new tab
              if (e.button === 1) {
                window.open(`/image/${currentImage.id}`, '_blank');
                return;
              }
            }}
            className="absolute bottom-4 right-4 md:bottom-6 md:right-8 bg-black/60 rounded p-2 md:p-3 hover:bg-black/80 transition text-white touch-manipulation"
            style={{ zIndex: 60 }}
            aria-label="Go to image page (middle-click to open in new tab)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 md:h-6 md:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </button>
        </>
      )}

      {/* Touch hint for mobile when UI is hidden */}
      {!showUI && isTouchDevice && (
        <div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-sm animate-pulse"
          style={{ zIndex: 55, pointerEvents: "none" }}
        >
          Tap center to show controls
        </div>
      )}

    </div>
  );
};

export default ImageViewer;
