import React from "react";
import { Link } from "react-router-dom";

interface SidebarProps { }

const Sidebar: React.FC<SidebarProps> = () => (
  <aside
    className="hidden lg:flex w-48 h-screen bg-gray-800 text-gray-200 
    flex-col p-4 rounded-r-2xl fixed top-0 left-0 z-40"
  >
    <Link to="/" className="hover:text-indigo-400 transition py-1">

      <h2 className="text-2xl font-bold mb-6">AGO</h2>
    </Link>

    <nav className="flex flex-col gap-4 mb-auto">

      <Link to="/tags" className="hover:text-indigo-400 transition py-1">
        Tags
      </Link>

      <Link to="/artists" className="hover:text-indigo-400 transition py-1">
        Artists
      </Link>

      <Link to="/characters" className="hover:text-indigo-400 transition py-1">
        Characters
      </Link>

      <Link to="/series" className="hover:text-indigo-400 transition py-1">
        Series
      </Link>


    </nav>

  </aside>
);

export default Sidebar;

