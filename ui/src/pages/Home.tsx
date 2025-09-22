import React, { useState, useEffect } from "react";
import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import GalleryView from "../components/GalleryView";
import Pagination from "../components/Pagination";
import ImageControlsBar from "../components/ImageControlsBar";

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
          <ImageControlsBar
            sortBy={sortBy}
            onSortChange={handleSortChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            imageSize={imageSize}
            onImageSizeChange={handleImageSizeChange}
            showExportControls={false}
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
            onPageChange={handlePageChange}
          />

          {/* Results Info */}
          <div className="text-center text-gray-400 text-sm mt-4 mb-2">
            Showing {images.length} of {pagination.total_count} images
          </div>

          {/* Images Gallery */}
          <GalleryView 
            images={images} 
            imageSize={imageSize}
          />

         
        </main>
      </div>
    </div>
  );
};

export default Home;

