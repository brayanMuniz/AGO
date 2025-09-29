import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

export type SortBy = 'newest' | 'oldest' | 'random' | 'most_liked' | 'least_liked' | 'highest_rated' | 'lowest_rated';
export type ImageSize = 'small' | 'medium' | 'large';
export type PerPage = 20 | 40 | 60 | 100 | 1000;

export interface UrlParams {
  sortBy: SortBy;
  perPage: PerPage;
  imageSize: ImageSize;
  page: number; // Current page number
  seed?: number; // Optional seed for random sorting
  includeCharacters?: string[]; // Character names to include
  excludeCharacters?: string[]; // Character names to exclude
  includeTags?: string[]; // Tag names to include
  excludeTags?: string[]; // Tag names to exclude
  includeExplicitness?: string[]; // Explicitness levels to include (general, sensitive, questionable, explicit)
  excludeExplicitness?: string[]; // Explicitness levels to exclude
  includeSeries?: string[]; // Series names to include
  excludeSeries?: string[]; // Series names to exclude
  includeArtists?: string[]; // Artist names to include
  excludeArtists?: string[]; // Artist names to exclude
}

const DEFAULT_PARAMS: UrlParams = {
  sortBy: 'newest',
  perPage: 20,
  imageSize: 'medium',
  page: 1
};

// Map user-friendly sort names to backend parameter names
const SORT_MAP: Record<SortBy, string> = {
  'newest': 'date_desc',
  'oldest': 'date_asc', 
  'most_liked': 'likes_desc',
  'least_liked': 'likes_asc',
  'highest_rated': 'rating_desc',
  'lowest_rated': 'rating_asc',
  'random': 'random'
};

// Reverse map for converting backend values back to user-friendly names
const REVERSE_SORT_MAP: Record<string, SortBy> = {
  'date_desc': 'newest',
  'date_asc': 'oldest',
  'likes_desc': 'most_liked',
  'likes_asc': 'least_liked',
  'rating_desc': 'highest_rated',
  'rating_asc': 'lowest_rated',
  'random': 'random'
};

