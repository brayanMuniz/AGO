import { useState, useEffect } from "react";
import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import GalleryView from "../components/GalleryView";
import Pagination from "../components/Pagination";
import ImageControlsBar from "../components/ImageControlsBar";
import { useSidebar } from "../contexts/SidebarContext";
import { useUrlParams } from "../hooks/useUrlParams";

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
  const { isCollapsed } = useSidebar();
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    limit: 20,
  });
  
  // URL parameters for controls
  const { sortBy, perPage: itemsPerPage, imageSize, page, seed, backendSortBy, setPerPage: setItemsPerPage, setImageSize, setPage, getBackendSortValue, handleBackendSortChange } = useUrlParams();

  const fetchImages = async (pageNum: number = page) => {
    try {
      setLoading(true);
      setError(null);
      
      const seedParam = seed ? `&seed=${seed}` : '';
      const response = await fetch(
        `/api/images?page=${pageNum}&limit=${itemsPerPage}&sort=${getBackendSortValue(sortBy)}${seedParam}`
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
    fetchImages(page);
  }, [sortBy, itemsPerPage, page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSortChange = (newSort: string) => {
    handleBackendSortChange(newSort); // Handle backend parameter names from ImageControlsBar
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit as any); // Type assertion for now, will be validated in hook
  };

  const handleImageSizeChange = (newSize: 'small' | 'medium' | 'large') => {
    setImageSize(newSize);
  };

  if (loading && images.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-48'}`}>
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
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-48'}`}>
        <MobileNav />
        <main className="flex-1 p-6">
          {/* Controls Bar */}
          <ImageControlsBar
            sortBy={backendSortBy}
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
            currentPage={page}
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
            isLoading={loading}
            expectedCount={itemsPerPage}
          />

         
        </main>
      </div>
    </div>
  );
};

export default Home;

