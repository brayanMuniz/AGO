// src/components/EntityCard.tsx
import React from "react";
import { Link } from "react-router-dom";

interface Entity {
  id: number;
  name: string;
  isFavorite?: boolean;
  imageCount?: number;
}

interface EntityCardProps {
  entity: Entity;
  onToggleFavorite: (id: number, isFavorite: boolean) => void;
  linkPrefix: string;
}

const EntityCard: React.FC<EntityCardProps> = ({ entity, onToggleFavorite, linkPrefix }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col justify-between shadow-lg">
      <div className="flex justify-between items-start mb-3">
        <Link 
          to={`${linkPrefix}/${encodeURIComponent(entity.name)}`}
          className="text-lg text-gray-100 font-semibold hover:text-blue-400 transition-colors"
        >
          {entity.name}
        </Link>
        <button
          onClick={() => onToggleFavorite(entity.id, entity.isFavorite ?? false)}
          className={`text-xl transition-colors cursor-pointer hover:text-red-400 ${
            entity.isFavorite ? "text-red-500" : "text-gray-500"
          }`}
          title={entity.isFavorite ? "Unfavorite" : "Favorite"}
        >
          {entity.isFavorite ? "♥" : "♡"}
        </button>
      </div>

      {typeof entity.imageCount === "number" && (
        <p className="text-gray-400 text-sm">
          <span className="font-semibold text-gray-300">Images:</span>{" "}
          {entity.imageCount}
        </p>
      )}
    </div>
  );
};

export default EntityCard;

