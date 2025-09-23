import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSidebar } from "../contexts/SidebarContext";

interface Album {
  id: number;
  name: string;
  type: string;
}

const Sidebar: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const { isCollapsed, toggleSidebar } = useSidebar();

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await fetch("/api/albums");
        if (!res.ok) throw new Error("Failed to load albums");
        const data = await res.json();
        setAlbums(data.albums ?? []);

      } catch (error) {
        console.error("Error loading albums:", error);
      }
    };

    fetchAlbums();
  }, []);

  return (
    <aside className={`hidden lg:flex h-screen bg-gray-800 text-gray-200 flex-col rounded-r-2xl fixed top-0 left-0 z-40 transition-all duration-300 ${
      isCollapsed ? 'w-16 p-2' : 'w-48 p-4'
    }`}>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="self-end mb-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg 
          className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      {/* Logo */}
      <Link to="/" className="hover:text-indigo-400 transition py-1 mb-6">
        {isCollapsed ? (
          <h2 className="text-2xl font-bold text-center">A</h2>
        ) : (
          <h2 className="text-2xl font-bold">AGO</h2>
        )}
      </Link>

      <nav className="flex flex-col gap-4 mb-auto overflow-hidden">
        {/* Main Navigation */}
        <Link to="/tags" className="hover:text-indigo-400 transition py-1 flex items-center gap-3" title="Tags">
          <span className="text-lg">🏷️</span>
          {!isCollapsed && <span>Tags</span>}
        </Link>
        <Link to="/artists" className="hover:text-indigo-400 transition py-1 flex items-center gap-3" title="Artists">
          <span className="text-lg">🎨</span>
          {!isCollapsed && <span>Artists</span>}
        </Link>
        <Link to="/characters" className="hover:text-indigo-400 transition py-1 flex items-center gap-3" title="Characters">
          <span className="text-lg">🧑‍🎤</span>
          {!isCollapsed && <span>Characters</span>}
        </Link>
        <Link to="/series" className="hover:text-indigo-400 transition py-1 flex items-center gap-3" title="Series">
          <span className="text-lg">📺</span>
          {!isCollapsed && <span>Series</span>}
        </Link>
        <Link to="/explicitness" className="hover:text-indigo-400 transition py-1 flex items-center gap-3" title="Explicitness">
          <span className="text-lg">🔞</span>
          {!isCollapsed && <span>Explicitness</span>}
        </Link>

        {/* Albums Section */}
        <div className="mt-2">
          <Link to="/albums" className="text-white hover:text-indigo-400 transition flex items-center gap-3 mb-2" title="Albums">
            <span className="text-lg">📁</span>
            {!isCollapsed && <span>Albums</span>}
          </Link>

          {!isCollapsed && (
            <div className="ml-2 flex flex-col gap-2 max-h-64 overflow-y-auto">
              {Array.isArray(albums) && albums.map((album) => (
                <Link
                  key={album.id}
                  to={`/albums/${album.id}`}
                  className="hover:text-indigo-400 transition flex items-center gap-2"
                  title={album.name}
                >
                  <img
                    src="/placeholder.png"
                    alt="cover"
                    className="w-6 h-6 rounded object-cover flex-shrink-0"
                  />
                  <span className="text-sm truncate">{album.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

