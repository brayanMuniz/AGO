import React from "react";
import EntityDetailPage from "../components/EntityDetailPage";

const CharacterPage: React.FC = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="Character"
      entityTypePlural="Characters"
      paramName="character"
      apiEndpointPrefix="/api/character"
      detailsResponseKey="characterDetails"
      backLink="/characters"
      icon="🧑‍🎤"
    />
  );
};

export default CharacterPage;


