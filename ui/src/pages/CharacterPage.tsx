import React from "react";
import EntityDetailPage from "../components/EntityDetailPage";

const CharacterPage: React.FC = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="character"
      paramName="character"
      icon="🧑‍🎤"
    />
  );
};

export default CharacterPage;


