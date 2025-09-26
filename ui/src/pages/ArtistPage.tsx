import React from "react";
import EntityDetailPage from "../components/EntityDetailPage";

const ArtistPage: React.FC = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="artist"
      paramName="artist"
      icon="🎨"
    />
  );
};

export default ArtistPage;


