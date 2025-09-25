import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "./SideBar";
import MobileNav from "./MobileNav";
import GalleryView from "./GalleryView";
import ImageControlsBar from "./ImageControlsBar";
import Pagination from "./Pagination";
import { useSidebar } from "../contexts/SidebarContext";
import { useUrlParams } from "../hooks/useUrlParams";

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

interface PaginationData {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
}

interface TagInfo {
  id: number;
  name: string;
  category: string;
  imageCount: number;
  isFavorite: boolean;
}

interface EntityDetailPageProps {
  entityTypeSingular: string;
  entityTypePlural: string;
  paramName: string;
  apiEndpointPrefix: string;
  detailsResponseKey: string;
  backLink: string;
  icon: string;
  tagFormatter?: (entityName: string) => string;
}

const EntityDetailPage: React.FC<EntityDetailPageProps> = ({
  entityTypeSingular,
  paramName,
  icon,
  tagFormatter,
}) => {
  const params = useParams<{ [key: string]: string }>();
  const entityName = params[paramName];
  const { isCollapsed } = useSidebar();

  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelectingImages, setIsSelectingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [manualAlbums, setManualAlbums] = useState<any[]>([]);
  const [isRemovingTags, setIsRemovingTags] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [tagInfo, setTagInfo] = useState<TagInfo | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    limit: 20,
  });
  
  // URL parameters for controls
  const { sortBy, perPage: itemsPerPage, imageSize, backendSortBy, setPerPage: setItemsPerPage, setImageSize, getBackendSortValue, handleBackendSortChange } = useUrlParams();
  const [isExporting, setIsExporting] = useState(false);

  // Handler wrappers for type compatibility
  const handleSortChange = (sort: string) => {
    handleBackendSortChange(sort); // Handle backend parameter names from ImageControlsBar
  };

  const handleItemsPerPageChange = (limit: number) => {
    setItemsPerPage(limit as any); // Type assertion, will be validated in hook
  };

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

  const fetchManualAlbums = async () => {
    try {
      const response = await fetch('/api/albums');
      const albums = await response.json();
      const manual = albums.filter((album: any) => album.type === 'manual');
      setManualAlbums(manual);
    } catch (error) {
      console.error('Failed to fetch manual albums:', error);
    }
  };

  const addImagesToAlbum = async (albumId: number) => {
    try {
      const imageIds = Array.from(selectedImages);
      const response = await fetch(`/api/albums/${albumId}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds }),
      });
      
      if (response.ok) {
        setSelectedImages(new Set());
        setIsSelectingImages(false);
        setShowAlbumModal(false);
        // Show success message or refresh
      } else {
        console.error('Failed to add images to album');
      }
    } catch (error) {
      console.error('Error adding images to album:', error);
    }
  };

  const removeTagFromImages = async () => {
    if (!entityName || selectedImages.size === 0) return;
    
    setIsRemoving(true);
    try {
      const imageIds = Array.from(selectedImages);
      const tagName = tagFormatter ? tagFormatter(entityName) : entityName;
      const promises = imageIds.map(imageId => 
        fetch(`/api/images/${imageId}/tags`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tag: tagName }),
        })
      );
      
      const responses = await Promise.all(promises);
      const failedRemovals = responses.filter(response => !response.ok);
      
      if (failedRemovals.length === 0) {
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
        setIsRemovingTags(false);
        setIsSelectingImages(false);
        setShowRemoveModal(false);
        
        console.log(`Successfully removed ${tagName} from ${imageIds.length} images`);
      } else {
        console.error(`Failed to remove tag from ${failedRemovals.length} images`);
        alert(`Failed to remove tag from ${failedRemovals.length} images. Please try again.`);
      }
    } catch (error) {
      console.error('Error removing tag from images:', error);
      alert('Failed to remove tag from images. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const fetchImages = async (page: number = 1) => {
    if (!entityName) {
      setError(`No ${entityTypeSingular.toLowerCase()} provided`);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Clear images immediately to show skeletons
      if (page === 1) {
        setImages([]);
      }
      
      const tagName = tagFormatter ? tagFormatter(entityName) : entityName;
      const url = `/api/images/by-tags?tags=${encodeURIComponent(tagName)}&page=${page}&limit=${itemsPerPage}&sort=${getBackendSortValue(sortBy)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const mapped: ImageItem[] = (data.images || []).map((img: BackendImageItem) => ({
        id: img.id,
        filename: img.filename,
        width: img.width,
        height: img.height,
      }));
      setImages(mapped);
      setPagination(data.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTagInfo = async () => {
    if (!entityName) return;
    try {
      const res = await fetch(`/api/categories/tag/${encodeURIComponent(entityName)}`);
      if (res.ok) {
        const data = await res.json();
        setTagInfo(data);
      }
    } catch (e) {
      console.error('Failed to fetch tag info:', e);
    }
  };

  const handleExport = async () => {
    if (!entityName || images.length === 0) return;

    setIsExporting(true);
    try {
      const imageIds = images.map(img => img.id);
      
      const response = await fetch('/api/images/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imageIds,
          export_name: entityName,
          export_type: entityTypeSingular.toLowerCase(),
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
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    // Reset loading state when parameters change
    setLoading(true);
    fetchImages(1);
    fetchTagInfo();
  }, [entityName, entityTypeSingular, sortBy, itemsPerPage]);

  if (loading && images.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-48'}`}>
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
              <p className="text-gray-300">Loading {entityTypeSingular.toLowerCase()}...</p>
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
            <div className="text-center text-red-400">{error}</div>
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
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-100">{icon} {entityName}</h1>
              {tagInfo && (
                <button
                  onClick={async () => {
                    try {
                      const method = tagInfo.isFavorite ? "DELETE" : "POST";
                      const categoryEndpoint = tagInfo.category === "general" ? "tag" : tagInfo.category;
                      await fetch(`/api/user/favorite/${categoryEndpoint}/${tagInfo.id}`, { method });
                      setTagInfo({ ...tagInfo, isFavorite: !tagInfo.isFavorite });
                    } catch (e) {
                      console.error('Failed to toggle favorite:', e);
                    }
                  }}
                  className={`text-2xl transition-colors hover:scale-110 transform ${
                    tagInfo.isFavorite ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                  }`}
                  title={tagInfo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {tagInfo.isFavorite ? '❤️' : '🤍'}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (isSelectingImages) {
                    setIsSelectingImages(false);
                    setSelectedImages(new Set());
                    setIsRemovingTags(false);
                  } else {
                    setIsSelectingImages(true);
                    setIsRemovingTags(false);
                  }
                }}
                disabled={images.length === 0}
                className={`px-4 py-2 rounded text-sm transition ${
                  isSelectingImages && !isRemovingTags
                    ? "bg-pink-600 hover:bg-pink-700 text-white" 
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={images.length === 0 ? "No images available" : "Select images to add to album"}
              >
                {isSelectingImages && !isRemovingTags ? "Cancel Selection" : "Add to Album"}
              </button>
              
              <button
                onClick={() => {
                  if (isRemovingTags) {
                    setIsRemovingTags(false);
                    setSelectedImages(new Set());
                    setIsSelectingImages(false);
                  } else {
                    setIsRemovingTags(true);
                    setIsSelectingImages(true);
                  }
                }}
                disabled={images.length === 0}
                className={`px-4 py-2 rounded text-sm transition ${
                  isRemovingTags
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={images.length === 0 ? "No images available" : `Remove ${entityName} tag from selected images`}
              >
                {isRemovingTags ? "Cancel Removal" : `Remove ${entityTypeSingular}`}
              </button>
            </div>
          </div>
          
          {/* Selection mode instructions */}
          {isSelectingImages && images.length > 0 && (
            <div className={`mb-4 p-4 rounded-lg ${isRemovingTags ? 'bg-red-900' : 'bg-blue-900'}`}>
              <p className={`text-sm mb-2 ${isRemovingTags ? 'text-red-200' : 'text-blue-200'}`}>
                {isRemovingTags 
                  ? `Click on images to select them for ${entityName} tag removal`
                  : 'Click on images to select them, then choose an album to add them to'
                }
              </p>
              <div className="flex gap-2 items-center">
                <span className={`text-sm ${isRemovingTags ? 'text-red-300' : 'text-blue-300'}`}>
                  {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected
                </span>
                {selectedImages.size > 0 && !isRemovingTags && (
                  <button
                    onClick={() => {
                      fetchManualAlbums();
                      setShowAlbumModal(true);
                    }}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition"
                  >
                    Choose Album
                  </button>
                )}
                {selectedImages.size > 0 && isRemovingTags && (
                  <button
                    onClick={() => setShowRemoveModal(true)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                  >
                    Remove {entityTypeSingular} from {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''}
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
            onImageSizeChange={setImageSize}
            exportData={entityName ? {
              images: images.map(img => img.id),
              exportName: entityName,
              exportType: entityTypeSingular.toLowerCase()
            } : undefined}
            onExport={handleExport}
          />

          {/* Error Display */}
          {error && (
            <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded mb-6">
              Error: {error}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.total_pages}
            onPageChange={fetchImages}
          />

          {/* Results Info */}
          <div className="text-center text-gray-400 text-sm mt-4 mb-2">
            Showing {images.length} of {pagination.total_count} images
          </div>
          
          <GalleryView 
            images={images} 
            imageSize={imageSize}
            isSelecting={isSelectingImages}
            selectedImages={selectedImages}
            onImageSelect={handleImageSelect}
            isLoading={loading}
            expectedCount={itemsPerPage}
          />
          {images.length === 0 && (
            <div className="text-center text-gray-400 py-10">No images found for this {entityTypeSingular.toLowerCase()}.</div>
          )}
        </main>
      </div>
      
      {/* Album Selection Modal */}
      {showAlbumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-100 mb-4">
              Add {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} to Album
            </h3>
            
            <div className="max-h-60 overflow-y-auto mb-4">
              {manualAlbums.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No manual albums found</p>
              ) : (
                <div className="space-y-2">
                  {manualAlbums.map((album) => (
                    <button
                      key={album.id}
                      onClick={() => addImagesToAlbum(album.id)}
                      className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      <div className="font-semibold text-gray-100">{album.name}</div>
                      <div className="text-sm text-gray-400">
                        {album.imageCount || 0} images
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAlbumModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Tag Confirmation Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-400 mb-4">
              ⚠️ Remove {entityTypeSingular} Tag
            </h3>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-3">
                Are you sure you want to remove the <span className="font-semibold text-red-400">"{entityName}"</span> tag from {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''}?
              </p>
              <p className="text-gray-400 text-sm">
                This action cannot be undone. The images will be removed from this {entityTypeSingular.toLowerCase()} page.
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
                onClick={removeTagFromImages}
                disabled={isRemoving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isRemoving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isRemoving ? 'Removing...' : `Remove from ${selectedImages.size} image${selectedImages.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityDetailPage;
