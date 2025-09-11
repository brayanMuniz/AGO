import React from "react";
import { Link } from "react-router-dom";

interface MobileNavProps { }

const MobileNav: React.FC<MobileNavProps> = () => (
  <nav className="lg:hidden sticky top-0 z-30 bg-gray-800 text-gray-200 p-3 shadow-md">
    <div className="flex flex-wrap justify-center items-center gap-x-3 sm:gap-x-4 gap-y-2">

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

    </div>
  </nav>
);

export default MobileNav;

