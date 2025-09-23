import React from "react";
import EntityDetailPage from "../components/EntityDetailPage";

const ExplicitnessPage: React.FC = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="Explicitness"
      entityTypePlural="Explicitness"
      paramName="explicitness"
      apiEndpointPrefix="/api/categories/explicitness"
      detailsResponseKey="explicitnessDetails"
      backLink="/explicitness"
      icon="🔞"
      tagFormatter={(explicitness) => `rating_${explicitness}`}
    />
  );
};

export default ExplicitnessPage;
