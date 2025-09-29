import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "./SideBar";
import MobileNav from "./MobileNav";
import ImageGalleryPage from "./ImageGalleryPage";
import { useSidebar } from "../contexts/SidebarContext";
import { ApiEndpoints, LegacyParamConverters } from "../utils/apiEndpoints";

interface EntityDetailPageProps {
  entityTypeSingular: string;
  paramName: string;
  icon: string;
  tagFormatter?: (tag: string) => string;
}

interface TagInfo {
  id: number;
  name: string;
  category: string;
  imageCount: number;
  isFavorite: boolean;
}

const EntityDetailPage: React.FC<EntityDetailPageProps> = ({
  entityTypeSingular,
  paramName,
  icon,
  tagFormatter = (tag: string) => tag,
}) => {
  const { [paramName]: entityName } = useParams<{ [key: string]: string }>();
  const { isCollapsed } = useSidebar();
  const [tagInfo, setTagInfo] = useState<TagInfo | null>(null);

  // Selection states for tag removal
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [isSelectingImages, setIsSelectingImages] = useState(false);

  // Map explicitness names to actual tag names
  const getTagName = (name: string, type: string): string => {
    if (type === 'explicitness') {
      const explicitnessMap: { [key: string]: string } = {
        'safe': 'rating_safe',
        'questionable': 'rating_questionable', 
        'explicit': 'rating_explicit',
      };
      return explicitnessMap[name] || `rating_${name}`;
    }
    return name;
  };

  const config = {
    apiEndpoint: (params: {
      page: number;
      limit: number;
      sort: string;
      seed?: string;
      includeCharacters?: string;
      excludeCharacters?: string;
      includeTags?: string;
      excludeTags?: string;
      includeExplicitness?: string;
      excludeExplicitness?: string;
    }) => {
      const apiParams = LegacyParamConverters.fromLegacyParams(params);
      const tagName = getTagName(entityName || '', entityTypeSingular);
      return ApiEndpoints.imagesByTags(tagName, apiParams);
    },
    initialLoading: true,
  };

  const fetchTagInfo = async () => {
    if (!entityName) return;
    
    try {
      const endpoint = entityTypeSingular === 'explicitness' 
        ? `/api/categories/explicitness/${entityName}`
        : `/api/categories/tag/${entityName}`;
        
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setTagInfo(data);
      }
    } catch (error) {
      console.error('Error fetching tag info:', error);
    }
  };

  useEffect(() => {
    fetchTagInfo();
  }, [entityName]);

  // Placeholder export function to match ImageControlsBar interface
  const handleExport = () => {
    // This would need to be handled differently in the actual implementation
    // The ImageControlsBar component would need to be updated to support the full export interface
    console.log('Export triggered - implementation needed');
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

  const customHeader = (
    <>
      {/* Entity Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="text-6xl">{icon}</div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {tagFormatter(entityName || '')}
            </h1>
            <p className="text-gray-400">
              {tagInfo?.imageCount || 0} images
            </p>
          </div>
        </div>
        
        {tagInfo && (
          <button
            className={`p-3 rounded-full transition-colors ${
              tagInfo.isFavorite
                ? 'bg-pink-600 text-white hover:bg-pink-700'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={tagInfo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            ❤️
          </button>
        )}
      </div>

      {/* Selection Mode Instructions */}
      {isSelectingImages && (
        <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded mb-6">
          <div className="flex items-center justify-between">
            <span>
              Click images to select them for tag removal. Selected: {selectedImages.size}
            </span>
            <div className="flex gap-2">
              {selectedImages.size > 0 && (
                <button
                  onClick={() => console.log('Remove tags - implementation needed')}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Remove {entityTypeSingular} from {selectedImages.size} images
                </button>
              )}
              <button
                onClick={() => {
                  setIsSelectingImages(false);
                  setSelectedImages(new Set());
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (!entityName) {
    return <div>Entity not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-48'}`}>
        <MobileNav />
        <main className="flex-1 p-6">
          <div className="max-w-full mx-auto">
            <ImageGalleryPage
              config={config}
              customHeader={customHeader}
              exportData={entityName ? {
                images: [], // This would be populated from the gallery hook
                exportName: entityName,
                exportType: entityTypeSingular.toLowerCase()
              } : undefined}
              onExport={handleExport}
              showExportControls={true}
              onImageSelect={handleImageSelect}
              selectedImages={selectedImages}
              isSelectingImages={isSelectingImages}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default EntityDetailPage;
