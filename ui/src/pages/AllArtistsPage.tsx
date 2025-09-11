import React from "react";
import EntityListPage from "../components/EntityListPage";

const AllArtistsPage: React.FC = () => {
  return (
    <EntityListPage
      entityName="Artist"
      entityNamePlural="Artists"
      listApiEndpoint="/api/categories/artists"
      favoriteApiEndpointPrefix="/api/user/favorite/artist"
      entityLinkPrefix="/artists"
      icon="🎨"
      responseKey="tags"
    />
  );
};

export default AllArtistsPage;


