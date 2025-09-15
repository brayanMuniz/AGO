import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";

interface Album {
  id: number;
  name: string;
  type: string;
  cover_image_id?: number | null;
  cover_filename?: string;
}

interface Tag {
  id: number;
  name: string;
  category: string;
}

const AlbumsPage: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [albumType, setAlbumType] = useState<"manual" | "smart">("manual");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [coverImages, setCoverImages] = useState<{[key: number]: string}>({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    includeTags: [] as number[],
    excludeTags: [] as number[],
    minRating: 0,
    favoriteOnly: false,
  });

  // Search states for tag filtering
  const [includeTagSearch, setIncludeTagSearch] = useState("");
  const [excludeTagSearch, setExcludeTagSearch] = useState("");

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const response = await fetch("/api/albums");
      if (!response.ok) throw new Error("Failed to fetch albums");
      const data = await response.json();
      setAlbums(data);
      
      // Fetch cover image filenames for albums that have cover_image_id
      const albumsWithCovers = data.filter((album: Album) => album.cover_image_id);
      const coverImagePromises = albumsWithCovers.map(async (album: Album) => {
        try {
          const imageResponse = await fetch(`/api/images/${album.cover_image_id}`);
          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            return { albumId: album.id, filename: imageData.filename };
          }
        } catch (error) {
          console.error(`Error fetching cover image for album ${album.id}:`, error);
        }
        return null;
      });
      
      const coverResults = await Promise.all(coverImagePromises);
      const coverMap: {[key: number]: string} = {};
      coverResults.forEach(result => {
        if (result) {
          coverMap[result.albumId] = result.filename;
        }
      });
      setCoverImages(coverMap);
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTags = async () => {
    if (allTags.length > 0) return; // Already loaded

    setTagsLoading(true);
    try {
      const endpoints = [
        { url: "/api/categories/tags", category: "general" },
        { url: "/api/categories/artists", category: "artist" },
        { url: "/api/categories/characters", category: "character" },
        { url: "/api/categories/series", category: "copyright" },
        { url: "/api/categories/ratings", category: "rating" },
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint => fetch(endpoint.url))
      );

      const allTagsData: Tag[] = [];

      for (let i = 0; i < responses.length; i++) {
        if (responses[i].ok) {
          const data = await responses[i].json();
          const tags = data.tags || [];
          tags.forEach((tag: any) => {
            allTagsData.push({
              id: tag.id,
              name: tag.name,
              category: endpoints[i].category,
            });
          });
        }
      }

      setAllTags(allTagsData);
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setTagsLoading(false);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // First create the album
      const albumResponse = await fetch("/api/albums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          type: albumType,
        }),
      });

      if (!albumResponse.ok) throw new Error("Failed to create album");

      const albumData = await albumResponse.json();
      const albumId = albumData.id;

      // If it's a smart album, update the filters
      if (albumType === "smart") {
        const filtersResponse = await fetch(`/api/albums/${albumId}/filters`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            include_tag_ids: formData.includeTags.join(","),
            exclude_tag_ids: formData.excludeTags.join(","),
            min_rating: formData.minRating,
            favorite_only: formData.favoriteOnly,
          }),
        });

        if (!filtersResponse.ok) {
          console.error("Failed to update smart album filters");
        }
      }

      // Reset form and refresh albums
      setFormData({
        name: "",
        includeTags: [],
        excludeTags: [],
        minRating: 0,
        favoriteOnly: false,
      });
      setIncludeTagSearch("");
      setExcludeTagSearch("");
      setShowCreateForm(false);
      fetchAlbums();
    } catch (error) {
      console.error("Error creating album:", error);
    }
  };

  const handleTagToggle = (tagId: number, field: "includeTags" | "excludeTags") => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(tagId)
        ? prev[field].filter(id => id !== tagId)
        : [...prev[field], tagId]
    }));
  };

  const handleRatingClick = (starIndex: number) => {
    const newRating = starIndex + 1;
    const finalRating = formData.minRating === newRating ? 0 : newRating;
    setFormData(prev => ({ ...prev, minRating: finalRating }));
  };

  const getSelectedTags = (tagIds: number[]) => {
    return allTags.filter(tag => tagIds.includes(tag.id));
  };

  const getFilteredTags = (searchTerm: string) => {
    if (!searchTerm) return allTags;
    return allTags.filter(tag =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const openCreateForm = (type: "manual" | "smart") => {
    setAlbumType(type);
    setShowCreateForm(true);
    if (type === "smart") {
      fetchAllTags();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
        Loading albums...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <Sidebar />

      <div className="lg:ml-64">
        <MobileNav />

        <main className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <h1 className="text-3xl font-bold">📁 Albums</h1>

            <div className="flex gap-2">
              <button
                onClick={() => openCreateForm("manual")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Manual Album
              </button>
              <button
                onClick={() => openCreateForm("smart")}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                Smart Album
              </button>
            </div>
          </div>

          {/* Create Album Form */}
          {showCreateForm && (
            <div className="bg-gray-800 p-6 rounded-lg mb-6 shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Create {albumType === "manual" ? "Manual" : "Smart"} Album
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAlbum} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Album Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                {albumType === "smart" && (
                  <>
                    {/* Selected Tags Pills */}
                    {(formData.includeTags.length > 0 || formData.excludeTags.length > 0) && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Selected Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {getSelectedTags(formData.includeTags).map(tag => (
                            <span
                              key={`include-${tag.id}`}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-600 text-white"
                            >
                              <span className="text-xs mr-1">[{tag.category}]</span>
                              {tag.name}
                              <button
                                onClick={() => handleTagToggle(tag.id, "includeTags")}
                                className="ml-1 text-white hover:text-gray-200"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {getSelectedTags(formData.excludeTags).map(tag => (
                            <span
                              key={`exclude-${tag.id}`}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-600 text-white"
                            >
                              <span className="text-xs mr-1">[{tag.category}]</span>
                              {tag.name}
                              <button
                                onClick={() => handleTagToggle(tag.id, "excludeTags")}
                                className="ml-1 text-white hover:text-gray-200"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">Include Tags</label>
                      {tagsLoading ? (
                        <div className="text-gray-400">Loading tags...</div>
                      ) : (
                        <>
                          <input
                            type="text"
                            placeholder="Search tags to include..."
                            value={includeTagSearch}
                            onChange={(e) => setIncludeTagSearch(e.target.value)}
                            className="w-full px-3 py-2 mb-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <div className="max-h-40 overflow-y-auto bg-gray-700 rounded-lg p-3 space-y-1">
                            {getFilteredTags(includeTagSearch).map(tag => (
                              <label key={tag.id} className="flex items-center text-sm">
                                <input
                                  type="checkbox"
                                  checked={formData.includeTags.includes(tag.id)}
                                  onChange={() => handleTagToggle(tag.id, "includeTags")}
                                  className="mr-2 w-4 h-4 text-indigo-600 bg-gray-600 border-gray-500 rounded focus:ring-indigo-500"
                                />
                                <span className="text-xs text-gray-400 mr-2">[{tag.category}]</span>
                                {tag.name}
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Exclude Tags (Optional)</label>
                      {tagsLoading ? (
                        <div className="text-gray-400">Loading tags...</div>
                      ) : (
                        <>
                          <input
                            type="text"
                            placeholder="Search tags to exclude..."
                            value={excludeTagSearch}
                            onChange={(e) => setExcludeTagSearch(e.target.value)}
                            className="w-full px-3 py-2 mb-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <div className="max-h-40 overflow-y-auto bg-gray-700 rounded-lg p-3 space-y-1">
                            {getFilteredTags(excludeTagSearch).map(tag => (
                              <label key={tag.id} className="flex items-center text-sm">
                                <input
                                  type="checkbox"
                                  checked={formData.excludeTags.includes(tag.id)}
                                  onChange={() => handleTagToggle(tag.id, "excludeTags")}
                                  className="mr-2 w-4 h-4 text-red-600 bg-gray-600 border-gray-500 rounded focus:ring-red-500"
                                />
                                <span className="text-xs text-gray-400 mr-2">[{tag.category}]</span>
                                {tag.name}
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Minimum Rating (Optional)</label>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleRatingClick(i)}
                              className={`text-2xl transition-all duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded ${i < formData.minRating ? "text-yellow-400" : "text-gray-500"
                                }`}
                              title={`Minimum ${i + 1} star${i + 1 !== 1 ? "s" : ""}${formData.minRating === i + 1 ? " (click to remove)" : ""}`}
                            >
                              {i < formData.minRating ? "★" : "☆"}
                            </button>
                          ))}
                          {formData.minRating > 0 && (
                            <span className="ml-2 text-sm text-gray-400">{formData.minRating}+ stars</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={formData.favoriteOnly}
                            onChange={(e) => setFormData(prev => ({ ...prev, favoriteOnly: e.target.checked }))}
                            className="mr-2 w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                          />
                          Favorites Only
                        </label>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  >
                    Create Album
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Albums List */}
          {albums.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              No albums found. Create your first album using the buttons above!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {albums.map((album) => (
                <div key={album.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold truncate">{album.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${album.type === "smart"
                        ? "bg-purple-600 text-white"
                        : "bg-blue-600 text-white"
                      }`}>
                      {album.type}
                    </span>
                  </div>
                  <div className="w-full h-64 bg-gray-700 rounded mb-3 flex items-center justify-center overflow-hidden relative">
                    {album.cover_image_id && coverImages[album.id] ? (
                      <img
                        src={`/api/images/file/${coverImages[album.id]}`}
                        alt={`${album.name} cover`}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          // Fallback to folder icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={`text-gray-500 text-4xl ${album.cover_image_id && coverImages[album.id] ? 'hidden' : ''}`}>📁</span>
                  </div>
                  <Link
                    to={`/albums/${album.id}`}
                    className="block w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition text-sm text-center"
                  >
                    View Album
                  </Link>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AlbumsPage;
