import React, { useState, useEffect, useMemo } from "react";

interface TagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  onAddTag: (tag: string, category: string) => void;
  existingTags: string[];
}

const TagEditModal: React.FC<TagEditModalProps> = ({
  isOpen,
  onClose,
  category,
  onAddTag,
  existingTags,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load tag suggestions from the JSON file
  useEffect(() => {
    if (isOpen && searchTerm.length > 0) {
      setIsLoading(true);
      fetch("/tag_to_category.json")
        .then((response) => response.json())
        .then((tagMap) => {
          // Filter tags by category and search term
          const filteredTags = Object.entries(tagMap)
            .filter(([tag, cat]) => cat === category && tag.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(([tag]) => tag)
            .filter((tag) => !existingTags.includes(tag)) // Exclude already existing tags
            .slice(0, 50); // Limit to 50 suggestions
          setSuggestions(filteredTags);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error loading tag suggestions:", error);
          setIsLoading(false);
        });
    } else {
      setSuggestions([]);
    }
  }, [isOpen, searchTerm, category, existingTags]);

  const handleTagSelect = (tag: string) => {
    onAddTag(tag, category);
    setSearchTerm("");
    setSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() && !existingTags.includes(searchTerm.trim())) {
      onAddTag(searchTerm.trim(), category);
      setSearchTerm("");
      setSuggestions([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 h-[500px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Add Tag to {category}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search for ${category} tags...`}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            autoFocus
          />
        </form>

        {/* Fixed height content area */}
        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="text-center text-gray-400 py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
              <p className="mt-2">Loading suggestions...</p>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="h-full flex flex-col">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Suggestions:</h3>
              <div className="flex-1 overflow-y-auto space-y-1">
                {suggestions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagSelect(tag)}
                    className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchTerm && suggestions.length === 0 && !isLoading && (
            <div className="text-center text-gray-400 py-8">
              <p>No suggestions found for "{searchTerm}"</p>
              <p className="text-sm mt-1">You can still add it as a custom tag</p>
            </div>
          )}

          {!searchTerm && !isLoading && (
            <div className="text-center text-gray-400 py-8">
              <p>Start typing to search for {category} tags</p>
              <p className="text-sm mt-1">Or add a custom tag below</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
          >
            Cancel
          </button>
          {searchTerm.trim() && !existingTags.includes(searchTerm.trim()) && (
            <button
              onClick={() => handleTagSelect(searchTerm.trim())}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded transition"
            >
              Add "{searchTerm.trim()}"
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagEditModal;
