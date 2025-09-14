import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import TagEditModal from "../components/TagEditModal";

interface ImageData {
  id: number;
  phash: string;
  filename: string;
  width: number;
  height: number;
  favorite: boolean;
  likes: number;
  rating: number;
  tags: { [category: string]: string[] };
}

const ImagePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchImage = async () => {
      if (!id) {
        setError("No image ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/images/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Image not found");
          }
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const data = await response.json();
        setImageData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [id]);

  const updateField = async (field: string, value: any) => {
    if (!imageData || isUpdating) return;

    setIsUpdating(true);
    const previousValue = (imageData as any)[field];

    // Optimistic update
    setImageData(prev => prev ? { ...prev, [field]: value } : null);

    try {
      // Map field names to API endpoints
      const fieldMap: { [key: string]: string } = {
        'like_count': 'like',
        'favorite': 'favorite',
        'rating': 'rate'
      };

      const apiField = fieldMap[field] || field;
      const response = await fetch(`/api/images/${id}/${apiField}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${field}: ${response.status}`);
      }

      const data = await response.json();
      console.log(`${field} updated successfully:`, data);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      // Revert optimistic update on error
      setImageData(prev => prev ? { ...prev, [field]: previousValue } : null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRatingClick = (starIndex: number) => {
    const newRating = starIndex + 1;
    // If clicking the same star that's already selected, unrate (set to 0)
    const finalRating = imageData?.rating === newRating ? 0 : newRating;
    updateField("rating", finalRating);
  };

  const handleFavoriteToggle = () => {
    if (imageData) {
      updateField("favorite", !imageData.favorite);
    }
  };

  const handleLikeIncrement = () => {
    if (imageData) {
      updateField("like_count", imageData.likes + 1);
    }
  };

  const handleAddTag = async (tag: string, category: string) => {
    if (!imageData || isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/images/${id}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag, category }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add tag: ${response.status}`);
      }

      // Update local state
      setImageData(prev => {
        if (!prev) return null;
        const newTags = { ...prev.tags };
        if (!newTags[category]) {
          newTags[category] = [];
        }
        if (!newTags[category].includes(tag)) {
          newTags[category] = [...newTags[category], tag];
        }
        return { ...prev, tags: newTags };
      });

      console.log(`Tag "${tag}" added to ${category}`);
    } catch (error) {
      console.error("Error adding tag:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!imageData || isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/images/${id}/tags`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag }),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove tag: ${response.status}`);
      }

      // Update local state
      setImageData(prev => {
        if (!prev) return null;
        const newTags = { ...prev.tags };
        Object.keys(newTags).forEach(category => {
          newTags[category] = newTags[category].filter(t => t !== tag);
        });
        return { ...prev, tags: newTags };
      });

      console.log(`Tag "${tag}" removed`);
    } catch (error) {
      console.error("Error removing tag:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const openAddTagModal = (category: string) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
              <p className="text-gray-300">Loading image...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">Error Loading Image</h2>
                <p className="text-red-400 mb-6">{error}</p>
                <Link to="/" className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded transition">← Back to Home</Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!imageData) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">Image Not Found</h2>
                <p className="text-gray-400 mb-6">No image found with ID: {id}</p>
                <Link to="/" className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded transition">← Back to Home</Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <div className="lg:ml-64">
        <MobileNav />
        <main className="flex-1 p-4">
          <div className="max-w-9xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Image Display Area */}
              <div className="flex-1 max-w-lg flex flex-col items-start">
                <div className="relative">
                  {/* Navigation arrows placeholder */}

                  <img
                    src={`/api/images/file/${imageData.filename}`}
                    alt={imageData.filename}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg bg-gray-800"
                  />
                </div>

                {/* Action buttons below image */}
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={handleLikeIncrement}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
                  >
                    <span className="text-2xl">♡</span>
                    <span className="text-gray-300">Like ({imageData.likes})</span>
                  </button>

                  <button
                    onClick={handleFavoriteToggle}
                    disabled={isUpdating}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition disabled:opacity-50 ${imageData.favorite
                      ? "bg-pink-600 hover:bg-pink-700 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                      }`}
                  >
                    <span className="text-2xl">{imageData.favorite ? "♥" : "♡"}</span>
                    <span>Favorite</span>
                  </button>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handleRatingClick(i)}
                        disabled={isUpdating}
                        className={`text-2xl transition-all duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded disabled:opacity-50 ${i < imageData.rating ? "text-yellow-400" : "text-gray-500"
                          }`}
                        title={`Rate ${i + 1} star${i + 1 !== 1 ? "s" : ""}${imageData.rating === i + 1 ? " (click to remove)" : ""}`}
                      >
                        {i < imageData.rating ? "★" : "☆"}
                      </button>
                    ))}
                    {isUpdating && (
                      <span className="ml-2 text-xs text-gray-400">Updating...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata Sidebar */}
              <div className="w-full lg:w-[48rem] bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Image Details</h2>
                  <button
                    onClick={() => setIsEditingTags(!isEditingTags)}
                    className={`px-3 py-1 rounded text-sm transition ${
                      isEditingTags 
                        ? "bg-pink-600 hover:bg-pink-700 text-white" 
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    }`}
                  >
                    {isEditingTags ? "Done Editing" : "Edit Tags"}
                  </button>
                </div>

                {/* Tags by category - show all categories */}
                {(() => {
                  // Define all possible categories in order
                  const allCategories = [
                    { key: "general", name: "Tags" },
                    { key: "character", name: "Character" },
                    { key: "copyright", name: "Series" },
                    { key: "artist", name: "Artist" },
                    { key: "meta", name: "Meta" },
                    { key: "uncategorized", name: "Uncategorized" }
                  ];

                  return allCategories.map(({ key, name }) => {
                    const tags = imageData.tags[key] || [];
                    return (
                      <div key={key} className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-300">
                            {name}
                          </h3>
                          {isEditingTags && (
                            <button
                              onClick={() => openAddTagModal(key)}
                              className="text-pink-400 hover:text-pink-300 text-lg font-bold"
                              title={`Add ${name.toLowerCase()} tag`}
                            >
                              +
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tags.length > 0 ? (
                            tags.map((tag, idx) => (
                              isEditingTags ? (
                                <button
                                  key={idx}
                                  onClick={() => handleRemoveTag(tag)}
                                  className="inline-block px-2 py-1 rounded text-xs transition bg-red-600 hover:bg-red-500 text-white"
                                  title={`Remove ${tag}`}
                                >
                                  {tag} ×
                                </button>
                              ) : (
                                <Link
                                  key={idx}
                                  to={`/tags/${encodeURIComponent(tag)}`}
                                  className="inline-block px-2 py-1 rounded text-xs transition bg-pink-600 hover:bg-pink-500 text-white"
                                >
                                  {tag}
                                </Link>
                              )
                            ))
                          ) : (
                            <span className="text-gray-500 text-sm italic">
                              {isEditingTags ? "No tags - click + to add" : "No tags"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}

                {/* Rating category */}
                {imageData.tags.rating && imageData.tags.rating.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Rating</h3>
                    <div className="flex flex-wrap gap-1">
                      {imageData.tags.rating.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 rounded text-xs bg-yellow-600 text-white"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Year */}
                {imageData.tags.year && imageData.tags.year.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Year</h3>
                    <div className="flex flex-wrap gap-1">
                      {imageData.tags.year.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 rounded text-xs bg-blue-600 text-white"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Tag Edit Modal */}
      <TagEditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        category={selectedCategory}
        onAddTag={handleAddTag}
        existingTags={imageData ? Object.values(imageData.tags).flat() : []}
      />
    </div>
  );
};

export default ImagePage;
