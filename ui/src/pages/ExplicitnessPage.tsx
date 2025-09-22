import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import GalleryView from "../components/GalleryView";
import ImageControlsBar from "../components/ImageControlsBar";
import Pagination from "../components/Pagination";

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

interface ExplicitnessInfo {
  id: number;
  name: string;
  category: string;
  imageCount: number;
  isFavorite: boolean;
}

const ExplicitnessPage: React.FC = () => {
  const { explicitness } = useParams<{ explicitness: string }>();

  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelectingImages, setIsSelectingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [manualAlbums, setManualAlbums] = useState<any[]>([]);
  const [explicitnessInfo, setExplicitnessInfo] = useState<ExplicitnessInfo | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    limit: 20,
  });
  
  // Controls state
  const [sortBy, setSortBy] = useState("random");
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>('medium');

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
      } else {
        console.error('Failed to add images to album');
      }
    } catch (error) {
      console.error('Error adding images to album:', error);
    }
  };

  const fetchImages = async (page: number = 1) => {
    if (!explicitness) {
      setError("No explicitness level provided");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      
      // Add rating_ prefix to match the actual tag format in the database
      const ratingTag = `rating_${explicitness}`;
      const url = `/api/images/by-tags?tags=${encodeURIComponent(ratingTag)}&page=${page}&limit=${itemsPerPage}&sort=${sortBy}`;
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

  const fetchExplicitnessInfo = async () => {
    if (!explicitness) return;
    try {
      const res = await fetch(`/api/categories/explicitness/${encodeURIComponent(explicitness)}`);
      if (res.ok) {
        const data = await res.json();
        setExplicitnessInfo(data);
      }
    } catch (e) {
      console.error('Failed to fetch explicitness info:', e);
    }
  };

  useEffect(() => {
    fetchImages(1);
    fetchExplicitnessInfo();
  }, [explicitness, sortBy, itemsPerPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
              <p className="text-gray-300">Loading explicitness level...</p>
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
            <div className="text-center text-red-400">{error}</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="lg:ml-64 flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-100">🔞 {explicitness}</h1>
              {explicitnessInfo && (
                <button
                  onClick={async () => {
                    try {
                      const method = explicitnessInfo.isFavorite ? "DELETE" : "POST";
                      await fetch(`/api/user/favorite/tag/${explicitnessInfo.id}`, { method });
                      setExplicitnessInfo({ ...explicitnessInfo, isFavorite: !explicitnessInfo.isFavorite });
                    } catch (e) {
                      console.error('Failed to toggle favorite:', e);
                    }
                  }}
                  className={`text-2xl transition-colors hover:scale-110 transform ${
                    explicitnessInfo.isFavorite ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                  }`}
                  title={explicitnessInfo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {explicitnessInfo.isFavorite ? '❤️' : '🤍'}
                </button>
              )}
            </div>
            <button
              onClick={() => {
                if (isSelectingImages) {
                  setIsSelectingImages(false);
                  setSelectedImages(new Set());
                } else {
                  setIsSelectingImages(true);
                }
              }}
              disabled={images.length === 0}
              className={`px-4 py-2 rounded text-sm transition ${
                isSelectingImages 
                  ? "bg-pink-600 hover:bg-pink-700 text-white" 
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={images.length === 0 ? "No images available" : "Select images to add to album"}
            >
              {isSelectingImages ? "Cancel Selection" : "Add to Album"}
            </button>
          </div>
          
          {/* Selection mode instructions */}
          {isSelectingImages && images.length > 0 && (
            <div className="mb-4 p-4 bg-blue-900 rounded-lg">
              <p className="text-blue-200 text-sm mb-2">Click on images to select them, then choose an album to add them to</p>
              <div className="flex gap-2 items-center">
                <span className="text-blue-300 text-sm">
                  {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected
                </span>
                {selectedImages.size > 0 && (
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
              </div>
            </div>
          )}
          
          {/* Controls Bar */}
          <ImageControlsBar
            sortBy={sortBy}
            onSortChange={setSortBy}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            imageSize={imageSize}
            onImageSizeChange={setImageSize}
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
          />
          {images.length === 0 && (
            <div className="text-center text-gray-400 py-10">No images found for this explicitness level.</div>
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
    </div>
  );
};

export default ExplicitnessPage;
