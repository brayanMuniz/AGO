import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUrlParams } from './useUrlParams';
import { useFilterHandlers } from '../utils/filterHandlers';

export interface ImageItem {
  id: number;
  filename: string;
  width: number;
  height: number;
}

export interface PaginationData {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
}

export interface ImageGalleryConfig {
  apiEndpoint: (params: {
    page: number;
    limit: number;
    sort: string;
    seed?: string;
    includeCharacters?: string;
    excludeCharacters?: string;
    includeTags?: string;
    excludeTags?: string;
    includeExplicitness?: string;
    excludeExplicitness?: string;
    includeSeries?: string;
    excludeSeries?: string;
    includeArtists?: string;
    excludeArtists?: string;
  }) => string;
  initialLoading?: boolean;
}

export interface UseImageGalleryReturn {
  // Data
  images: ImageItem[];
  pagination: PaginationData;
  loading: boolean;
  error: string | null;
  
  // URL params
  sortBy: string;
  backendSortBy: string;
  itemsPerPage: number;
  imageSize: 'small' | 'medium' | 'large';
  page: number;
  seed?: number;
  includeCharacters?: string[];
  excludeCharacters?: string[];
  includeTags?: string[];
  excludeTags?: string[];
  includeExplicitness?: string[];
  excludeExplicitness?: string[];
  includeSeries?: string[];
  excludeSeries?: string[];
  includeArtists?: string[];
  excludeArtists?: string[];
  
  // Handlers
  handleSortChange: (sort: string) => void;
  handleItemsPerPageChange: (limit: number) => void;
  handleImageSizeChange: (size: 'small' | 'medium' | 'large') => void;
  setPage: (page: number) => void;
  handleRemoveCharacterFilter: (characterName: string, type: 'include' | 'exclude') => void;
  handleRemoveTagFilter: (tagName: string, type: 'include' | 'exclude') => void;
  handleRemoveExplicitnessFilter: (explicitnessLevel: string, type: 'include' | 'exclude') => void;
  handleRemoveSeriesFilter: (seriesName: string, type: 'include' | 'exclude') => void;
  handleRemoveArtistFilter: (artistName: string, type: 'include' | 'exclude') => void;
  handleClearAllFilters: () => void;
  
  // Character filter props for components
  characterFilters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>;
  onCharacterFiltersChange: (filters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>) => void;
  
  // Tag filter props for components
  tagFilters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>;
  onTagFiltersChange: (filters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>) => void;
  
  // Explicitness filter props for components
  explicitnessFilters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>;
  onExplicitnessFiltersChange: (filters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>) => void;
  
  // Series filter props for components
  seriesFilters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>;
  onSeriesFiltersChange: (filters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>) => void;
  
  // Artist filter props for components
  artistFilters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>;
  onArtistFiltersChange: (filters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>) => void;
  
  // Refresh function
  refreshImages: () => Promise<void>;
}

