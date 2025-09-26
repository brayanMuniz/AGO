import React from 'react';
import { useImageGallery } from '../hooks/useImageGallery';
import type { ImageGalleryConfig } from '../hooks/useImageGallery';
import ImageControlsBar from './ImageControlsBar';
import FilterDisplay from './FilterDisplay';
import GalleryView from './GalleryView';
import Pagination from './Pagination';

export interface ExportData {
  images: number[];
  exportName: string;
  exportType: string;
}

export interface ImageGalleryPageProps {
  config: ImageGalleryConfig;
  exportData?: ExportData;
  onExport?: () => void;
  showExportControls?: boolean;
  customHeader?: React.ReactNode;
  onImageSelect?: (imageId: number) => void;
  selectedImages?: Set<number>;
  isSelectingImages?: boolean;
}

const ImageGalleryPage: React.FC<ImageGalleryPageProps> = ({
  config,
  exportData,
  onExport,
  showExportControls = false,
  customHeader,
  onImageSelect,
  selectedImages,
  isSelectingImages = false,
}) => {
  const {
    images,
    pagination,
    loading,
    error,
    backendSortBy,
    itemsPerPage,
    imageSize,
    page,
    includeCharacters,
    excludeCharacters,
    includeTags,
    excludeTags,
    handleSortChange,
    handleItemsPerPageChange,
    handleImageSizeChange,
    setPage,
    handleRemoveCharacterFilter,
    handleRemoveTagFilter,
    handleClearAllFilters,
    characterFilters,
    onCharacterFiltersChange,
    tagFilters,
    onTagFiltersChange,
  } = useImageGallery(config);

  return (
    <>
      {/* Custom Header */}
      {customHeader}

      {/* Controls Bar */}
      <ImageControlsBar
        sortBy={backendSortBy}
        onSortChange={handleSortChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        imageSize={imageSize}
        onImageSizeChange={handleImageSizeChange}
        characterFilters={characterFilters}
        onCharacterFiltersChange={onCharacterFiltersChange}
        tagFilters={tagFilters}
        onTagFiltersChange={onTagFiltersChange}
        exportData={exportData}
        onExport={onExport}
        showExportControls={showExportControls}
      />

      {/* Filter Display */}
      <FilterDisplay
        includeCharacters={includeCharacters}
        excludeCharacters={excludeCharacters}
        includeTags={includeTags}
        excludeTags={excludeTags}
        onRemoveCharacterFilter={handleRemoveCharacterFilter}
        onRemoveTagFilter={handleRemoveTagFilter}
        onClearAllFilters={handleClearAllFilters}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded mb-6">
          Error: {error}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={pagination.total_pages}
        onPageChange={setPage}
      />

      {/* Gallery */}
      <GalleryView
        images={images}
        imageSize={imageSize}
        isLoading={loading}
        onImageSelect={onImageSelect}
        selectedImages={selectedImages}
        isSelecting={isSelectingImages}
      />

      {/* Bottom Pagination */}
      <Pagination
        currentPage={page}
        totalPages={pagination.total_pages}
        onPageChange={setPage}
      />
    </>
  );
};

export default ImageGalleryPage;
