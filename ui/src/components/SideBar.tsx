import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Album {
  id: number;
  name: string;
  type: string;
}

const Sidebar: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);

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
    <aside className="hidden lg:flex w-48 h-screen bg-gray-800 text-gray-200 flex-col p-4 rounded-r-2xl fixed top-0 left-0 z-40">
      <Link to="/" className="hover:text-indigo-400 transition py-1">
        <h2 className="text-2xl font-bold mb-6">AGO</h2>
      </Link>

      <nav className="flex flex-col gap-4 mb-auto">

        <Link to="/tags" className="hover:text-indigo-400 transition py-1">Tags</Link>
        <Link to="/artists" className="hover:text-indigo-400 transition py-1">Artists</Link>
        <Link to="/characters" className="hover:text-indigo-400 transition py-1">Characters</Link>
        <Link to="/series" className="hover:text-indigo-400 transition py-1">Series</Link>
        <Link to="/explicitness" className="hover:text-indigo-400 transition py-1">Explicitness</Link>

        <div className="mt-2">
          <Link to="/albums" className="text-white hover:text-indigo-400 transition block mb-2">
            Albums
          </Link>

          <div className="ml-2 flex flex-col gap-2">
            {Array.isArray(albums) && albums.map((album) => (
              <Link
                key={album.id}
                to={`/albums/${album.id}`}
                className="hover:text-indigo-400 transition flex items-center gap-2"
              >
                <img
                  src="/placeholder.png"
                  alt="cover"
                  className="w-6 h-6 rounded object-cover"
                />
                <span className="text-sm truncate">{album.name}</span>
              </Link>
            ))}
          </div>
        </div>

      </nav>
    </aside>
  );
};

export default Sidebar;

