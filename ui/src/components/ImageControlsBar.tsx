import React, { useState } from "react";

interface ExportData {
  images: number[];
  exportName: string;
  exportType: string;
}

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
  
  // Export controls
  exportData?: ExportData;
  onExport?: () => void;
  
  // Optional: disable certain controls
  showSortControls?: boolean;
  showPaginationControls?: boolean;
  showImageSizeControls?: boolean;
  showExportControls?: boolean;
}

const ImageControlsBar: React.FC<ImageControlsBarProps> = ({
  sortBy,
  onSortChange,
  itemsPerPage,
  onItemsPerPageChange,
  imageSize,
  onImageSizeChange,
  exportData,
  onExport,
  showSortControls = true,
  showPaginationControls = true,
  showImageSizeControls = true,
  showExportControls = true,
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
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

      {/* Export Button */}
      {showExportControls && exportData && exportData.images.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded border border-green-500 focus:border-green-400 focus:outline-none transition-colors"
          >
            📤 Export ({exportData.images.length})
          </button>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && exportData && onExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Export Images</h3>
            
            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                Export <span className="font-semibold text-white">{exportData.images.length}</span> images from:
              </p>
              <p className="text-lg font-semibold text-blue-400">
                {exportData.exportName}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Type: {exportData.exportType}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 text-sm mb-2">
                Images will be exported to: <code className="bg-gray-700 px-2 py-1 rounded text-green-400">
                  exports/{exportData.exportType === 'album' ? exportData.exportName.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_') : `${exportData.exportType}__${exportData.exportName.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_')}`}
                </code>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                <strong>Note:</strong> Only new images will be exported if the directory already exists.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  onExport();
                  setShowExportModal(false);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                Export Images
              </button>
              
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageControlsBar;
