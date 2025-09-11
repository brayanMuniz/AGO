import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import GalleryView from "../components/GalleryView";

interface BackendImageItem {
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

interface EntityDetailPageProps {
  entityTypeSingular: string;
  entityTypePlural: string;
  paramName: string;
  apiEndpointPrefix: string;
  detailsResponseKey: string;
  backLink: string;
  icon: string;
}

const EntityDetailPage: React.FC<EntityDetailPageProps> = ({
  entityTypeSingular,
  paramName,
  icon,
}) => {
  const params = useParams<{ [key: string]: string }>();
  const entityName = params[paramName];

  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!entityName) {
        setError(`No ${entityTypeSingular.toLowerCase()} provided`);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const url = `/api/images/by-tags?tags=${encodeURIComponent(entityName)}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          throw new Error(errJson?.error || `HTTP ${res.status}`);
        }
        const json: BackendImageItem[] = await res.json();
        const mapped: ImageItem[] = json.map((img, index) => ({
          id: index,
          filename: img.filename,
          width: img.width,
          height: img.height,
        }));
        setImages(mapped);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [entityName, entityTypeSingular]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
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
          <h1 className="text-3xl font-bold text-gray-100 mb-4">{icon} {entityName}</h1>
          <GalleryView images={images} />
          {images.length === 0 && (
            <div className="text-center text-gray-400 py-10">No images found for this {entityTypeSingular.toLowerCase()}.</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EntityDetailPage;
