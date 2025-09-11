import React from "react";
import EntityListPage from "../components/EntityListPage";

const AllSeriesPage: React.FC = () => {
  return (
    <EntityListPage
      entityName="Series"
      entityNamePlural="Series"
      listApiEndpoint="/api/categories/series"
      favoriteApiEndpointPrefix="/api/user/favorite/series"
      entityLinkPrefix="/series"
      icon="🎞️"
      responseKey="tags"
    />
  );
};

export default AllSeriesPage;


