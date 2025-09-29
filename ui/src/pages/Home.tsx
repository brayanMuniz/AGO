import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import ImageGalleryPage from "../components/ImageGalleryPage";
import { useSidebar } from "../contexts/SidebarContext";
import { ApiEndpoints, LegacyParamConverters } from "../utils/apiEndpoints";

const Home = () => {
  const { isCollapsed } = useSidebar();

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
      return ApiEndpoints.images(apiParams);
    },
    initialLoading: true,
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-48'}`}>
        <MobileNav />
        <main className="flex-1 p-6">
          <div className="max-w-full mx-auto">
            <div className="flex flex-col items-center justify-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">AGO</h1>
              <p className="text-gray-400 text-center">
                Explore your image collection
              </p>
            </div>

            <ImageGalleryPage
              config={config}
              showExportControls={false}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
export default Home;

