import React from "react";

interface FilterDisplayProps {
  includeCharacters?: string[];
  excludeCharacters?: string[];
  onRemoveCharacterFilter?: (characterName: string, type: 'include' | 'exclude') => void;
  onClearAllFilters?: () => void;
}

const FilterDisplay: React.FC<FilterDisplayProps> = ({
  includeCharacters = [],
  excludeCharacters = [],
  onRemoveCharacterFilter,
  onClearAllFilters,
}) => {
  const hasFilters = includeCharacters.length > 0 || excludeCharacters.length > 0;

  if (!hasFilters) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white text-sm font-medium">Active Filters:</h3>
        {onClearAllFilters && (
          <button
            onClick={onClearAllFilters}
            className="text-gray-400 hover:text-white text-xs"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {/* Include Character Filters */}
        {includeCharacters.map((character) => (
          <span
            key={`include-${character}`}
            className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-green-600 text-white"
          >
            Include: {character}
            {onRemoveCharacterFilter && (
              <button
                onClick={() => onRemoveCharacterFilter(character, 'include')}
                className="ml-1 hover:bg-black hover:bg-opacity-20 rounded"
              >
                ×
              </button>
            )}
          </span>
        ))}

        {/* Exclude Character Filters */}
        {excludeCharacters.map((character) => (
          <span
            key={`exclude-${character}`}
            className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-red-600 text-white"
          >
            Exclude: {character}
            {onRemoveCharacterFilter && (
              <button
                onClick={() => onRemoveCharacterFilter(character, 'exclude')}
                className="ml-1 hover:bg-black hover:bg-opacity-20 rounded"
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

export default FilterDisplay;
