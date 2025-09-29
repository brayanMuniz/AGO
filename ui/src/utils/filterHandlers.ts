// Generic filter handler utility to eliminate filter removal duplication

export type FilterType = 'include' | 'exclude';

/**
 * Generic filter handler that works with any filter type
 * @param filterName - The name of the filter item to remove
 * @param type - Whether to remove from 'include' or 'exclude' filters
 * @param includeFilters - Current include filters array
 * @param excludeFilters - Current exclude filters array
 * @param setFilters - Function to update both include and exclude filters
 * @returns void
 */
export function createFilterRemoveHandler<T>(
  includeFilters: T[] | undefined,
  excludeFilters: T[] | undefined,
  setFilters: (include: T[] | undefined, exclude: T[] | undefined) => void
) {
  return (filterName: T, type: FilterType) => {
    if (type === 'include') {
      const newInclude = includeFilters?.filter(item => item !== filterName) || [];
      setFilters(newInclude.length > 0 ? newInclude : undefined, excludeFilters);
    } else {
      const newExclude = excludeFilters?.filter(item => item !== filterName) || [];
      setFilters(includeFilters, newExclude.length > 0 ? newExclude : undefined);
    }
  };
}

/**
 * Generic clear all filters handler
 * @param setFilters - Function to update both include and exclude filters
 * @returns Function that clears all filters
 */
export function createClearAllFiltersHandler(
  setFilters: (include: undefined, exclude: undefined) => void
) {
  return () => {
    setFilters(undefined, undefined);
  };
}

/**
 * Convenience function to create multiple filter handlers at once
 * @param filterConfigs - Object with filter configurations
 * @returns Object with handler functions for each filter type
 */
export function createFilterHandlers(filterConfigs: Record<string, {
  include: any[] | undefined;
  exclude: any[] | undefined;
  setFilters: (include: any[] | undefined, exclude: any[] | undefined) => void;
}>) {
  const handlers: Record<string, (filterName: any, type: FilterType) => void> = {};
  
  for (const [key, config] of Object.entries(filterConfigs)) {
    handlers[key] = createFilterRemoveHandler(
      config.include,
      config.exclude,
      config.setFilters
    );
  }
  
  return handlers;
}

/**
 * Specialized handlers for common filter types
 */
export const FilterHandlers = {
  /**
   * Create character filter remove handler
   */
  character: (
    includeCharacters: string[] | undefined,
    excludeCharacters: string[] | undefined,
    setCharacterFilters: (include: string[] | undefined, exclude: string[] | undefined) => void
  ) => createFilterRemoveHandler(includeCharacters, excludeCharacters, setCharacterFilters),

  /**
   * Create tag filter remove handler
   */
  tag: (
    includeTags: string[] | undefined,
    excludeTags: string[] | undefined,
    setTagFilters: (include: string[] | undefined, exclude: string[] | undefined) => void
  ) => createFilterRemoveHandler(includeTags, excludeTags, setTagFilters),

  /**
   * Create explicitness filter remove handler
   */
  explicitness: (
    includeExplicitness: string[] | undefined,
    excludeExplicitness: string[] | undefined,
    setExplicitnessFilters: (include: string[] | undefined, exclude: string[] | undefined) => void
  ) => createFilterRemoveHandler(includeExplicitness, excludeExplicitness, setExplicitnessFilters),
};

/**
 * Hook-style utility for creating all filter handlers at once
 * @param filters - Object containing all filter states and setters
 * @returns Object with all filter removal handlers
 */
export function useFilterHandlers(filters: {
  characters: {
    include: string[] | undefined;
    exclude: string[] | undefined;
    setFilters: (include: string[] | undefined, exclude: string[] | undefined) => void;
  };
  tags: {
    include: string[] | undefined;
    exclude: string[] | undefined;
    setFilters: (include: string[] | undefined, exclude: string[] | undefined) => void;
  };
  explicitness: {
    include: string[] | undefined;
    exclude: string[] | undefined;
    setFilters: (include: string[] | undefined, exclude: string[] | undefined) => void;
  };
}) {
  return {
    handleRemoveCharacterFilter: FilterHandlers.character(
      filters.characters.include,
      filters.characters.exclude,
      filters.characters.setFilters
    ),
    handleRemoveTagFilter: FilterHandlers.tag(
      filters.tags.include,
      filters.tags.exclude,
      filters.tags.setFilters
    ),
    handleRemoveExplicitnessFilter: FilterHandlers.explicitness(
      filters.explicitness.include,
      filters.explicitness.exclude,
      filters.explicitness.setFilters
    ),
    handleClearAllFilters: () => {
      filters.characters.setFilters(undefined, undefined);
      filters.tags.setFilters(undefined, undefined);
      filters.explicitness.setFilters(undefined, undefined);
    },
  };
}
