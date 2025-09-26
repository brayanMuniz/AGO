import React from "react";
import EntityDetailPage from "../components/EntityDetailPage";

const ExplicitnessPage: React.FC = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="explicitness"
      paramName="explicitness"
      icon="🔞"
      tagFormatter={(explicitness) => explicitness}
    />
  );
};

export default ExplicitnessPage;
