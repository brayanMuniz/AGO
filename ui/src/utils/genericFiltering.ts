// Generic filtering system to quickly add new filter types in a DRY way

export interface FilterConfig {
  name: string;           // Display name (e.g., "Characters", "Series")
  icon: string;          // Icon for UI (e.g., "👤", "📺")
  apiEndpoint: string;   // API endpoint to fetch options (e.g., "/api/categories/characters")
  urlParam: string;      // URL parameter prefix (e.g., "characters", "series")
  category: string;      // Backend category (e.g., "character", "copyright")
  colors: {
    include: string;     // Tailwind class for include pills (e.g., "bg-green-600")
    exclude: string;     // Tailwind class for exclude pills (e.g., "bg-red-600")
  };
}

// Predefined filter configurations
export const FILTER_CONFIGS: Record<string, FilterConfig> = {
  characters: {
    name: "Characters",
    icon: "👤",
    apiEndpoint: "/api/categories/characters",
    urlParam: "characters",
    category: "character",
    colors: {
      include: "bg-green-600",
      exclude: "bg-red-600",
    },
  },
  tags: {
    name: "Tags",
    icon: "🏷️",
    apiEndpoint: "/api/categories/tags",
    urlParam: "tags",
    category: "general",
    colors: {
      include: "bg-blue-600",
      exclude: "bg-orange-600",
    },
  },
  explicitness: {
    name: "Explicitness",
    icon: "🔞",
    apiEndpoint: "/api/categories/ratings",
    urlParam: "explicitness",
    category: "rating",
    colors: {
      include: "bg-purple-600",
      exclude: "bg-pink-600",
    },
  },
  series: {
    name: "Series",
    icon: "📺",
    apiEndpoint: "/api/categories/series",
    urlParam: "series",
    category: "copyright",
    colors: {
      include: "bg-indigo-600",
      exclude: "bg-yellow-600",
    },
  },
  artists: {
    name: "Artists",
    icon: "🎨",
    apiEndpoint: "/api/categories/artists",
    urlParam: "artists",
    category: "artist",
    colors: {
      include: "bg-teal-600",
      exclude: "bg-rose-600",
    },
  },
};

// Type definitions for generic filtering
export type FilterType = keyof typeof FILTER_CONFIGS;

export interface FilterState {
  include: string[] | undefined;
  exclude: string[] | undefined;
}

export interface FilterHandlers {
  setFilters: (include: string[] | undefined, exclude: string[] | undefined) => void;
  handleRemove: (filterName: string, type: 'include' | 'exclude') => void;
}

// Generic filter data structure for components
export type GenericFilterData = {
  [K in FilterType]: FilterState;
};

export type GenericFilterHandlers = {
  [K in FilterType]: FilterHandlers;
};

/**
 * Generate URL parameter names for a filter type
 */
export function getFilterUrlParams(filterType: FilterType) {
  const config = FILTER_CONFIGS[filterType];
  return {
    include: `include_${config.urlParam}`,
    exclude: `exclude_${config.urlParam}`,
  };
}

/**
 * Generate backend parameter names for API calls
 */
export function getFilterApiParams(filterType: FilterType) {
  const config = FILTER_CONFIGS[filterType];
  return {
    include: `include${config.name}`,
    exclude: `exclude${config.name}`,
  };
}

/**
 * Create filter utility functions for backend integration
 */
export function createFilterUtilityFunctions(filterType: FilterType) {
  const config = FILTER_CONFIGS[filterType];
  
  return {
    // For utils/filters.go
    buildFilterCondition: `Build${config.name.slice(0, -1)}FilterCondition`,
    
    // For utils/params.go  
    parseArrayFunction: `parse${config.name}Arrays`,
    
    // URL parameter names
    urlParams: getFilterUrlParams(filterType),
    
    // API parameter names
    apiParams: getFilterApiParams(filterType),
  };
}

/**
 * Generate filter modal props for ImageControlsBar
 */
export function createFilterModalProps(filterType: FilterType) {
  const config = FILTER_CONFIGS[filterType];
  
  return {
    modalStateKey: `show${config.name}Modal`,
    searchStateKey: `${filterType}Search`,
    availableItemsKey: `available${config.name}`,
    fetchFunction: `fetch${config.name}`,
    onFiltersChangeHandler: `on${config.name}FiltersChange`,
  };
}

/**
 * Generate the complete filter integration code for a new filter type
 */
export function generateFilterIntegration(filterType: FilterType): {
  urlParamsAddition: string;
  backendUtilityAddition: string;
  frontendModalAddition: string;
  filterHandlerAddition: string;
} {
  const config = FILTER_CONFIGS[filterType];
  const urlParams = getFilterUrlParams(filterType);
  const apiParams = getFilterApiParams(filterType);
  
  return {
    // For useUrlParams.ts
    urlParamsAddition: `
  ${urlParams.include}?: string[]; // ${config.name} to include
  ${urlParams.exclude}?: string[]; // ${config.name} to exclude`,

    // For utils/filters.go
    backendUtilityAddition: `
/**
 * Build${config.name.slice(0, -1)}FilterCondition creates filter condition for ${filterType}
 */
func Build${config.name.slice(0, -1)}FilterCondition(${filterType} []string, include bool) FilterCondition {
    return BuildTagFilterCondition(${filterType}, "${config.category}", include)
}`,

    // For ImageControlsBar.tsx modal
    frontendModalAddition: `
    <button onClick={() => setShow${config.name}Modal(true)}>
      ${config.icon} ${config.name}
    </button>`,

    // For filter handlers
    filterHandlerAddition: `
  ${filterType}: {
    include: include${config.name},
    exclude: exclude${config.name},
    setFilters: set${config.name}Filters,
  },`,
  };
}

/**
 * Helper to get all filter types as array
 */
export const ALL_FILTER_TYPES: FilterType[] = Object.keys(FILTER_CONFIGS) as FilterType[];

/**
 * Helper to get enabled filter types (useful for feature flags)
 */
export function getEnabledFilterTypes(): FilterType[] {
  // For now, return all. Later can be made configurable
  return ALL_FILTER_TYPES;
}

/**
 * Validate if a filter type is supported
 */
export function isValidFilterType(filterType: string): filterType is FilterType {
  return filterType in FILTER_CONFIGS;
}

/**
 * Get filter configuration by type
 */
export function getFilterConfig(filterType: FilterType): FilterConfig {
  return FILTER_CONFIGS[filterType];
}
