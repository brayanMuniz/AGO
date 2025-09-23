import React, { useState, useEffect } from "react";
import Masonry from "react-masonry-css";
import ImageViewer from "./ImageViewer";
import IntelligentImage from "./IntelligentImage";
import SkeletonImage from "./SkeletonImage";
import { loadGalleryImages, preloadNextImages, getAdaptiveImageSize } from "../utils/imageLoader";
import { useSidebar } from "../contexts/SidebarContext";

interface ImageItem {
  id: number;
  filename: string;
  width: number;
  height: number;
}

interface GalleryViewProps {
  images: ImageItem[];
  isSelecting?: boolean;
  selectedImages?: Set<number>;
  onImageSelect?: (imageId: number) => void;
  onImageClick?: (imageId: number) => void;
  imageSize?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  expectedCount?: number;
}

const getBreakpointColumns = (size: 'small' | 'medium' | 'large', isCollapsed: boolean) => {
  const multipliers = { small: 1.5, medium: 1, large: 0.7 };
  const multiplier = multipliers[size];
  
  // Add extra columns when sidebar is collapsed (more space available)
  const extraColumns = isCollapsed ? 1 : 0;

  return {
    default: Math.round(6 * multiplier) + extraColumns,
    1600: Math.round(5 * multiplier) + extraColumns,
    1280: Math.round(4 * multiplier) + extraColumns,
    1024: Math.round(3 * multiplier) + extraColumns,
    768: Math.round(2 * multiplier) + Math.min(extraColumns, 1), // Cap extra columns on smaller screens
    640: 1,
  };
};

const ImageMasonry: React.FC<GalleryViewProps> = ({
  images,
  onImageClick,
  isSelecting = false,
  selectedImages = new Set(),
  onImageSelect,
  imageSize = 'medium',
  isLoading = false,
  expectedCount = 20
}) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const { isCollapsed } = useSidebar();
  
  // Get adaptive image size based on device capabilities
  const adaptiveSize = getAdaptiveImageSize();
  const effectiveSize = imageSize === 'medium' ? adaptiveSize : imageSize;

  // Show skeleton placeholders when loading new content
  // Show skeletons when loading AND no images (this ensures skeletons show during fresh loads)
  const showSkeletons = isLoading && images.length === 0;

  // Preload gallery images when component mounts or images change
  useEffect(() => {
    if (images.length > 0) {
      // Preload thumbnails for gallery view
      const filenames = images.map(img => img.filename);
      loadGalleryImages(filenames);
      
      // Preload next batch for smoother scrolling
      preloadNextImages(filenames, effectiveSize);
    }
  }, [images, effectiveSize]);

  const handleImageClick = (imageId: number, index: number) => {
    if (onImageClick) {
      onImageClick(imageId);
    } else {
      setSelectedImageIndex(index);
      setIsViewerOpen(true);
    }
  };

  const handleImageMouseDown = (e: React.MouseEvent, imageId: number, index: number) => {
    // Handle middle click to open in new tab
    if (e.button === 1) {
      e.preventDefault();
      window.open(`/image/${imageId}`, '_blank');
      return;
    }
    
    // Handle left click normally - but only if there's no custom onImageClick handler
    if (e.button === 0 && !onImageClick) {
      handleImageClick(imageId, index);
    }
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedImageIndex(null);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;

    let newIndex = selectedImageIndex;
    if (direction === 'prev' && selectedImageIndex > 0) {
      newIndex = selectedImageIndex - 1;
    } else if (direction === 'next' && selectedImageIndex < images.length - 1) {
      newIndex = selectedImageIndex + 1;
    }

    setSelectedImageIndex(newIndex);
  };
  if (images.length === 0 && !isLoading) {
    return <div className="text-center text-gray-400 py-8">No images found.</div>;
  }

  // Show skeleton placeholders while loading
  if (showSkeletons) {
    const skeletonCount = expectedCount; // Use expected count for better layout stability
    const skeletonItems = Array.from({ length: skeletonCount }, (_, index) => (
      <div key={`skeleton-${index}`} className="break-inside-avoid bg-gray-800 rounded overflow-hidden shadow-md">
        <SkeletonImage 
          width={300} 
          height={Math.floor(Math.random() * 200) + 200} // Random height for variety
          className="rounded"
        />
      </div>
    ));

    return (
      <div className="masonry-container">
        <Masonry
          breakpointCols={getBreakpointColumns(imageSize, isCollapsed)}
          className="flex w-auto"
          columnClassName="masonry-column"
        >
          {skeletonItems}
        </Masonry>
      </div>
    );
  }

  return (
    <div className="masonry-container">
      <Masonry
        breakpointCols={getBreakpointColumns(imageSize, isCollapsed)}
        className="flex w-auto"
        columnClassName="masonry-column"
      >
        {images.map((img, index) => {
          const isSelected = selectedImages.has(img.id);

          if (isSelecting) {
            return (
              <div
                key={img.id}
                onClick={() => onImageSelect?.(img.id)}
                onMouseDown={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    window.open(`/image/${img.id}`, '_blank');
                  }
                }}
                className={`break-inside-avoid bg-gray-800 rounded overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer relative ${isSelected ? 'ring-4 ring-blue-500' : 'hover:ring-2 hover:ring-pink-500'
                  }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold z-10">
                    ✓
                  </div>
                )}
                <IntelligentImage
                  filename={img.filename}
                  alt={img.filename}
                  size={effectiveSize}
                  priority="high"
                  className={`transition-opacity ${isSelected ? 'opacity-80' : ''}`}
                  loading="lazy"
                  decoding="async"
                  width={img.width}
                  height={img.height}
                />
              </div>
            );
          }

          return onImageClick ? (
            <div
              key={img.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onImageClick(img.id);
              }}
              onMouseDown={(e) => handleImageMouseDown(e, img.id, index)}
              className="break-inside-avoid bg-gray-800 rounded overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer hover:ring-2 hover:ring-pink-500"
            >
              <IntelligentImage
                filename={img.filename}
                alt={img.filename}
                size={effectiveSize}
                priority="normal"
                className=""
                loading="lazy"
                decoding="async"
                width={img.width}
                height={img.height}
              />
            </div>
          ) : (
            <div
              key={img.id}
              onClick={() => handleImageClick(img.id, index)}
              onMouseDown={(e) => handleImageMouseDown(e, img.id, index)}
              className="break-inside-avoid bg-gray-800 rounded overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer hover:ring-2 hover:ring-pink-500"
            >
              <IntelligentImage
                filename={img.filename}
                alt={img.filename}
                size={effectiveSize}
                priority="normal"
                className=""
                loading="lazy"
                decoding="async"
                width={img.width}
                height={img.height}
              />
            </div>
          );
        })}
      </Masonry>

      {/* Image Viewer Modal */}
      {isViewerOpen && selectedImageIndex !== null && (
        <ImageViewer
          images={images}
          currentIndex={selectedImageIndex}
          onClose={handleCloseViewer}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default ImageMasonry;

