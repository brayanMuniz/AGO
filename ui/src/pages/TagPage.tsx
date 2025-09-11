import EntityDetailPage from "../components/EntityDetailPage";

const TagPage = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="Tag"
      entityTypePlural="Tags"
      paramName="tag"
      apiEndpointPrefix="/api/tag"
      // favoriteApiEndpointPrefix="/api/user/favorite/tag" // does not exist
      detailsResponseKey="tagDetails"
      backLink="/tags"
      icon="🏷️"
    />
  );
};

export default TagPage;

