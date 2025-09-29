import React from "react";

interface FilterDisplayProps {
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
  onRemoveCharacterFilter?: (characterName: string, type: 'include' | 'exclude') => void;
  onRemoveTagFilter?: (tagName: string, type: 'include' | 'exclude') => void;
  onRemoveExplicitnessFilter?: (explicitnessLevel: string, type: 'include' | 'exclude') => void;
  onRemoveSeriesFilter?: (seriesName: string, type: 'include' | 'exclude') => void;
  onRemoveArtistFilter?: (artistName: string, type: 'include' | 'exclude') => void;
  onClearAllFilters?: () => void;
}

const FilterDisplay: React.FC<FilterDisplayProps> = ({
  includeCharacters = [],
  excludeCharacters = [],
  includeTags = [],
  excludeTags = [],
  includeExplicitness = [],
  excludeExplicitness = [],
  includeSeries = [],
  excludeSeries = [],
  includeArtists = [],
  excludeArtists = [],
  onRemoveCharacterFilter,
  onRemoveTagFilter,
  onRemoveExplicitnessFilter,
  onRemoveSeriesFilter,
  onRemoveArtistFilter,
  onClearAllFilters,
}) => {
  const hasFilters = includeCharacters.length > 0 || excludeCharacters.length > 0 || 
                     includeTags.length > 0 || excludeTags.length > 0 ||
                     includeExplicitness.length > 0 || excludeExplicitness.length > 0 ||
                     includeSeries.length > 0 || excludeSeries.length > 0 ||
                     includeArtists.length > 0 || excludeArtists.length > 0;

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

        {/* Include Tag Filters */}
        {includeTags.map((tag) => (
          <span
            key={`include-tag-${tag}`}
            className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-blue-600 text-white"
          >
            Include Tag: {tag}
            {onRemoveTagFilter && (
              <button
                onClick={() => onRemoveTagFilter(tag, 'include')}
                className="ml-1 hover:bg-black hover:bg-opacity-20 rounded"
              >
                ×
              </button>
            )}
          </span>
        ))}

        {/* Exclude Tag Filters */}
        {excludeTags.map((tag) => (
          <span
            key={`exclude-tag-${tag}`}
            className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-orange-600 text-white"
          >
            Exclude Tag: {tag}
            {onRemoveTagFilter && (
              <button
                onClick={() => onRemoveTagFilter(tag, 'exclude')}
                className="ml-1 hover:bg-black hover:bg-opacity-20 rounded"
              >
                ×
              </button>
            )}
          </span>
        ))}

        {/* Include Explicitness Filters */}
        {includeExplicitness.map((level) => (
          <span
            key={`include-explicitness-${level}`}
            className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-purple-600 text-white"
          >
            Include: {level}
            {onRemoveExplicitnessFilter && (
              <button
                onClick={() => onRemoveExplicitnessFilter(level, 'include')}
                className="ml-1 hover:bg-black hover:bg-opacity-20 rounded"
              >
                ×
              </button>
            )}
          </span>
        ))}

        {/* Exclude Explicitness Filters */}
        {excludeExplicitness.map((level) => (
          <span
            key={`exclude-explicitness-${level}`}
            className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-pink-600 text-white"
          >
            Exclude: {level}
            {onRemoveExplicitnessFilter && (
              <button
                onClick={() => onRemoveExplicitnessFilter(level, 'exclude')}
                className="ml-1 hover:bg-black hover:bg-opacity-20 rounded"
              >
                ×
              </button>
            )}
          </span>
        ))}

        {/* Include Series Filters */}
        {includeSeries.map((series) => (
          <span
            key={`include-series-${series}`}
            className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-indigo-600 text-white"
          >
            Include Series: {series}
            {onRemoveSeriesFilter && (
              <button
                onClick={() => onRemoveSeriesFilter(series, 'include')}
                className="ml-1 hover:bg-black hover:bg-opacity-20 rounded"
              >
                ×
              </button>
            )}
          </span>
        ))}

        {/* Exclude Series Filters */}
        {excludeSeries.map((series) => (
          <span
            key={`exclude-series-${series}`}
            className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-yellow-600 text-white"
          >
            Exclude Series: {series}
            {onRemoveSeriesFilter && (
              <button
                onClick={() => onRemoveSeriesFilter(series, 'exclude')}
                className="ml-1 hover:bg-black hover:bg-opacity-20 rounded"
              >
                ×
              </button>
            )}
          </span>
        ))}

        {/* Include Artist Filters */}
        {includeArtists.map((artist) => (
          <span
            key={`include-artist-${artist}`}
            className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-teal-600 text-white"
          >
            Include Artist: {artist}
            {onRemoveArtistFilter && (
              <button
                onClick={() => onRemoveArtistFilter(artist, 'include')}
                className="ml-1 hover:bg-black hover:bg-opacity-20 rounded"
              >
                ×
              </button>
            )}
          </span>
        ))}

        {/* Exclude Artist Filters */}
        {excludeArtists.map((artist) => (
          <span
            key={`exclude-artist-${artist}`}
            className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-rose-600 text-white"
          >
            Exclude Artist: {artist}
            {onRemoveArtistFilter && (
              <button
                onClick={() => onRemoveArtistFilter(artist, 'exclude')}
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
