import React from "react";

interface ImageControlsBarProps {
  // Sorting controls
  sortBy: string;
  onSortChange: (sort: string) => void;
  
  // Pagination controls
  itemsPerPage: number;
  onItemsPerPageChange: (limit: number) => void;
  
  // Image size controls
  imageSize: 'small' | 'medium' | 'large';
  onImageSizeChange: (size: 'small' | 'medium' | 'large') => void;
  
  // Optional: disable certain controls
  showSortControls?: boolean;
  showPaginationControls?: boolean;
  showImageSizeControls?: boolean;
}

const ImageControlsBar: React.FC<ImageControlsBarProps> = ({
  sortBy,
  onSortChange,
  itemsPerPage,
  onItemsPerPageChange,
  imageSize,
  onImageSizeChange,
  showSortControls = true,
  showPaginationControls = true,
  showImageSizeControls = true,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
      {/* Sort By Dropdown */}
      {showSortControls && (
        <div className="flex items-center gap-2">
          <label className="text-white text-sm font-medium">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-pink-500 focus:outline-none"
          >
            <option value="random">Random</option>
            <option value="date_desc">Date (Newest)</option>
            <option value="date_asc">Date (Oldest)</option>
            <option value="rating_desc">Rating (High to Low)</option>
            <option value="rating_asc">Rating (Low to High)</option>
            <option value="likes_desc">Likes (High to Low)</option>
            <option value="likes_asc">Likes (Low to High)</option>
          </select>
        </div>
      )}

      {/* Items Per Page Dropdown */}
      {showPaginationControls && (
        <div className="flex items-center gap-2">
          <label className="text-white text-sm font-medium">Per page:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-pink-500 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={40}>40</option>
            <option value={60}>60</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}

      {/* Image Size Slider */}
      {showImageSizeControls && (
        <div className="flex items-center gap-2">
          <label className="text-white text-sm font-medium">Image size:</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">Small</span>
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={imageSize === 'small' ? 0 : imageSize === 'medium' ? 1 : 2}
              onChange={(e) => {
                const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
                onImageSizeChange(sizes[Number(e.target.value)]);
              }}
              className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-gray-400 text-xs">Large</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageControlsBar;