export const useImageGallery = (config: ImageGalleryConfig): UseImageGalleryReturn => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    limit: 20,
  });
  const [loading, setLoading] = useState(config.initialLoading ?? true);
  const [error, setError] = useState<string | null>(null);

  // URL parameters
  const {
    sortBy,
    perPage: itemsPerPage,
    imageSize,
    page,
    seed,
    includeCharacters,
    excludeCharacters,
    includeTags,
    excludeTags,
    includeExplicitness,
    excludeExplicitness,
    includeSeries,
    excludeSeries,
    includeArtists,
    excludeArtists,
    backendSortBy,
    setPerPage: setItemsPerPage,
    setImageSize,
    setPage,
    setCharacterFilters,
    setTagFilters,
    setExplicitnessFilters,
    setSeriesFilters,
    setArtistFilters,
    getBackendSortValue,
    handleBackendSortChange,
  } = useUrlParams();

  // Memoize character filter strings to prevent unnecessary re-renders
  const includeCharactersString = useMemo(() => 
    includeCharacters ? includeCharacters.join(',') : '', 
    [includeCharacters]
  );
  const excludeCharactersString = useMemo(() => 
    excludeCharacters ? excludeCharacters.join(',') : '', 
    [excludeCharacters]
  );
  
  // Memoize tag filter strings to prevent unnecessary re-renders
  const includeTagsString = useMemo(() => 
    includeTags ? includeTags.join(',') : '', 
    [includeTags]
  );
  const excludeTagsString = useMemo(() => 
    excludeTags ? excludeTags.join(',') : '', 
    [excludeTags]
  );

  // Memoize explicitness filter strings to prevent unnecessary re-renders
  const includeExplicitnessString = useMemo(() => 
    includeExplicitness ? includeExplicitness.join(',') : '', 
    [includeExplicitness]
  );
  const excludeExplicitnessString = useMemo(() => 
    excludeExplicitness ? excludeExplicitness.join(',') : '', 
    [excludeExplicitness]
  );

  // Memoize series filter strings to prevent unnecessary re-renders
  const includeSeriesString = useMemo(() => 
    includeSeries ? includeSeries.join(',') : '', 
    [includeSeries]
  );
  const excludeSeriesString = useMemo(() => 
    excludeSeries ? excludeSeries.join(',') : '', 
    [excludeSeries]
  );

  // Memoize artist filter strings to prevent unnecessary re-renders
  const includeArtistsString = useMemo(() => 
    includeArtists ? includeArtists.join(',') : '', 
    [includeArtists]
  );
  const excludeArtistsString = useMemo(() => 
    excludeArtists ? excludeArtists.join(',') : '', 
    [excludeArtists]
  );

  // Character filters for components
  const characterFilters = useMemo(() => [
    ...(includeCharacters || []).map(name => ({ id: 0, name, type: 'include' as const })),
    ...(excludeCharacters || []).map(name => ({ id: 0, name, type: 'exclude' as const }))
  ], [includeCharacters, excludeCharacters]);

  // Tag filters for components
  const tagFilters = useMemo(() => [
    ...(includeTags || []).map(name => ({ id: 0, name, type: 'include' as const })),
    ...(excludeTags || []).map(name => ({ id: 0, name, type: 'exclude' as const }))
  ], [includeTags, excludeTags]);

  // Explicitness filters for components
  const explicitnessFilters = useMemo(() => [
    ...(includeExplicitness || []).map(level => ({ id: 0, name: level, type: 'include' as const })),
    ...(excludeExplicitness || []).map(level => ({ id: 0, name: level, type: 'exclude' as const }))
  ], [includeExplicitness, excludeExplicitness]);

  // Series filters for components
  const seriesFilters = useMemo(() => [
    ...(includeSeries || []).map(name => ({ id: 0, name, type: 'include' as const })),
    ...(excludeSeries || []).map(name => ({ id: 0, name, type: 'exclude' as const }))
  ], [includeSeries, excludeSeries]);

  // Artist filters for components
  const artistFilters = useMemo(() => [
    ...(includeArtists || []).map(name => ({ id: 0, name, type: 'include' as const })),
    ...(excludeArtists || []).map(name => ({ id: 0, name, type: 'exclude' as const }))
  ], [includeArtists, excludeArtists]);

  // Fetch images function
  const fetchImages = useCallback(async (pageNum: number = page) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = config.apiEndpoint({
        page: pageNum,
        limit: itemsPerPage,
        sort: getBackendSortValue(sortBy),
        seed: seed?.toString(),
        includeCharacters: includeCharactersString || undefined,
        excludeCharacters: excludeCharactersString || undefined,
        includeTags: includeTagsString || undefined,
        excludeTags: excludeTagsString || undefined,
        includeExplicitness: includeExplicitnessString || undefined,
        excludeExplicitness: excludeExplicitnessString || undefined,
        includeSeries: includeSeriesString || undefined,
        excludeSeries: excludeSeriesString || undefined,
        includeArtists: includeArtistsString || undefined,
        excludeArtists: excludeArtistsString || undefined,
      });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`);
      }

      const data = await response.json();
      
      const mappedImages: ImageItem[] = Array.isArray(data.images) 
        ? data.images.map((img: any) => ({
            id: img.id,
            filename: img.filename,
            width: img.width,
            height: img.height,
          }))
        : [];

      setImages(mappedImages);
      setPagination(data.pagination || {
        current_page: pageNum,
        total_pages: Math.ceil((data.total_count || 0) / itemsPerPage),
        total_count: data.total_count || 0,
        limit: itemsPerPage,
      });
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [config, itemsPerPage, sortBy, getBackendSortValue, seed, includeCharactersString, excludeCharactersString, includeTagsString, excludeTagsString, includeExplicitnessString, excludeExplicitnessString, includeSeriesString, excludeSeriesString, includeArtistsString, excludeArtistsString]);

  // Refresh function
  const refreshImages = useCallback(() => fetchImages(page), [fetchImages, page]);

  // Effect to fetch images when parameters change
  useEffect(() => {
    fetchImages(page);
  }, [sortBy, itemsPerPage, page, includeCharactersString, excludeCharactersString, includeTagsString, excludeTagsString, includeExplicitnessString, excludeExplicitnessString, includeSeriesString, excludeSeriesString, includeArtistsString, excludeArtistsString]);

  // Handler functions
  const handleSortChange = useCallback((sort: string) => {
    handleBackendSortChange(sort);
  }, [handleBackendSortChange]);

  const handleItemsPerPageChange = useCallback((limit: number) => {
    setItemsPerPage(limit as any);
  }, [setItemsPerPage]);

  const handleImageSizeChange = useCallback((newSize: 'small' | 'medium' | 'large') => {
    setImageSize(newSize);
  }, [setImageSize]);

  // Create filter handlers using shared utility
  const filterHandlers = useFilterHandlers({
    characters: {
      include: includeCharacters,
      exclude: excludeCharacters,
      setFilters: setCharacterFilters,
    },
    tags: {
      include: includeTags,
      exclude: excludeTags,
      setFilters: setTagFilters,
    },
    explicitness: {
      include: includeExplicitness,
      exclude: excludeExplicitness,
      setFilters: setExplicitnessFilters,
    },
    series: {
      include: includeSeries,
      exclude: excludeSeries,
      setFilters: setSeriesFilters,
    },
    artists: {
      include: includeArtists,
      exclude: excludeArtists,
      setFilters: setArtistFilters,
    },
  });

  const handleRemoveCharacterFilter = useCallback(filterHandlers.handleRemoveCharacterFilter, [filterHandlers.handleRemoveCharacterFilter]);
  const handleRemoveTagFilter = useCallback(filterHandlers.handleRemoveTagFilter, [filterHandlers.handleRemoveTagFilter]);
  const handleRemoveExplicitnessFilter = useCallback(filterHandlers.handleRemoveExplicitnessFilter, [filterHandlers.handleRemoveExplicitnessFilter]);
  const handleRemoveSeriesFilter = useCallback(filterHandlers.handleRemoveSeriesFilter, [filterHandlers.handleRemoveSeriesFilter]);
  const handleRemoveArtistFilter = useCallback(filterHandlers.handleRemoveArtistFilter, [filterHandlers.handleRemoveArtistFilter]);
  const handleClearAllFilters = useCallback(filterHandlers.handleClearAllFilters, [filterHandlers.handleClearAllFilters]);

  const onCharacterFiltersChange = useCallback((filters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>) => {
    const include = filters.filter(f => f.type === 'include').map(f => f.name);
    const exclude = filters.filter(f => f.type === 'exclude').map(f => f.name);
    setCharacterFilters(
      include.length > 0 ? include : undefined,
      exclude.length > 0 ? exclude : undefined
    );
  }, [setCharacterFilters]);

  const onTagFiltersChange = useCallback((filters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>) => {
    const include = filters.filter(f => f.type === 'include').map(f => f.name);
    const exclude = filters.filter(f => f.type === 'exclude').map(f => f.name);
    setTagFilters(
      include.length > 0 ? include : undefined,
      exclude.length > 0 ? exclude : undefined
    );
  }, [setTagFilters]);

  const onExplicitnessFiltersChange = useCallback((filters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>) => {
    const include = filters.filter(f => f.type === 'include').map(f => f.name);
    const exclude = filters.filter(f => f.type === 'exclude').map(f => f.name);
    setExplicitnessFilters(
      include.length > 0 ? include : undefined,
      exclude.length > 0 ? exclude : undefined
    );
  }, [setExplicitnessFilters]);

  const onSeriesFiltersChange = useCallback((filters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>) => {
    const include = filters.filter(f => f.type === 'include').map(f => f.name);
    const exclude = filters.filter(f => f.type === 'exclude').map(f => f.name);
    setSeriesFilters(
      include.length > 0 ? include : undefined,
      exclude.length > 0 ? exclude : undefined
    );
  }, [setSeriesFilters]);

  const onArtistFiltersChange = useCallback((filters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>) => {
    const include = filters.filter(f => f.type === 'include').map(f => f.name);
    const exclude = filters.filter(f => f.type === 'exclude').map(f => f.name);
    setArtistFilters(
      include.length > 0 ? include : undefined,
      exclude.length > 0 ? exclude : undefined
    );
  }, [setArtistFilters]);

  return {
    // Data
    images,
    pagination,
    loading,
    error,
    
    // URL params
    sortBy,
    backendSortBy,
    itemsPerPage,
    imageSize,
    page,
    seed,
    includeCharacters,
    excludeCharacters,
    includeTags,
    excludeTags,
    includeExplicitness,
    excludeExplicitness,
    includeSeries,
    excludeSeries,
    includeArtists,
    excludeArtists,
    
    // Handlers
    handleSortChange,
    handleItemsPerPageChange,
    handleImageSizeChange,
    setPage,
    handleRemoveCharacterFilter,
    handleRemoveTagFilter,
    handleRemoveExplicitnessFilter,
    handleRemoveSeriesFilter,
    handleRemoveArtistFilter,
    handleClearAllFilters,
    
    // Character filter props
    characterFilters,
    onCharacterFiltersChange,
    
    // Tag filter props
    tagFilters,
    onTagFiltersChange,
    
    // Explicitness filter props
    explicitnessFilters,
    onExplicitnessFiltersChange,
    
    // Series filter props
    seriesFilters,
    onSeriesFiltersChange,
    
    // Artist filter props
    artistFilters,
    onArtistFiltersChange,
    
    // Refresh function
    refreshImages,
  };
};
