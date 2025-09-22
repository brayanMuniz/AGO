import React from "react";
import EntityListPage from "../components/EntityListPage";

const AllExplicitnessPage: React.FC = () => {
  return (
    <EntityListPage
      entityName="Explicitness"
      entityNamePlural="Explicitness"
      listApiEndpoint="/api/categories/ratings"
      favoriteApiEndpointPrefix="/api/user/favorite/tag"
      entityLinkPrefix="/explicitness"
      icon="🔞"
      responseKey="tags"
    />
  );
};

export default AllExplicitnessPage;
