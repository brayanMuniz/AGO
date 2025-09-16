import React, { useState, useEffect } from "react";
import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import GalleryView from "../components/GalleryView";
import Pagination from "../components/Pagination";

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

const Home = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchImages = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/images?page=${page}&limit=${itemsPerPage}&sort=${sortBy}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`);
      }
      
      const data = await response.json();
      setImages(data.images || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages(1);
  }, [sortBy, itemsPerPage]);

  const handlePageChange = (page: number) => {
    fetchImages(page);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
  };

  const handleImageSizeChange = (newSize: 'small' | 'medium' | 'large') => {
    setImageSize(newSize);
  };

  if (loading && images.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
              <p className="text-gray-300">Loading images...</p>
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
        <main className="flex-1 p-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
            {/* Sort By Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-white text-sm font-medium">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-pink-500 focus:outline-none"
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

            {/* Items Per Page Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-white text-sm font-medium">Per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-pink-500 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={40}>40</option>
                <option value={60}>60</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Image Size Slider */}
            <div className="flex items-center gap-2">
              <label className="text-white text-sm font-medium">Image size:</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">Small</span>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="1"
                  value={imageSize === 'small' ? 0 : imageSize === 'medium' ? 1 : 2}
                  onChange={(e) => {
                    const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
                    handleImageSizeChange(sizes[Number(e.target.value)]);
                  }}
                  className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-gray-400 text-xs">Large</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded mb-6">
              Error: {error}
            </div>
          )}

          {/* Images Gallery */}
          <GalleryView 
            images={images} 
            imageSize={imageSize}
          />

          {/* Pagination */}
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.total_pages}
            onPageChange={handlePageChange}
          />

          {/* Results Info */}
          <div className="text-center text-gray-400 text-sm mt-4">
            Showing {images.length} of {pagination.total_count} images
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;

