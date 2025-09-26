import React, { useState, useEffect } from "react";

interface ExportData {
  images: number[];
  exportName: string;
  exportType: string;
}

interface CharacterFilter {
  id: number;
  name: string;
  type: 'include' | 'exclude';
}

interface TagFilter {
  id: number;
  name: string;
  type: 'include' | 'exclude';
}

interface ImageControlsBarProps {
  // Sorting controls
  sortBy: string;
  onSortChange: (sort: string) => void;
  
  // Pagination controls
  itemsPerPage: number;
  onItemsPerPageChange: (limit: number) => void;
  
  // Image size controls
  imageSize: 'small' | 'medium' | 'large';
  onImageSizeChange: (size: 'small' | 'medium' | 'large') => void;
  
  // Filter controls
  characterFilters?: CharacterFilter[];
  onCharacterFiltersChange?: (filters: CharacterFilter[]) => void;
  tagFilters?: TagFilter[];
  onTagFiltersChange?: (filters: TagFilter[]) => void;
  
  // Export controls
  exportData?: ExportData;
  onExport?: () => void;
  
  // Optional: disable certain controls
  showSortControls?: boolean;
  showPaginationControls?: boolean;
  showImageSizeControls?: boolean;
  showFilterControls?: boolean;
  showExportControls?: boolean;
}

