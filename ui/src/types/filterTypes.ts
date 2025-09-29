/**
 * Unified filter type definitions for FilterableGalleryPage
 */

export interface FilterItem {
  id: number;
  name: string;
  type: 'include' | 'exclude';
}

export interface FilterConfig {
  apiEndpoint: string;
  includeColor: string;
  excludeColor: string;
  includeHoverColor: string;
  excludeHoverColor: string;
  displayName: string;
  searchPlaceholder: string;
}

export type FilterType = 'characters' | 'tags' | 'explicitness' | 'series' | 'artists';

export const FILTER_CONFIGS: Record<FilterType, FilterConfig> = {
  characters: {
    apiEndpoint: '/api/categories/characters',
    includeColor: 'bg-green-600',
    excludeColor: 'bg-red-600',
    includeHoverColor: 'hover:bg-green-700',
    excludeHoverColor: 'hover:bg-red-700',
    displayName: 'Character',
    searchPlaceholder: 'Search characters...',
  },
  tags: {
    apiEndpoint: '/api/categories/tags',
    includeColor: 'bg-blue-600',
    excludeColor: 'bg-orange-600',
    includeHoverColor: 'hover:bg-blue-700',
    excludeHoverColor: 'hover:bg-orange-700',
    displayName: 'Tags',
    searchPlaceholder: 'Search tags...',
  },
  explicitness: {
    apiEndpoint: '/api/categories/explicitness',
    includeColor: 'bg-purple-600',
    excludeColor: 'bg-pink-600',
    includeHoverColor: 'hover:bg-purple-700',
    excludeHoverColor: 'hover:bg-pink-700',
    displayName: 'Explicitness',
    searchPlaceholder: 'Search explicitness levels...',
  },
  series: {
    apiEndpoint: '/api/categories/series',
    includeColor: 'bg-indigo-600',
    excludeColor: 'bg-yellow-600',
    includeHoverColor: 'hover:bg-indigo-700',
    excludeHoverColor: 'hover:bg-yellow-700',
    displayName: 'Series',
    searchPlaceholder: 'Search series...',
  },
  artists: {
    apiEndpoint: '/api/categories/artists',
    includeColor: 'bg-teal-600',
    excludeColor: 'bg-rose-600',
    includeHoverColor: 'hover:bg-teal-700',
    excludeHoverColor: 'hover:bg-rose-700',
    displayName: 'Artists',
    searchPlaceholder: 'Search artists...',
  },
};

export interface FilterState {
  include?: string[];
  exclude?: string[];
}

export type AllFilters = Record<FilterType, FilterState>;
