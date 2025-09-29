/**
 * Unified FilterableGalleryPage component that automatically handles all filter types
 * Eliminates the need to manually add each new filter to multiple places
 */

import React from 'react';
import { useImageGallery } from '../hooks/useImageGallery';
import type { ImageGalleryConfig } from '../hooks/useImageGallery';
import type { FilterType } from '../types/filterTypes';
import { useUnifiedFilters } from '../hooks/useUnifiedFilters';
import ImageControlsBar from './ImageControlsBar';
import UnifiedFilterDisplay from './UnifiedFilterDisplay';
import GalleryView from './GalleryView';
import Pagination from './Pagination';

export interface ExportData {
  images: number[];
  exportName: string;
  exportType: string;
}

export interface FilterableGalleryPageProps {
  config: ImageGalleryConfig;
  enabledFilters?: FilterType[];
  exportData?: ExportData;
  onExport?: () => void;
  showExportControls?: boolean;
  customHeader?: React.ReactNode;
  onImageSelect?: (imageId: number) => void;
  selectedImages?: Set<number>;
  isSelectingImages?: boolean;
}

const FilterableGalleryPage: React.FC<FilterableGalleryPageProps> = ({
  config,
  enabledFilters = ['characters', 'tags', 'explicitness', 'series', 'artists'],
  exportData,
  onExport,
  showExportControls = false,
  customHeader,
  onImageSelect,
  selectedImages,
  isSelectingImages = false,
}) => {
  // Get unified filter state and strings for API calls
  const { 
    filterStrings, 
    getFilterItems, 
    updateFilters 
  } = useUnifiedFilters({ enabledFilters });

  // Enhance config with filter parameters
  const enhancedConfig = {
    ...config,
    ...filterStrings,
  };

  // Use the existing useImageGallery hook with enhanced config
  const {
    images,
    pagination,
    loading,
    error,
    backendSortBy,
    itemsPerPage,
    imageSize,
    page,
    handleSortChange,
    handleItemsPerPageChange,
    handleImageSizeChange,
    setPage,
  } = useImageGallery(enhancedConfig);

  return (
    <>
      {/* Custom Header */}
      {customHeader}

      {/* Controls Bar with Integrated Filters */}
      <ImageControlsBar
        sortBy={backendSortBy}
        onSortChange={handleSortChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        imageSize={imageSize}
        onImageSizeChange={handleImageSizeChange}
        characterFilters={enabledFilters.includes('characters') ? getFilterItems('characters') : undefined}
        onCharacterFiltersChange={enabledFilters.includes('characters') ? (filters) => updateFilters('characters', filters) : undefined}
        tagFilters={enabledFilters.includes('tags') ? getFilterItems('tags') : undefined}
        onTagFiltersChange={enabledFilters.includes('tags') ? (filters) => updateFilters('tags', filters) : undefined}
        explicitnessFilters={enabledFilters.includes('explicitness') ? getFilterItems('explicitness') : undefined}
        onExplicitnessFiltersChange={enabledFilters.includes('explicitness') ? (filters) => updateFilters('explicitness', filters) : undefined}
        seriesFilters={enabledFilters.includes('series') ? getFilterItems('series') : undefined}
        onSeriesFiltersChange={enabledFilters.includes('series') ? (filters) => updateFilters('series', filters) : undefined}
        artistFilters={enabledFilters.includes('artists') ? getFilterItems('artists') : undefined}
        onArtistFiltersChange={enabledFilters.includes('artists') ? (filters) => updateFilters('artists', filters) : undefined}
        exportData={exportData}
        onExport={onExport}
        showExportControls={showExportControls}
      />

      {/* Unified Filter Display */}
      <UnifiedFilterDisplay enabledFilters={enabledFilters} />

      {/* Error Display */}
      {error && (
        <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded mb-6">
          Error: {error}
        </div>
      )}

      {/* Gallery */}
      <GalleryView
        images={images}
        onImageSelect={onImageSelect}
        selectedImages={selectedImages}
        isLoading={loading}
        imageSize={imageSize}
      />

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={pagination.total_pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </>
  );
};

export default FilterableGalleryPage;