const ImageControlsBar: React.FC<ImageControlsBarProps> = ({
  sortBy,
  onSortChange,
  itemsPerPage,
  onItemsPerPageChange,
  imageSize,
  onImageSizeChange,
  characterFilters = [],
  onCharacterFiltersChange,
  tagFilters = [],
  onTagFiltersChange,
  exportData,
  onExport,
  showSortControls = true,
  showPaginationControls = true,
  showImageSizeControls = true,
  showFilterControls = true,
  showExportControls = true,
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [characterSearch, setCharacterSearch] = useState("");
  const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    if (showCharacterModal) {
      const fetchCharacters = async () => {
        try {
          setLoadingCharacters(true);
          const response = await fetch('/api/categories/characters');
          if (response.ok) {
            const data = await response.json();
            // The API returns { tags: [...] } not a direct array
            const charactersArray = Array.isArray(data.tags) ? data.tags : [];
            setAvailableCharacters(charactersArray);
          } else {
            console.error('Failed to fetch characters, status:', response.status);
            setAvailableCharacters([]);
          }
        } catch (error) {
          console.error('Failed to fetch characters:', error);
          setAvailableCharacters([]);
        } finally {
          setLoadingCharacters(false);
        }
      };
      fetchCharacters();
    }
  }, [showCharacterModal]);

  useEffect(() => {
    if (showTagModal) {
      const fetchTags = async () => {
        try {
          setLoadingTags(true);
          const response = await fetch('/api/categories/tags');
          if (response.ok) {
            const data = await response.json();
            // The API returns { tags: [...] } not a direct array
            const tagsArray = Array.isArray(data.tags) ? data.tags : [];
            setAvailableTags(tagsArray);
          } else {
            console.error('Failed to fetch tags, status:', response.status);
            setAvailableTags([]);
          }
        } catch (error) {
          console.error('Failed to fetch tags:', error);
          setAvailableTags([]);
        } finally {
          setLoadingTags(false);
        }
      };
      fetchTags();
    }
  }, [showTagModal]);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-gray-800 rounded-lg">
      {/* Sort By Dropdown - Compact */}
      {showSortControls && (
        <div className="flex items-center gap-1">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 text-sm rounded border border-gray-600 focus:border-pink-500 focus:outline-none"
          >
            <option value="random">Random</option>
            <option value="date_desc">Date (Newest)</option>
            <option value="date_asc">Date (Oldest)</option>
            <option value="rating_desc">Rating (High to Low)</option>
            <option value="rating_asc">Rating (Low to High)</option>
            <option value="likes_desc">Likes (High to Low)</option>
            <option value="likes_asc">Likes (Low to High)</option>
          </select>
        </div>
      )}

      {/* Items Per Page Dropdown - Compact */}
      {showPaginationControls && (
        <div className="flex items-center gap-1">
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="bg-gray-700 text-white px-2 py-1 text-sm rounded border border-gray-600 focus:border-pink-500 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={40}>40</option>
            <option value={60}>60</option>
            <option value={100}>100</option>
            <option value={1000}>1000</option>
          </select>
        </div>
      )}

      {/* Image Size Slider - Compact */}
      {showImageSizeControls && (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="2"
            step="1"
            value={imageSize === 'small' ? 0 : imageSize === 'medium' ? 1 : 2}
            onChange={(e) => {
              const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
              onImageSizeChange(sizes[Number(e.target.value)]);
            }}
            className="w-16 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      )}

      {/* Filter Dropdown */}
      {showFilterControls && (
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-1 bg-gray-700 text-white px-2 py-1 text-sm rounded border border-gray-600 hover:border-pink-500 focus:border-pink-500 focus:outline-none"
          >
            <span>Filter</span>
            <span className="text-xs">▼</span>
          </button>
          
          {showFilterDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-10 min-w-32">
              <button
                onClick={() => {
                  setShowCharacterModal(true);
                  setShowFilterDropdown(false);
                }}
                className="w-full text-left px-3 py-2 text-white text-sm hover:bg-gray-600"
              >
                Character
              </button>
              <button
                onClick={() => {
                  setShowTagModal(true);
                  setShowFilterDropdown(false);
                }}
                className="w-full text-left px-3 py-2 text-white text-sm hover:bg-gray-600"
              >
                Tags
              </button>
            </div>
          )}
        </div>
      )}

      {/* Export Button */}
      {showExportControls && exportData && exportData.images.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded border border-green-500 focus:border-green-400 focus:outline-none transition-colors"
          >
            Export ({exportData.images.length})
          </button>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && exportData && onExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Export Images</h3>
            
            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                Export <span className="font-semibold text-white">{exportData.images.length}</span> images from:
              </p>
              <p className="text-lg font-semibold text-blue-400">
                {exportData.exportName}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Type: {exportData.exportType}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 text-sm mb-2">
                Images will be exported to: <code className="bg-gray-700 px-2 py-1 rounded text-green-400">
                  exports/{exportData.exportType === 'album' ? exportData.exportName.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_') : `${exportData.exportType}__${exportData.exportName.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_')}`}
                </code>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                <strong>Note:</strong> Only new images will be exported if the directory already exists.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  onExport();
                  setShowExportModal(false);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                Export Images
              </button>
              
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Filter Modal */}
      {showCharacterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Character Filter</h2>
              <button
                onClick={() => setShowCharacterModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Current Filters */}
            {characterFilters.length > 0 && (
              <div className="mb-4">
                <h4 className="text-white text-sm font-medium mb-2">Current Filters:</h4>
                <div className="flex flex-wrap gap-2">
                  {characterFilters.map((filter, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                        filter.type === 'include' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {filter.type === 'include' ? 'Include' : 'Exclude'}: {filter.name}
                      <button
                        onClick={() => {
                          const newFilters = characterFilters.filter((_, i) => i !== index);
                          onCharacterFiltersChange?.(newFilters);
                        }}
                        className="ml-1 hover:bg-black hover:bg-opacity-20 rounded"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search characters..."
                value={characterSearch}
                onChange={(e) => setCharacterSearch(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Fixed height content area */}
            <div className="flex-1 overflow-hidden">
              {loadingCharacters && (
                <div className="text-center text-gray-400 py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
                  <p className="mt-2">Loading characters...</p>
                </div>
              )}

              {!loadingCharacters && Array.isArray(availableCharacters) && availableCharacters.length > 0 && (
                <div className="h-full flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Characters ({availableCharacters.length} total):</h3>
                  <div className="flex-1 overflow-y-auto space-y-1">
                    {availableCharacters
                      .filter(char => 
                        !characterSearch || char.name.toLowerCase().includes(characterSearch.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((character) => (
                        <div key={character.id} className="flex items-center justify-between p-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm">
                          <span>{character.name}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                const newFilter: CharacterFilter = {
                                  id: character.id,
                                  name: character.name,
                                  type: 'include'
                                };
                                const newFilters = [...characterFilters.filter(f => f.id !== character.id), newFilter];
                                onCharacterFiltersChange?.(newFilters);
                                setCharacterSearch("");
                              }}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                            >
                              Include
                            </button>
                            <button
                              onClick={() => {
                                const newFilter: CharacterFilter = {
                                  id: character.id,
                                  name: character.name,
                                  type: 'exclude'
                                };
                                const newFilters = [...characterFilters.filter(f => f.id !== character.id), newFilter];
                                onCharacterFiltersChange?.(newFilters);
                                setCharacterSearch("");
                              }}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                            >
                              Exclude
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {!loadingCharacters && availableCharacters.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <p>No characters available</p>
                  <p className="text-sm mt-1">Check console for errors</p>
                  <p className="text-xs mt-1 text-blue-400">Debug: {JSON.stringify({
                    loading: loadingCharacters,
                    count: availableCharacters.length,
                    isArray: Array.isArray(availableCharacters),
                    firstChar: availableCharacters[0]?.name || 'none',
                    timestamp: Date.now()
                  })}</p>
                  <button 
                    onClick={() => {
                      console.log('Force refresh - current state:', availableCharacters);
                      setAvailableCharacters([...availableCharacters]);
                    }}
                    className="mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded"
                  >
                    Force Refresh
                  </button>
                </div>
              )}

            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowCharacterModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Filter Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Tag Filter</h2>
              <button
                onClick={() => setShowTagModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Current Filters */}
            {tagFilters.length > 0 && (
              <div className="mb-4">
                <h4 className="text-white text-sm font-medium mb-2">Current Filters:</h4>
                <div className="flex flex-wrap gap-2">
                  {tagFilters.map((filter, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                        filter.type === 'include' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-orange-600 text-white'
                      }`}
                    >
                      {filter.type === 'include' ? 'Include' : 'Exclude'}: {filter.name}
                      <button
                        onClick={() => {
                          const newFilters = tagFilters.filter((_, i) => i !== index);
                          onTagFiltersChange?.(newFilters);
                        }}
                        className="ml-1 hover:bg-black hover:bg-opacity-20 rounded"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Fixed height content area */}
            <div className="flex-1 overflow-hidden">
              {loadingTags && (
                <div className="text-center text-gray-400 py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
                  <p className="mt-2">Loading tags...</p>
                </div>
              )}

              {!loadingTags && Array.isArray(availableTags) && availableTags.length > 0 && (
                <div className="h-full flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Tags ({availableTags.length} total):</h3>
                  <div className="flex-1 overflow-y-auto space-y-1">
                    {availableTags
                      .filter(tag => 
                        !tagSearch || tag.name.toLowerCase().includes(tagSearch.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((tag) => (
                        <div key={tag.id} className="flex items-center justify-between p-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm">
                          <span>{tag.name}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                const newFilter: TagFilter = {
                                  id: tag.id,
                                  name: tag.name,
                                  type: 'include'
                                };
                                const newFilters = [...tagFilters.filter(f => f.id !== tag.id), newFilter];
                                onTagFiltersChange?.(newFilters);
                                setTagSearch("");
                              }}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                            >
                              Include
                            </button>
                            <button
                              onClick={() => {
                                const newFilter: TagFilter = {
                                  id: tag.id,
                                  name: tag.name,
                                  type: 'exclude'
                                };
                                const newFilters = [...tagFilters.filter(f => f.id !== tag.id), newFilter];
                                onTagFiltersChange?.(newFilters);
                                setTagSearch("");
                              }}
                              className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded"
                            >
                              Exclude
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {!loadingTags && availableTags.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <p>No tags available</p>
                  <p className="text-sm mt-1">Check console for errors</p>
                  <p className="text-xs mt-1 text-blue-400">Debug: {JSON.stringify({
                    loading: loadingTags,
                    count: availableTags.length,
                    isArray: Array.isArray(availableTags),
                    firstTag: availableTags[0]?.name || 'none',
                    timestamp: Date.now()
                  })}</p>
                  <button 
                    onClick={() => {
                      console.log('Force refresh - current state:', availableTags);
                      setAvailableTags([...availableTags]);
                    }}
                    className="mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded"
                  >
                    Force Refresh
                  </button>
                </div>
              )}

            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowTagModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageControlsBar;
