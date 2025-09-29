/**
 * Unified filter management hook for FilterableGalleryPage
 * Automatically handles all filter types without manual prop passing
 */

import { useCallback, useMemo } from 'react';
import { useUrlParams } from './useUrlParams';
import type { FilterType, AllFilters, FilterItem } from '../types/filterTypes';
import { FILTER_CONFIGS } from '../types/filterTypes';

export interface UnifiedFiltersConfig {
  enabledFilters?: FilterType[];
}

export const useUnifiedFilters = (config: UnifiedFiltersConfig = {}) => {
  const {
    includeCharacters, excludeCharacters, setCharacterFilters,
    includeTags, excludeTags, setTagFilters,
    includeExplicitness, excludeExplicitness, setExplicitnessFilters,
    includeSeries, excludeSeries, setSeriesFilters,
    includeArtists, excludeArtists, setArtistFilters,
  } = useUrlParams();

  const { enabledFilters = ['characters', 'tags', 'explicitness', 'series', 'artists'] } = config;

  // Combine all filters into unified state
  const allFilters: AllFilters = useMemo(() => ({
    characters: { include: includeCharacters, exclude: excludeCharacters },
    tags: { include: includeTags, exclude: excludeTags },
    explicitness: { include: includeExplicitness, exclude: excludeExplicitness },
    series: { include: includeSeries, exclude: excludeSeries },
    artists: { include: includeArtists, exclude: excludeArtists },
  }), [
    includeCharacters, excludeCharacters,
    includeTags, excludeTags,
    includeExplicitness, excludeExplicitness,
    includeSeries, excludeSeries,
    includeArtists, excludeArtists,
  ]);

  // Filter setters mapping
  const filterSetters = useMemo(() => ({
    characters: setCharacterFilters,
    tags: setTagFilters,
    explicitness: setExplicitnessFilters,
    series: setSeriesFilters,
    artists: setArtistFilters,
  }), [setCharacterFilters, setTagFilters, setExplicitnessFilters, setSeriesFilters, setArtistFilters]);

  // Convert filters to FilterItem arrays for components
  const getFilterItems = useCallback((filterType: FilterType): FilterItem[] => {
    const filters = allFilters[filterType];
    return [
      ...(filters.include || []).map(name => ({ id: 0, name, type: 'include' as const })),
      ...(filters.exclude || []).map(name => ({ id: 0, name, type: 'exclude' as const })),
    ];
  }, [allFilters]);

  // Update filters
  const updateFilters = useCallback((filterType: FilterType, filters: FilterItem[]) => {
    const include = filters.filter(f => f.type === 'include').map(f => f.name);
    const exclude = filters.filter(f => f.type === 'exclude').map(f => f.name);
    
    filterSetters[filterType](
      include.length > 0 ? include : undefined,
      exclude.length > 0 ? exclude : undefined
    );
  }, [filterSetters]);

  // Remove individual filter
  const removeFilter = useCallback((filterType: FilterType, name: string, type: 'include' | 'exclude') => {
    const currentFilters = allFilters[filterType];
    const currentInclude = currentFilters.include || [];
    const currentExclude = currentFilters.exclude || [];

    if (type === 'include') {
      const newInclude = currentInclude.filter(item => item !== name);
      filterSetters[filterType](
        newInclude.length > 0 ? newInclude : undefined,
        currentExclude.length > 0 ? currentExclude : undefined
      );
    } else {
      const newExclude = currentExclude.filter(item => item !== name);
      filterSetters[filterType](
        currentInclude.length > 0 ? currentInclude : undefined,
        newExclude.length > 0 ? newExclude : undefined
      );
    }
  }, [allFilters, filterSetters]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    enabledFilters.forEach(filterType => {
      filterSetters[filterType](undefined, undefined);
    });
  }, [enabledFilters, filterSetters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return enabledFilters.some(filterType => {
      const filters = allFilters[filterType];
      return (filters.include && filters.include.length > 0) || 
             (filters.exclude && filters.exclude.length > 0);
    });
  }, [allFilters, enabledFilters]);

  // Get filter strings for API calls (memoized for performance)
  const filterStrings = useMemo(() => {
    const result: Record<string, string> = {};
    
    enabledFilters.forEach(filterType => {
      const filters = allFilters[filterType];
      if (filters.include && filters.include.length > 0) {
        result[`include${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`] = filters.include.join(',');
      }
      if (filters.exclude && filters.exclude.length > 0) {
        result[`exclude${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`] = filters.exclude.join(',');
      }
    });
    
    return result;
  }, [allFilters, enabledFilters]);

  return {
    // Filter state
    allFilters,
    hasActiveFilters,
    filterStrings,
    enabledFilters,
    
    // Filter management
    getFilterItems,
    updateFilters,
    removeFilter,
    clearAllFilters,
    
    // Configuration
    FILTER_CONFIGS,
  };
};
