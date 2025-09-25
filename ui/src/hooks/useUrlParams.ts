import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

export type SortBy = 'newest' | 'oldest' | 'random' | 'most_liked' | 'least_liked' | 'highest_rated' | 'lowest_rated';
export type ImageSize = 'small' | 'medium' | 'large';
export type PerPage = 20 | 40 | 60 | 100;

export interface UrlParams {
  sortBy: SortBy;
  perPage: PerPage;
  imageSize: ImageSize;
  page: number; // Current page number
  seed?: number; // Optional seed for random sorting
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
    const validPerPage = [20, 40, 60, 100].includes(perPage) 
      ? perPage : DEFAULT_PARAMS.perPage;
    const validImageSize = ['small', 'medium', 'large'].includes(imageSize) 
      ? imageSize : DEFAULT_PARAMS.imageSize;
    const validPage = page >= 1 ? page : DEFAULT_PARAMS.page;

    return {
      sortBy: validSortBy,
      perPage: validPerPage,
      imageSize: validImageSize,
      page: validPage,
      seed
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
    
    // Backend values for components that expect them
    backendSortBy: getBackendSortValue(params.sortBy),
    
    // Updaters
    setSortBy,
    setPerPage,
    setImageSize,
    setPage,
    updateParams,
    handleBackendSortChange,
    
    // Utility
    getCurrentParams,
    getBackendSortValue
  };
};
