import React from "react";
import EntityDetailPage from "../components/EntityDetailPage";

const ArtistPage: React.FC = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="Artist"
      entityTypePlural="Artists"
      paramName="artist"
      apiEndpointPrefix="/api/artist"
      detailsResponseKey="artistDetails"
      backLink="/artists"
      icon="🎨"
    />
  );
};

export default ArtistPage;


