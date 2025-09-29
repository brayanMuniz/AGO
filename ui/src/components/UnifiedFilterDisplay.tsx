/**
 * Unified filter display component that automatically shows all active filters
 */

import React from 'react';
import type { FilterType } from '../types/filterTypes';
import { FILTER_CONFIGS } from '../types/filterTypes';
import { useUnifiedFilters } from '../hooks/useUnifiedFilters';

interface UnifiedFilterDisplayProps {
  enabledFilters?: FilterType[];
  className?: string;
}

const UnifiedFilterDisplay: React.FC<UnifiedFilterDisplayProps> = ({
  enabledFilters = ['characters', 'tags', 'explicitness', 'series', 'artists'],
  className = '',
}) => {
  const {
    allFilters,
    hasActiveFilters,
    removeFilter,
    clearAllFilters,
    FILTER_CONFIGS,
  } = useUnifiedFilters({ enabledFilters });

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className={`mb-4 p-3 bg-gray-800 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white text-sm font-medium">Active Filters:</h3>
        <button
          onClick={clearAllFilters}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Clear All
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {enabledFilters.map(filterType => {
          const filters = allFilters[filterType];
          const config = FILTER_CONFIGS[filterType];
          const items: React.ReactElement[] = [];

          // Include filters
          if (filters.include && filters.include.length > 0) {
            filters.include.forEach(name => {
              items.push(
                <span
                  key={`include-${filterType}-${name}`}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${config.includeColor} text-white`}
                >
                  Include {config.displayName}: {name}
                  <button
                    onClick={() => removeFilter(filterType, name, 'include')}
                    className="ml-1 hover:bg-black hover:bg-opacity-20 rounded"
                  >
                    ×
                  </button>
                </span>
              );
            });
          }

          // Exclude filters
          if (filters.exclude && filters.exclude.length > 0) {
            filters.exclude.forEach(name => {
              items.push(
                <span
                  key={`exclude-${filterType}-${name}`}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${config.excludeColor} text-white`}
                >
                  Exclude {config.displayName}: {name}
                  <button
                    onClick={() => removeFilter(filterType, name, 'exclude')}
                    className="ml-1 hover:bg-black hover:bg-opacity-20 rounded"
                  >
                    ×
                  </button>
                </span>
              );
            });
          }

          return items;
        })}
      </div>
    </div>
  );
};

export default UnifiedFilterDisplay;
