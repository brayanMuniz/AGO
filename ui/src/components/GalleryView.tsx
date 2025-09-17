import React, { useState } from "react";
import Masonry from "react-masonry-css";
import ImageViewer from "./ImageViewer";

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
}

const getBreakpointColumns = (size: 'small' | 'medium' | 'large') => {
  const multipliers = { small: 1.5, medium: 1, large: 0.7 };
  const multiplier = multipliers[size];

  return {
    default: Math.round(6 * multiplier),
    1600: Math.round(5 * multiplier),
    1280: Math.round(4 * multiplier),
    1024: Math.round(3 * multiplier),
    768: Math.round(2 * multiplier),
    640: 1,
  };
};

const ImageMasonry: React.FC<GalleryViewProps> = ({
  images,
  onImageClick,
  isSelecting = false,
  selectedImages = new Set(),
  onImageSelect,
  imageSize = 'medium'
}) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleImageClick = (imageId: number, index: number) => {
    if (onImageClick) {
      onImageClick(imageId);
    } else {
      setSelectedImageIndex(index);
      setIsViewerOpen(true);
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
  if (images.length === 0) {
    return <div className="text-center text-gray-400 py-8">No images found.</div>;
  }

  return (
    <>
      <Masonry
        breakpointCols={getBreakpointColumns(imageSize)}
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
                className={`break-inside-avoid bg-gray-800 rounded overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer relative ${isSelected ? 'ring-4 ring-blue-500' : 'hover:ring-2 hover:ring-pink-500'
                  }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold z-10">
                    ✓
                  </div>
                )}
                <img
                  src={`/api/images/file/${img.filename}`}
                  alt={img.filename}
                  className={`w-full h-auto object-cover transition-opacity ${isSelected ? 'opacity-80' : ''
                    }`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            );
          }

          return onImageClick ? (
            <div
              key={img.id}
              onClick={() => onImageClick(img.id)}
              className="break-inside-avoid bg-gray-800 rounded overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer hover:ring-2 hover:ring-pink-500"
            >
              <img
                src={`/api/images/file/${img.filename}`}
                alt={img.filename}
                className="w-full h-auto object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : (
            <div
              key={img.id}
              onClick={() => handleImageClick(img.id, index)}
              className="break-inside-avoid bg-gray-800 rounded overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer hover:ring-2 hover:ring-pink-500"
            >
              <img
                src={`/api/images/file/${img.filename}`}
                alt={img.filename}
                className="w-full h-auto object-cover"
                loading="lazy"
                decoding="async"
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
    </>
  );
};

export default ImageMasonry;

