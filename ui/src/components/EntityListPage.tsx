import React, { useEffect, useState, useMemo } from "react";
import EntityCard from "./EntityCard";
import Sidebar from "./SideBar";
import MobileNav from "./MobileNav";

interface Entity {
  id: number;
  name: string;
  isFavorite: boolean;
  imageCount: number;
}

interface EntityListPageProps {
  entityName: string;
  entityNamePlural: string;
  listApiEndpoint: string;
  favoriteApiEndpointPrefix: string;
  icon: string;
  entityLinkPrefix?: string;
  responseKey?: string;
}

const EntityListPage: React.FC<EntityListPageProps> = ({
  // entityName,
  entityNamePlural,
  listApiEndpoint,
  favoriteApiEndpointPrefix,
  icon,
  entityLinkPrefix = "/tags",
  responseKey = "tags",
}) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    showFavoritesOnly: false,
    minImageCount: "",
  });

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchEntities = async () => {
      setLoading(true);
      try {
        const response = await fetch(listApiEndpoint);
        const data = await response.json();
        setEntities(data[responseKey] || []);
      } catch (err) {
        setError("Failed to load entities");
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [listApiEndpoint, entityNamePlural]);

  const handleToggleFavorite = async (id: number, current: boolean) => {
    const updated = entities.map((e) =>
      e.id === id ? { ...e, isFavorite: !current } : e
    );
    setEntities(updated);

    try {
      const method = current ? "DELETE" : "POST";
      await fetch(`${favoriteApiEndpointPrefix}/${id}`, { method });
    } catch {
      setEntities(entities); // rollback
    }
  };

  const filteredEntities = useMemo(() => {
    let filtered = [...entities];

    if (filters.showFavoritesOnly) {
      filtered = filtered.filter((e) => e.isFavorite);
    }

    if (filters.minImageCount) {
      const min = parseInt(filters.minImageCount, 10);
      if (!isNaN(min)) {
        filtered = filtered.filter((e) => e.imageCount >= min);
      }
    }

    filtered.sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

    return filtered;
  }, [entities, filters, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
        Loading {entityNamePlural.toLowerCase()}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-red-400 flex justify-center items-center">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <Sidebar />

      <div className="lg:ml-64">
        <MobileNav />

        <main className="p-6">


          <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
            <h1 className="text-3xl font-bold">
              {icon} {entityNamePlural}
            </h1>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg mb-6 shadow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
            <label className="flex items-center text-sm text-gray-300 col-span-1">
              <input
                type="checkbox"
                name="showFavoritesOnly"
                checked={filters.showFavoritesOnly}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    showFavoritesOnly: e.target.checked,
                  }))
                }
                className="mr-2 w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
              />
              Favorites Only
            </label>

            <input
              type="number"
              placeholder="Min Images"
              value={filters.minImageCount}
              onChange={(e) =>
                setFilters((f) => ({ ...f, minImageCount: e.target.value }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:ring-indigo-500 focus:border-transparent"
            />

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="asc">Sort: A → Z</option>
              <option value="desc">Sort: Z → A</option>
            </select>
          </div>

          {filteredEntities.length === 0 ? (
            <div className="text-center text-gray-400">
              No {entityNamePlural.toLowerCase()} found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEntities.map((entity) => (
                <EntityCard
                  key={entity.id}
                  entity={entity}
                  onToggleFavorite={handleToggleFavorite}
                  linkPrefix={entityLinkPrefix}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EntityListPage;