export const useUrlParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse current URL parameters with defaults
  const getCurrentParams = useCallback((): UrlParams => {
    const sortBy = (searchParams.get('sort_by') as SortBy) || DEFAULT_PARAMS.sortBy;
    const perPage = parseInt(searchParams.get('per_page') || '20') as PerPage;
    const imageSize = (searchParams.get('image_size') as ImageSize) || DEFAULT_PARAMS.imageSize;
    const page = parseInt(searchParams.get('page') || '1');
    const seed = searchParams.get('seed') ? parseInt(searchParams.get('seed')!) : undefined;
    
    // Parse character filters
    const includeCharacters = searchParams.get('include_characters')?.split(',').filter(Boolean) || undefined;
    const excludeCharacters = searchParams.get('exclude_characters')?.split(',').filter(Boolean) || undefined;
    
    // Parse tag filters
    const includeTags = searchParams.get('include_tags')?.split(',').filter(Boolean) || undefined;
    const excludeTags = searchParams.get('exclude_tags')?.split(',').filter(Boolean) || undefined;
    
    // Parse explicitness filters
    const includeExplicitness = searchParams.get('include_explicitness')?.split(',').filter(Boolean) || undefined;
    const excludeExplicitness = searchParams.get('exclude_explicitness')?.split(',').filter(Boolean) || undefined;
    
    // Parse series filters
    const includeSeries = searchParams.get('include_series')?.split(',').filter(Boolean) || undefined;
    const excludeSeries = searchParams.get('exclude_series')?.split(',').filter(Boolean) || undefined;
    
    // Parse artist filters
    const includeArtists = searchParams.get('include_artists')?.split(',').filter(Boolean) || undefined;
    const excludeArtists = searchParams.get('exclude_artists')?.split(',').filter(Boolean) || undefined;

    // Validate parameters - handle both user-friendly and backend parameter names
    let validSortBy: SortBy;
    if (['newest', 'oldest', 'random', 'most_liked', 'least_liked', 'highest_rated', 'lowest_rated'].includes(sortBy)) {
      // User-friendly name
      validSortBy = sortBy;
    } else if (REVERSE_SORT_MAP[sortBy]) {
      // Backend parameter name - convert to user-friendly
      validSortBy = REVERSE_SORT_MAP[sortBy];
    } else {
      // Invalid - use default
      validSortBy = DEFAULT_PARAMS.sortBy;
    }
    const validPerPage = [20, 40, 60, 100, 1000].includes(perPage) 
      ? perPage : DEFAULT_PARAMS.perPage;
    const validImageSize = ['small', 'medium', 'large'].includes(imageSize) 
      ? imageSize : DEFAULT_PARAMS.imageSize;
    const validPage = page >= 1 ? page : DEFAULT_PARAMS.page;

    return {
      sortBy: validSortBy,
      perPage: validPerPage,
      imageSize: validImageSize,
      page: validPage,
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
      excludeArtists
    };
  }, [searchParams]);

  // Convert user-friendly sort value to backend parameter
  const getBackendSortValue = useCallback((sortBy: SortBy): string => {
    return SORT_MAP[sortBy] || SORT_MAP[DEFAULT_PARAMS.sortBy];
  }, []);

  // Update URL parameters
  const updateParams = useCallback((newParams: Partial<UrlParams>) => {
    const currentParams = getCurrentParams();
    const updatedParams = { ...currentParams, ...newParams };
    
    const newSearchParams = new URLSearchParams();
    
    // Only add non-default parameters to keep URLs clean
    if (updatedParams.sortBy !== DEFAULT_PARAMS.sortBy) {
      newSearchParams.set('sort_by', updatedParams.sortBy);
    }
    if (updatedParams.perPage !== DEFAULT_PARAMS.perPage) {
      newSearchParams.set('per_page', updatedParams.perPage.toString());
    }
    if (updatedParams.imageSize !== DEFAULT_PARAMS.imageSize) {
      newSearchParams.set('image_size', updatedParams.imageSize);
    }
    if (updatedParams.page !== DEFAULT_PARAMS.page) {
      newSearchParams.set('page', updatedParams.page.toString());
    }
    if (updatedParams.seed !== undefined) {
      newSearchParams.set('seed', updatedParams.seed.toString());
    }
    if (updatedParams.includeCharacters && updatedParams.includeCharacters.length > 0) {
      newSearchParams.set('include_characters', updatedParams.includeCharacters.join(','));
    } else if (updatedParams.includeCharacters !== undefined) {
      newSearchParams.delete('include_characters');
    }
    if (updatedParams.excludeCharacters && updatedParams.excludeCharacters.length > 0) {
      newSearchParams.set('exclude_characters', updatedParams.excludeCharacters.join(','));
    } else if (updatedParams.excludeCharacters !== undefined) {
      newSearchParams.delete('exclude_characters');
    }
    if (updatedParams.includeTags && updatedParams.includeTags.length > 0) {
      newSearchParams.set('include_tags', updatedParams.includeTags.join(','));
    } else if (updatedParams.includeTags !== undefined) {
      newSearchParams.delete('include_tags');
    }
    if (updatedParams.excludeTags && updatedParams.excludeTags.length > 0) {
      newSearchParams.set('exclude_tags', updatedParams.excludeTags.join(','));
    } else if (updatedParams.excludeTags !== undefined) {
      newSearchParams.delete('exclude_tags');
    }
    if (updatedParams.includeExplicitness && updatedParams.includeExplicitness.length > 0) {
      newSearchParams.set('include_explicitness', updatedParams.includeExplicitness.join(','));
    } else if (updatedParams.includeExplicitness !== undefined) {
      newSearchParams.delete('include_explicitness');
    }
    if (updatedParams.excludeExplicitness && updatedParams.excludeExplicitness.length > 0) {
      newSearchParams.set('exclude_explicitness', updatedParams.excludeExplicitness.join(','));
    } else if (updatedParams.excludeExplicitness !== undefined) {
      newSearchParams.delete('exclude_explicitness');
    }
    if (updatedParams.includeSeries && updatedParams.includeSeries.length > 0) {
      newSearchParams.set('include_series', updatedParams.includeSeries.join(','));
    } else if (updatedParams.includeSeries !== undefined) {
      newSearchParams.delete('include_series');
    }
    if (updatedParams.excludeSeries && updatedParams.excludeSeries.length > 0) {
      newSearchParams.set('exclude_series', updatedParams.excludeSeries.join(','));
    } else if (updatedParams.excludeSeries !== undefined) {
      newSearchParams.delete('exclude_series');
    }
    if (updatedParams.includeArtists && updatedParams.includeArtists.length > 0) {
      newSearchParams.set('include_artists', updatedParams.includeArtists.join(','));
    } else if (updatedParams.includeArtists !== undefined) {
      newSearchParams.delete('include_artists');
    }
    if (updatedParams.excludeArtists && updatedParams.excludeArtists.length > 0) {
      newSearchParams.set('exclude_artists', updatedParams.excludeArtists.join(','));
    } else if (updatedParams.excludeArtists !== undefined) {
      newSearchParams.delete('exclude_artists');
    }

    setSearchParams(newSearchParams, { replace: true });
  }, [getCurrentParams, setSearchParams]);

  // Individual parameter updaters
  const setSortBy = useCallback((sortBy: SortBy) => {
    const params: Partial<UrlParams> = { sortBy };
    
    // Generate new seed when switching to random sorting
    if (sortBy === 'random') {
      params.seed = Math.floor(Math.random() * 1000000);
    }
    
    updateParams(params);
  }, [updateParams]);

  const setPerPage = useCallback((perPage: PerPage) => {
    updateParams({ perPage });
  }, [updateParams]);

  const setImageSize = useCallback((imageSize: ImageSize) => {
    updateParams({ imageSize });
  }, [updateParams]);

  const setPage = useCallback((page: number) => {
    updateParams({ page });
  }, [updateParams]);

  const setCharacterFilters = useCallback((includeCharacters?: string[], excludeCharacters?: string[]) => {
    updateParams({ includeCharacters, excludeCharacters });
  }, [updateParams]);

  const setTagFilters = useCallback((includeTags?: string[], excludeTags?: string[]) => {
    updateParams({ includeTags, excludeTags });
  }, [updateParams]);

  const setExplicitnessFilters = useCallback((includeExplicitness?: string[], excludeExplicitness?: string[]) => {
    updateParams({ includeExplicitness, excludeExplicitness });
  }, [updateParams]);

  const setSeriesFilters = useCallback((includeSeries?: string[], excludeSeries?: string[]) => {
    updateParams({ includeSeries, excludeSeries });
  }, [updateParams]);

  const setArtistFilters = useCallback((includeArtists?: string[], excludeArtists?: string[]) => {
    updateParams({ includeArtists, excludeArtists });
  }, [updateParams]);

  // Handle backend parameter changes from ImageControlsBar
  const handleBackendSortChange = useCallback((backendSort: string) => {
    const userFriendlySort = REVERSE_SORT_MAP[backendSort];
    if (userFriendlySort) {
      setSortBy(userFriendlySort);
    }
  }, [setSortBy]);

  // Get current parameter values
  const params = getCurrentParams();

  return {
    // Current values (user-friendly)
    sortBy: params.sortBy,
    perPage: params.perPage,
    imageSize: params.imageSize,
    page: params.page,
    seed: params.seed,
    includeCharacters: params.includeCharacters,
    excludeCharacters: params.excludeCharacters,
    includeTags: params.includeTags,
    excludeTags: params.excludeTags,
    includeExplicitness: params.includeExplicitness,
    excludeExplicitness: params.excludeExplicitness,
    includeSeries: params.includeSeries,
    excludeSeries: params.excludeSeries,
    includeArtists: params.includeArtists,
    excludeArtists: params.excludeArtists,
    
    // Backend values for components that expect them
    backendSortBy: getBackendSortValue(params.sortBy),
    
    // Updaters
    setSortBy,
    setPerPage,
    setImageSize,
    setPage,
    setCharacterFilters,
    setTagFilters,
    setExplicitnessFilters,
    setSeriesFilters,
    setArtistFilters,
    updateParams,
    handleBackendSortChange,
    
    // Utility
    getCurrentParams,
    getBackendSortValue
  };
};
