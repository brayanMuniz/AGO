import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUrlParams } from './useUrlParams';

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
  
  // Handlers
  handleSortChange: (sort: string) => void;
  handleItemsPerPageChange: (limit: number) => void;
  handleImageSizeChange: (size: 'small' | 'medium' | 'large') => void;
  setPage: (page: number) => void;
  handleRemoveCharacterFilter: (characterName: string, type: 'include' | 'exclude') => void;
  handleRemoveTagFilter: (tagName: string, type: 'include' | 'exclude') => void;
  handleClearAllFilters: () => void;
  
  // Character filter props for components
  characterFilters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>;
  onCharacterFiltersChange: (filters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>) => void;
  
  // Tag filter props for components
  tagFilters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>;
  onTagFiltersChange: (filters: Array<{ id: number; name: string; type: 'include' | 'exclude' }>) => void;
  
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
    backendSortBy,
    setPerPage: setItemsPerPage,
    setImageSize,
    setPage,
    setCharacterFilters,
    setTagFilters,
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
  }, [config, itemsPerPage, sortBy, getBackendSortValue, seed, includeCharactersString, excludeCharactersString, includeTagsString, excludeTagsString]);

  // Refresh function
  const refreshImages = useCallback(() => fetchImages(page), [fetchImages, page]);

  // Effect to fetch images when parameters change
  useEffect(() => {
    fetchImages(page);
  }, [sortBy, itemsPerPage, page, includeCharactersString, excludeCharactersString, includeTagsString, excludeTagsString]);

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

  const handleRemoveCharacterFilter = useCallback((characterName: string, type: 'include' | 'exclude') => {
    if (type === 'include') {
      const newInclude = includeCharacters?.filter(name => name !== characterName) || [];
      setCharacterFilters(newInclude.length > 0 ? newInclude : undefined, excludeCharacters);
    } else {
      const newExclude = excludeCharacters?.filter(name => name !== characterName) || [];
      setCharacterFilters(includeCharacters, newExclude.length > 0 ? newExclude : undefined);
    }
  }, [includeCharacters, excludeCharacters, setCharacterFilters]);

  const handleRemoveTagFilter = useCallback((tagName: string, type: 'include' | 'exclude') => {
    if (type === 'include') {
      const newInclude = includeTags?.filter(name => name !== tagName) || [];
      setTagFilters(newInclude.length > 0 ? newInclude : undefined, excludeTags);
    } else {
      const newExclude = excludeTags?.filter(name => name !== tagName) || [];
      setTagFilters(includeTags, newExclude.length > 0 ? newExclude : undefined);
    }
  }, [includeTags, excludeTags, setTagFilters]);

  const handleClearAllFilters = useCallback(() => {
    setCharacterFilters(undefined, undefined);
    setTagFilters(undefined, undefined);
  }, [setCharacterFilters, setTagFilters]);

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
    
    // Handlers
    handleSortChange,
    handleItemsPerPageChange,
    handleImageSizeChange,
    setPage,
    handleRemoveCharacterFilter,
    handleRemoveTagFilter,
    handleClearAllFilters,
    
    // Character filter props
    characterFilters,
    onCharacterFiltersChange,
    
    // Tag filter props
    tagFilters,
    onTagFiltersChange,
    
    // Refresh function
    refreshImages,
  };
};
