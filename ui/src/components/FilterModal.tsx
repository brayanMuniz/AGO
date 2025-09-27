import React, { useState, useEffect } from 'react';

export interface FilterItem {
  id: number;
  name: string;
  type: 'include' | 'exclude';
}

export interface FilterOption {
  id: number;
  name: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  searchPlaceholder: string;
  apiEndpoint: string;
  currentFilters: FilterItem[];
  onFiltersChange: (filters: FilterItem[]) => void;
  includeButtonColor?: string;
  excludeButtonColor?: string;
  includeButtonHoverColor?: string;
  excludeButtonHoverColor?: string;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  title,
  searchPlaceholder,
  apiEndpoint,
  currentFilters,
  onFiltersChange,
  includeButtonColor = 'bg-green-600',
  excludeButtonColor = 'bg-red-600',
  includeButtonHoverColor = 'hover:bg-green-700',
  excludeButtonHoverColor = 'hover:bg-red-700',
}) => {
  const [search, setSearch] = useState('');
  const [availableOptions, setAvailableOptions] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch options when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchOptions = async () => {
        setLoading(true);
        try {
          const response = await fetch(apiEndpoint);
          if (response.ok) {
            const data = await response.json();
            // Handle different API response formats
            const options = Array.isArray(data) ? data : (data.tags || data.characters || []);
            setAvailableOptions(options);
          } else {
            console.error(`Failed to fetch from ${apiEndpoint}`);
            setAvailableOptions([]);
          }
        } catch (error) {
          console.error(`Error fetching from ${apiEndpoint}:`, error);
          setAvailableOptions([]);
        } finally {
          setLoading(false);
        }
      };
      fetchOptions();
    }
  }, [isOpen, apiEndpoint]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const handleAddFilter = (optionName: string, type: 'include' | 'exclude') => {
    const existingFilter = currentFilters.find(f => f.name === optionName);
    
    if (existingFilter) {
      // Update existing filter type
      const updatedFilters = currentFilters.map(f =>
        f.name === optionName ? { ...f, type } : f
      );
      onFiltersChange(updatedFilters);
    } else {
      // Add new filter
      const newFilter: FilterItem = {
        id: Date.now(), // Simple ID generation
        name: optionName,
        type,
      };
      onFiltersChange([...currentFilters, newFilter]);
    }
  };

  const handleRemoveFilter = (optionName: string) => {
    const updatedFilters = currentFilters.filter(f => f.name !== optionName);
    onFiltersChange(updatedFilters);
  };

  const filteredOptions = availableOptions.filter(option =>
    option.name.toLowerCase().includes(search.toLowerCase())
  );

  const getFilterType = (optionName: string): 'include' | 'exclude' | null => {
    const filter = currentFilters.find(f => f.name === optionName);
    return filter ? filter.type : null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 h-[500px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Current Filters Display */}
        {currentFilters.length > 0 && (
          <div className="mb-4">
            <p className="text-white text-sm font-medium mb-2">Current Filters:</p>
            <div className="flex flex-wrap gap-2">
              {currentFilters.map((filter) => (
                <span
                  key={`${filter.type}-${filter.name}`}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 text-white ${
                    filter.type === 'include' ? includeButtonColor : excludeButtonColor
                  }`}
                >
                  {filter.type === 'include' ? '✓' : '✗'} {filter.name}
                  <button
                    onClick={() => handleRemoveFilter(filter.name)}
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
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none mb-4"
          autoFocus
        />

        {/* Options List */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
          
          {!loading && filteredOptions.length > 0 && (
            <div className="h-full overflow-y-auto">
              <div className="space-y-2">
                {filteredOptions.slice(0, 50).map((option) => {
                  const filterType = getFilterType(option.name);
                  return (
                    <div
                      key={option.id}
                      className="flex items-center justify-between p-2 bg-gray-700 rounded hover:bg-gray-600"
                    >
                      <span className="text-white flex-1">{option.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddFilter(option.name, 'include')}
                          className={`px-3 py-1 rounded text-xs text-white transition-colors ${includeButtonColor} ${includeButtonHoverColor} ${
                            filterType === 'include' ? 'ring-2 ring-white' : ''
                          }`}
                        >
                          Include
                        </button>
                        <button
                          onClick={() => handleAddFilter(option.name, 'exclude')}
                          className={`px-3 py-1 rounded text-xs text-white transition-colors ${excludeButtonColor} ${excludeButtonHoverColor} ${
                            filterType === 'exclude' ? 'ring-2 ring-white' : ''
                          }`}
                        >
                          Exclude
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {!loading && filteredOptions.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">
                {availableOptions.length === 0 ? 'No options available' : 'No matching options found'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-600">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
