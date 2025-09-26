import React from "react";
import EntityDetailPage from "../components/EntityDetailPage";

const SeriesPage: React.FC = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="series"
      paramName="series"
      icon="🎞️"
    />
  );
};

export default SeriesPage;


