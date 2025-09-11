import React from "react";
import EntityListPage from "../components/EntityListPage";

const AllCharactersPage: React.FC = () => {
  return (
    <EntityListPage
      entityName="Character"
      entityNamePlural="Characters"
      listApiEndpoint="/api/categories/characters"
      favoriteApiEndpointPrefix="/api/user/favorite/character"
      entityLinkPrefix="/characters"
      icon="🧑‍🎤"
      responseKey="tags"
    />
  );
};

export default AllCharactersPage;


