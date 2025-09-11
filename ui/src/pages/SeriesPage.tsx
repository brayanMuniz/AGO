import React from "react";
import EntityDetailPage from "../components/EntityDetailPage";

const SeriesPage: React.FC = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="Series"
      entityTypePlural="Series"
      paramName="series"
      apiEndpointPrefix="/api/series"
      detailsResponseKey="seriesDetails"
      backLink="/series"
      icon="🎞️"
    />
  );
};

export default SeriesPage;


