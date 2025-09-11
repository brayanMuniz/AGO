import React from "react";
import EntityListPage from "../components/EntityListPage";

const AllTagsPage: React.FC = () => {
  return (
    <EntityListPage
      entityName="Tag"
      entityNamePlural="Tags"
      listApiEndpoint="/api/categories/tags"
      favoriteApiEndpointPrefix="/api/user/favorite/tag" // Safe placeholder
      entityLinkPrefix="/tags"
      icon="🏷️"
      responseKey="tags"
    />
  );
};

export default AllTagsPage;

