import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import GalleryView from "../components/GalleryView";
import Pagination from "../components/Pagination";
import ImageControlsBar from "../components/ImageControlsBar";
import FilterDisplay from "../components/FilterDisplay";
import { useSidebar } from "../contexts/SidebarContext";
import { useUrlParams } from "../hooks/useUrlParams";
import { ApiEndpoints } from "../utils/apiEndpoints";
import { useFilterHandlers } from "../utils/filterHandlers";

interface BackendImageItem {
  id: number;
  phash: string;
  filename: string;
  width: number;
  height: number;
}

interface ImageItem {
  id: number;
  filename: string;
  width: number;
  height: number;
}

interface Album {
  id: number;
  name: string;
  type: string;
  cover_image_id?: number | null;
}

interface PaginationData {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
}

const AlbumDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const { isCollapsed } = useSidebar();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingCover, setIsSettingCover] = useState(false);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isSelectingImages, setIsSelectingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    includeTags: [] as number[],
    excludeTags: [] as number[],
    minRating: 0,
    favoriteOnly: false,
    includeAlbums: [] as number[],
    excludeAlbums: [] as number[],
  });
  const [allTags, setAllTags] = useState<any[]>([]);
  const [allAlbums, setAllAlbums] = useState<Album[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [includeTagSearch, setIncludeTagSearch] = useState("");
  const [excludeTagSearch, setExcludeTagSearch] = useState("");
  const [includeAlbumSearch, setIncludeAlbumSearch] = useState("");
  const [excludeAlbumSearch, setExcludeAlbumSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    limit: 20,
  });
  
  // URL parameters for controls
  const { 
    sortBy, 
    perPage: itemsPerPage, 
    imageSize, 
    page, 
    seed, 
    includeCharacters,
    excludeCharacters,
    includeTags,
    excludeTags,
    includeExplicitness,
    excludeExplicitness,
    includeSeries,
    excludeSeries,
    includeArtists,
    excludeArtists,
    backendSortBy, 
    setPerPage: setItemsPerPage, 
    setImageSize, 
    setPage, 
    setCharacterFilters,
    setTagFilters,
    setExplicitnessFilters,
    setSeriesFilters,
    setArtistFilters,
    getBackendSortValue, 
    handleBackendSortChange 
  } = useUrlParams();
  
  // Handler wrappers for type compatibility
  const handleSortChange = (sort: string) => {
    handleBackendSortChange(sort); // Handle backend parameter names from ImageControlsBar
  };

  const handleItemsPerPageChange = (limit: number) => {
    setItemsPerPage(limit as any); // Type assertion, will be validated in hook
  };

  // Create filter handlers using shared utility
  const filterHandlers = useFilterHandlers({
    characters: {
      include: includeCharacters,
      exclude: excludeCharacters,
      setFilters: setCharacterFilters,
    },
    tags: {
      include: includeTags,
      exclude: excludeTags,
      setFilters: setTagFilters,
    },
    explicitness: {
      include: includeExplicitness,
      exclude: excludeExplicitness,
      setFilters: setExplicitnessFilters,
    },
  });

  const handleRemoveCharacterFilter = filterHandlers.handleRemoveCharacterFilter;
  const handleRemoveTagFilter = filterHandlers.handleRemoveTagFilter;
  const handleRemoveExplicitnessFilter = filterHandlers.handleRemoveExplicitnessFilter;
  const handleClearAllFilters = filterHandlers.handleClearAllFilters;

  const handleImageSizeChange = (newSize: 'small' | 'medium' | 'large') => {
    setImageSize(newSize);
  };

  useEffect(() => {
    const fetchAlbumData = async () => {
      if (!id) {
        setError("No album ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch album details
        const albumResponse = await fetch(`/api/albums`);
        if (!albumResponse.ok) {
          throw new Error(`Failed to fetch albums: ${albumResponse.status}`);
        }
        const albums = await albumResponse.json();
        const currentAlbum = albums.find((a: Album) => a.id === parseInt(id));
        
        if (!currentAlbum) {
          throw new Error("Album not found");
        }
        setAlbum(currentAlbum);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumData();
  }, [id]);


  const handleImageSelect = (imageId: number) => {
    if (!isSelectingImages) return;
    
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const removeImagesFromAlbum = async () => {
    if (!album || selectedImages.size === 0) return;
    
    setIsRemoving(true);
    try {
      const imageIds = Array.from(selectedImages);
      const response = await fetch(`/api/albums/${album.id}/images`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds }),
      });
      
      if (response.ok) {
        // Remove images from local state with smooth transition
        setImages(prevImages => 
          prevImages.filter(img => !selectedImages.has(img.id))
        );
        
        // Update pagination count
        setPagination(prev => ({
          ...prev,
          total_count: prev.total_count - selectedImages.size
        }));
        
        // Reset selection state and exit all modes
        setSelectedImages(new Set());
        setIsSelectingImages(false);
        setShowRemoveModal(false);
        
        console.log(`Successfully removed ${imageIds.length} images from album`);
      } else {
        console.error('Failed to remove images from album');
        alert('Failed to remove images from album. Please try again.');
      }
    } catch (error) {
      console.error('Error removing images from album:', error);
      alert('Failed to remove images from album. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleNameEdit = async () => {
    if (!album || !editingName.trim()) return;
    
    try {
      const response = await fetch(`/api/albums/${album.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      
      if (response.ok) {
        setAlbum(prev => prev ? { ...prev, name: editingName.trim() } : null);
        setIsEditingName(false);
      } else {
        console.error('Failed to update album name');
        alert('Failed to update album name. Please try again.');
      }
    } catch (error) {
      console.error('Error updating album name:', error);
      alert('Failed to update album name. Please try again.');
    }
  };

  const handleSetCover = async (imageId: number) => {
    if (!album || isUpdatingCover) return;

    setIsUpdatingCover(true);
    try {
      if (album.type === "smart") {
        // First, fetch current filters to preserve them
        const filtersResponse = await fetch(`/api/albums/${album.id}/filters`);
        let currentFilters = {
          include_tag_ids: "",
          exclude_tag_ids: "",
          min_rating: 0,
          favorite_only: false,
        };

        if (filtersResponse.ok) {
          currentFilters = await filtersResponse.json();
        }

        // Update with current filters plus new cover image
        const response = await fetch(`/api/albums/${album.id}/filters`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...currentFilters,
            cover_image_id: imageId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update album cover");
        }
      } else {
        // For manual albums, use the direct album cover update endpoint
        const response = await fetch(`/api/albums/${album.id}/cover`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cover_image_id: imageId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update album cover");
        }
      }

      setAlbum(prev => prev ? { ...prev, cover_image_id: imageId } : null);
      setIsSettingCover(false);
    } catch (error) {
      console.error("Error setting cover:", error);
    } finally {
      setIsUpdatingCover(false);
    }
  };

  const fetchImages = async (pageNum: number = page) => {
    if (!id) return;
    
    try {
      setLoading(true);
      const apiParams = {
        page: pageNum,
        limit: itemsPerPage,
        sort: getBackendSortValue(sortBy),
        seed: seed?.toString(),
        includeCharacters: includeCharacters,
        excludeCharacters: excludeCharacters,
        includeTags: includeTags,
        excludeTags: excludeTags,
        includeExplicitness: includeExplicitness,
        excludeExplicitness: excludeExplicitness,
        includeSeries: includeSeries,
        excludeSeries: excludeSeries,
        includeArtists: includeArtists,
        excludeArtists: excludeArtists,
      };
      
      const url = ApiEndpoints.albumImages(id, apiParams);
      const imagesResponse = await fetch(url);
      if (!imagesResponse.ok) {
        throw new Error(`Failed to fetch album images: ${imagesResponse.status}`);
      }
      const data = await imagesResponse.json();
      
      const mappedImages: ImageItem[] = Array.isArray(data.images) ? data.images.map((img: BackendImageItem) => ({
        id: img.id,
        filename: img.filename,
        width: img.width,
        height: img.height,
      })) : [];
      
      setImages(mappedImages);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching album images:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch images");
    } finally {
      setLoading(false);
    }
  };

  // Refetch images when controls change
  useEffect(() => {
    if (id) {
      const timeoutId = setTimeout(() => {
        fetchImages(page);
      }, 100); // Small delay to debounce rapid changes
      
      return () => clearTimeout(timeoutId);
    }
  }, [id, sortBy, itemsPerPage, page, includeCharacters?.join(','), excludeCharacters?.join(','), includeTags?.join(','), excludeTags?.join(','), includeExplicitness?.join(','), excludeExplicitness?.join(',')]);

  const fetchAllTags = async () => {
    if (allTags.length > 0) return;
    
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

      const allTagsData: any[] = [];
      
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
      console.error("Failed to load tags:", error);
    } finally {
      setTagsLoading(false);
    }
  };

  const fetchAllAlbums = async () => {
    if (allAlbums.length > 0) return;
    
    try {
      const response = await fetch("/api/albums");
      if (!response.ok) throw new Error("Failed to fetch albums");
      const albums = await response.json();
      
      // Filter out smart albums and the current album to prevent circular dependencies
      const filteredAlbums = albums.filter((a: Album) => 
        a.type === 'manual' && a.id !== album?.id
      );
      
      setAllAlbums(filteredAlbums);
    } catch (error) {
      console.error("Failed to load albums:", error);
    }
  };

  const handleUpdateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!album) return;

    try {
      // Update album name if it changed
      if (editFormData.name !== album.name) {
        const nameResponse = await fetch(`/api/albums/${album.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editFormData.name,
          }),
        });

        if (!nameResponse.ok) {
          throw new Error("Failed to update album name");
        }
      }

      if (album.type === "smart") {
        const response = await fetch(`/api/albums/${album.id}/filters`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            include_tag_ids: editFormData.includeTags.join(","),
            exclude_tag_ids: editFormData.excludeTags.join(","),
            min_rating: editFormData.minRating,
            favorite_only: editFormData.favoriteOnly,
            include_album_ids: editFormData.includeAlbums.join(","),
            exclude_album_ids: editFormData.excludeAlbums.join(","),
            cover_image_id: album.cover_image_id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update smart album filters");
        }

        // Refresh album images after updating filters
        await fetchImages(1);
      }

      // Update local state with new name
      setAlbum(prev => prev ? { ...prev, name: editFormData.name } : null);
      setShowEditForm(false);
    } catch (error) {
      console.error("Error updating album:", error);
      alert("Failed to update album. Please try again.");
    }
  };

  const handleTagToggle = (tagId: number, field: "includeTags" | "excludeTags") => {
    setEditFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(tagId)
        ? prev[field].filter(id => id !== tagId)
        : [...prev[field], tagId]
    }));
  };

  const handleRatingClick = (starIndex: number) => {
    const newRating = starIndex + 1;
    const finalRating = editFormData.minRating === newRating ? 0 : newRating;
    setEditFormData(prev => ({ ...prev, minRating: finalRating }));
  };

  const handleAlbumToggle = (albumId: number, field: "includeAlbums" | "excludeAlbums") => {
    setEditFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(albumId)
        ? prev[field].filter(id => id !== albumId)
        : [...prev[field], albumId]
    }));
  };

  const getSelectedTags = (tagIds: number[]) => {
    return allTags.filter(tag => tagIds.includes(tag.id));
  };

  const getSelectedAlbums = (albumIds: number[]) => {
    return allAlbums.filter(album => albumIds.includes(album.id));
  };

  const getFilteredTags = (searchTerm: string) => {
    if (!searchTerm) return allTags;
    return allTags.filter(tag => 
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredAlbums = (searchTerm: string) => {
    if (!searchTerm) return allAlbums;
    return allAlbums.filter(album =>
      album.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleExport = async () => {
    if (!album || images.length === 0) return;

    try {
      const imageIds = images.map(img => img.id);
      
      const response = await fetch('/api/images/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imageIds,
          export_name: album.name,
          export_type: 'album',
          update_only: true, // Always use update mode
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const result = await response.json();
      
      // Show success message
      alert(`Export completed!\nExported: ${result.exported_count} images\nSkipped: ${result.skipped_count} images\nPath: ${result.export_path}`);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  const openEditForm = async () => {
    if (album) {
      let formData = {
        name: album.name,
        includeTags: [] as number[],
        excludeTags: [] as number[],
        minRating: 0,
        favoriteOnly: false,
        includeAlbums: [] as number[],
        excludeAlbums: [] as number[],
      };

      // For smart albums, fetch existing filters
      if (album.type === "smart") {
        try {
          // Load tags and albums first
          await Promise.all([fetchAllTags(), fetchAllAlbums()]);
          
          // Fetch current filters
          const filtersResponse = await fetch(`/api/albums/${album.id}/filters`);
          if (filtersResponse.ok) {
            const filters = await filtersResponse.json();
            
            // Parse comma-separated IDs
            const parseIds = (idString: string): number[] => {
              if (!idString || idString.trim() === "") return [];
              return idString.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            };
            
            formData = {
              ...formData,
              includeTags: parseIds(filters.include_tag_ids),
              excludeTags: parseIds(filters.exclude_tag_ids),
              minRating: filters.min_rating || 0,
              favoriteOnly: filters.favorite_only || false,
              includeAlbums: parseIds(filters.include_album_ids || ""),
              excludeAlbums: parseIds(filters.exclude_album_ids || ""),
            };
          }
        } catch (error) {
          console.error("Failed to load existing filters:", error);
        }
      }
      
      setEditFormData(formData);
      setShowEditForm(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-48'}`}>
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
              <p className="text-gray-300">Loading album...</p>
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
        <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-48'}`}>
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">Error Loading Album</h2>
                <p className="text-red-400 mb-6">{error}</p>
                <Link to="/albums" className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded transition">
                  ← Back to Albums
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-48'}`}>
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">Album Not Found</h2>
                <p className="text-gray-400 mb-6">No album found with ID: {id}</p>
                <Link to="/albums" className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded transition">
                  ← Back to Albums
                </Link>
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
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-48'}`}>
        <MobileNav />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link 
                to="/albums" 
                className="text-gray-400 hover:text-white transition"
                title="Back to Albums"
              >
                ← 
              </Link>
              
              {/* Inline Album Name Editing */}
              <div className="flex items-center gap-2">
                <span className="text-3xl">📁</span>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleNameEdit();
                        } else if (e.key === 'Escape') {
                          setIsEditingName(false);
                          setEditingName(album.name);
                        }
                      }}
                      className="text-3xl font-bold bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      onClick={handleNameEdit}
                      className="text-green-500 hover:text-green-400 text-xl"
                      title="Save name"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setEditingName(album.name);
                      }}
                      className="text-red-500 hover:text-red-400 text-xl"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-gray-100">
                      {album.name}
                    </h1>
                    <button
                      onClick={() => {
                        setIsEditingName(true);
                        setEditingName(album.name);
                      }}
                      className="text-gray-400 hover:text-gray-200 text-sm"
                      title="Edit album name"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
              
              <span className={`px-3 py-1 rounded text-sm ${
                album.type === "smart" 
                  ? "bg-purple-600 text-white" 
                  : "bg-blue-600 text-white"
              }`}>
                {album.type}
              </span>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isSettingCover) {
                      setIsSettingCover(false);
                    } else if (isSelectingImages) {
                      setIsSelectingImages(false);
                      setSelectedImages(new Set());
                    } else {
                      setIsSettingCover(true);
                    }
                  }}
                  disabled={isUpdatingCover || images.length === 0}
                  className={`px-3 py-1 rounded text-sm transition ${
                    isSettingCover 
                      ? "bg-pink-600 hover:bg-pink-700 text-white" 
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={images.length === 0 ? "No images available for cover" : "Click an image to set as cover"}
                >
                  {isUpdatingCover ? "Updating..." : isSettingCover ? "Cancel Cover" : "Set Cover"}
                </button>
                
                {album.type === "manual" && (
                  <button
                    onClick={() => {
                      if (isSelectingImages) {
                        setIsSelectingImages(false);
                        setSelectedImages(new Set());
                      } else {
                        setIsSelectingImages(true);
                        setIsSettingCover(false);
                      }
                    }}
                    disabled={images.length === 0}
                    className={`px-3 py-1 rounded text-sm transition ${
                      isSelectingImages
                        ? "bg-red-600 hover:bg-red-700 text-white" 
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={images.length === 0 ? "No images available" : "Select images to remove from album"}
                  >
                    {isSelectingImages ? "Cancel Selection" : "Remove Images"}
                  </button>
                )}
                
                {album.type === "smart" && (
                  <button
                    onClick={openEditForm}
                    className="px-3 py-1 rounded text-sm transition bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Edit Filters
                  </button>
                )}
              </div>
            </div>
            <div className="text-gray-400 text-sm">
              Showing {images.length} of {pagination.total_count} images
            </div>
          </div>
          
          {/* Gallery with cover setting mode */}
          {isSettingCover && images.length > 0 && (
            <div className="mb-4 p-4 bg-blue-900 rounded-lg">
              <p className="text-blue-200 text-sm mb-2">Click on an image to set it as the album cover</p>
              <button
                onClick={() => setIsSettingCover(false)}
                className="text-blue-300 hover:text-white text-sm underline"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Image selection mode instructions */}
          {isSelectingImages && images.length > 0 && (
            <div className="mb-4 p-4 bg-red-900 rounded-lg">
              <p className="text-red-200 text-sm mb-2">Click on images to select them for removal from this album</p>
              <div className="flex gap-2 items-center">
                <span className="text-red-300 text-sm">
                  {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected
                </span>
                {selectedImages.size > 0 && (
                  <button
                    onClick={() => setShowRemoveModal(true)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                  >
                    Remove {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} from album
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Controls Bar */}
          <ImageControlsBar
            sortBy={backendSortBy}
            onSortChange={handleSortChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            imageSize={imageSize}
            onImageSizeChange={handleImageSizeChange}
            characterFilters={[
              ...(includeCharacters || []).map(name => ({ id: 0, name, type: 'include' as const })),
              ...(excludeCharacters || []).map(name => ({ id: 0, name, type: 'exclude' as const }))
            ]}
            onCharacterFiltersChange={(filters) => {
              const include = filters.filter(f => f.type === 'include').map(f => f.name);
              const exclude = filters.filter(f => f.type === 'exclude').map(f => f.name);
              setCharacterFilters(
                include.length > 0 ? include : undefined,
                exclude.length > 0 ? exclude : undefined
              );
            }}
            tagFilters={[
              ...(includeTags || []).map(name => ({ id: 0, name, type: 'include' as const })),
              ...(excludeTags || []).map(name => ({ id: 0, name, type: 'exclude' as const }))
            ]}
            onTagFiltersChange={(filters) => {
              const include = filters.filter(f => f.type === 'include').map(f => f.name);
              const exclude = filters.filter(f => f.type === 'exclude').map(f => f.name);
              setTagFilters(
                include.length > 0 ? include : undefined,
                exclude.length > 0 ? exclude : undefined
              );
            }}
            explicitnessFilters={[
              ...(includeExplicitness || []).map(level => ({ id: 0, name: level, type: 'include' as const })),
              ...(excludeExplicitness || []).map(level => ({ id: 0, name: level, type: 'exclude' as const }))
            ]}
            onExplicitnessFiltersChange={(filters) => {
              const include = filters.filter(f => f.type === 'include').map(f => f.name);
              const exclude = filters.filter(f => f.type === 'exclude').map(f => f.name);
              setExplicitnessFilters(
                include.length > 0 ? include : undefined,
                exclude.length > 0 ? exclude : undefined
              );
            }}
            exportData={album ? {
              images: images.map(img => img.id),
              exportName: album.name,
              exportType: 'album'
            } : undefined}
            onExport={handleExport}
          />

          {/* Filter Display */}
          <FilterDisplay
            includeCharacters={includeCharacters}
            excludeCharacters={excludeCharacters}
            includeTags={includeTags}
            excludeTags={excludeTags}
            includeExplicitness={includeExplicitness}
            excludeExplicitness={excludeExplicitness}
            onRemoveCharacterFilter={handleRemoveCharacterFilter}
            onRemoveTagFilter={handleRemoveTagFilter}
            onRemoveExplicitnessFilter={handleRemoveExplicitnessFilter}
            onClearAllFilters={handleClearAllFilters}
          />

          {/* Error Display */}
          {error && (
            <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded mb-6">
              Error: {error}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={pagination.total_pages}
            onPageChange={setPage}
          />
          
          <div className={isSettingCover ? "cursor-pointer" : ""}>
            <GalleryView 
              images={images}
              imageSize={imageSize}
              onImageClick={isSettingCover ? handleSetCover : undefined}
              isSelecting={isSelectingImages}
              selectedImages={selectedImages}
              onImageSelect={handleImageSelect}
              isLoading={loading}
              expectedCount={itemsPerPage}
            />
          </div>
          
          {/* Edit Album Modal */}
          {showEditForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    Edit {album?.type === "smart" ? "Smart" : "Manual"} Album
                  </h2>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handleUpdateAlbum} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Album Name</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {album?.type === "smart" && (
                    <>
                      {/* Selected Tags Pills */}
                      {(editFormData.includeTags.length > 0 || editFormData.excludeTags.length > 0) && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2 text-gray-300">Selected Tags</label>
                          <div className="flex flex-wrap gap-2">
                            {getSelectedTags(editFormData.includeTags).map(tag => (
                              <span
                                key={`include-${tag.id}`}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-600 text-white"
                              >
                                <span className="text-xs mr-1">[{tag.category}]</span>
                                {tag.name}
                                <button
                                  type="button"
                                  onClick={() => handleTagToggle(tag.id, "includeTags")}
                                  className="ml-1 text-white hover:text-gray-200"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {getSelectedTags(editFormData.excludeTags).map(tag => (
                              <span
                                key={`exclude-${tag.id}`}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-600 text-white"
                              >
                                <span className="text-xs mr-1">[{tag.category}]</span>
                                {tag.name}
                                <button
                                  type="button"
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
                        <label className="block text-sm font-medium mb-2 text-gray-300">Include Tags</label>
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
                                    checked={editFormData.includeTags.includes(tag.id)}
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
                        <label className="block text-sm font-medium mb-2 text-gray-300">Exclude Tags (Optional)</label>
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
                                    checked={editFormData.excludeTags.includes(tag.id)}
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

                      {/* Album Selection Sections */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Include Albums (Optional)</label>
                        <p className="text-xs text-gray-400 mb-2">Images must be in at least one of these albums</p>
                        <input
                          type="text"
                          placeholder="Search albums to include..."
                          value={includeAlbumSearch}
                          onChange={(e) => setIncludeAlbumSearch(e.target.value)}
                          className="w-full px-3 py-2 mb-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <div className="max-h-40 overflow-y-auto bg-gray-700 rounded-lg p-3 space-y-1">
                          {getFilteredAlbums(includeAlbumSearch).map(album => (
                            <label key={album.id} className="flex items-center text-sm">
                              <input
                                type="checkbox"
                                checked={editFormData.includeAlbums.includes(album.id)}
                                onChange={() => handleAlbumToggle(album.id, "includeAlbums")}
                                className="mr-2 w-4 h-4 text-green-600 bg-gray-600 border-gray-500 rounded focus:ring-green-500"
                              />
                              <span className="text-xs text-gray-400 mr-2">📁</span>
                              {album.name}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Exclude Albums (Optional)</label>
                        <p className="text-xs text-gray-400 mb-2">Images must NOT be in any of these albums (unless also in include albums)</p>
                        <input
                          type="text"
                          placeholder="Search albums to exclude..."
                          value={excludeAlbumSearch}
                          onChange={(e) => setExcludeAlbumSearch(e.target.value)}
                          className="w-full px-3 py-2 mb-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <div className="max-h-40 overflow-y-auto bg-gray-700 rounded-lg p-3 space-y-1">
                          {getFilteredAlbums(excludeAlbumSearch).map(album => (
                            <label key={album.id} className="flex items-center text-sm">
                              <input
                                type="checkbox"
                                checked={editFormData.excludeAlbums.includes(album.id)}
                                onChange={() => handleAlbumToggle(album.id, "excludeAlbums")}
                                className="mr-2 w-4 h-4 text-red-600 bg-gray-600 border-gray-500 rounded focus:ring-red-500"
                              />
                              <span className="text-xs text-gray-400 mr-2">📁</span>
                              {album.name}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Selected Albums Pills */}
                      {(editFormData.includeAlbums.length > 0 || editFormData.excludeAlbums.length > 0) && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2 text-gray-300">Selected Albums</label>
                          <div className="flex flex-wrap gap-2">
                            {getSelectedAlbums(editFormData.includeAlbums).map(album => (
                              <span
                                key={`include-album-${album.id}`}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-600 text-white"
                              >
                                📁 {album.name}
                                <button
                                  type="button"
                                  onClick={() => handleAlbumToggle(album.id, "includeAlbums")}
                                  className="ml-1 text-white hover:text-gray-200"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {getSelectedAlbums(editFormData.excludeAlbums).map(album => (
                              <span
                                key={`exclude-album-${album.id}`}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-600 text-white"
                              >
                                📁 {album.name}
                                <button
                                  type="button"
                                  onClick={() => handleAlbumToggle(album.id, "excludeAlbums")}
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
                        <label className="block text-sm font-medium mb-2 text-gray-300">Minimum Rating</label>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleRatingClick(i)}
                              className={`text-2xl transition-all duration-150 hover:scale-110 ${
                                i < editFormData.minRating ? "text-yellow-400" : "text-gray-500"
                              }`}
                            >
                              {i < editFormData.minRating ? "★" : "☆"}
                            </button>
                          ))}
                          {editFormData.minRating > 0 && (
                            <span className="ml-2 text-sm text-gray-400">{editFormData.minRating}+ stars</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={editFormData.favoriteOnly}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, favoriteOnly: e.target.checked }))}
                            className="mr-2 w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                          />
                          Favorites Only
                        </label>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                      Update Album
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Remove Images Confirmation Modal */}
          {showRemoveModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-red-400 mb-4">
                  ⚠️ Remove Images from Album
                </h3>
                
                <div className="mb-6">
                  <p className="text-gray-300 mb-3">
                    Are you sure you want to remove {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} from <span className="font-semibold text-blue-400">"{album?.name}"</span>?
                  </p>
                  <p className="text-gray-400 text-sm">
                    This action cannot be undone. The images will be removed from this album but will remain in your collection.
                  </p>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowRemoveModal(false)}
                    disabled={isRemoving}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={removeImagesFromAlbum}
                    disabled={isRemoving}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isRemoving && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {isRemoving ? 'Removing...' : `Remove ${selectedImages.size} image${selectedImages.size !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {images.length === 0 && (
            <div className="text-center text-gray-400 py-10">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl mb-2">No images in this album</h3>
              <p className="text-sm">
                {album.type === "manual" 
                  ? "Add images to this album from the image detail pages." 
                  : "This smart album's filters don't match any images yet."}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AlbumDetailPage;
