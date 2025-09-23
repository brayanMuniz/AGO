import './App.css'

import Home from "./pages/Home";
import ImagePage from "./pages/ImagePage";
import AlbumsPage from "./pages/AlbumsPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import AllTagsPage from "./pages/AllTagsPage";
import TagPage from "./pages/TagPage";
import AllArtistsPage from "./pages/AllArtistsPage";
import ArtistPage from "./pages/ArtistPage";
import AllCharactersPage from "./pages/AllCharactersPage";
import CharacterPage from "./pages/CharacterPage";
import AllSeriesPage from "./pages/AllSeriesPage";
import SeriesPage from "./pages/SeriesPage";
import AllExplicitnessPage from "./pages/AllExplicitnessPage";
import ExplicitnessPage from "./pages/ExplicitnessPage";

import { Routes, Route } from "react-router-dom";
import { SidebarProvider } from "./contexts/SidebarContext";

function App() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-900">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/albums/:id" element={<AlbumDetailPage />} />

          <Route path="/image/:id" element={<ImagePage />} />

          <Route path="/tags" element={<AllTagsPage />} />
          <Route path="/tags/:tag" element={<TagPage />} />

          <Route path="/artists" element={<AllArtistsPage />} />
          <Route path="/artists/:artist" element={<ArtistPage />} />

          <Route path="/characters" element={<AllCharactersPage />} />
          <Route path="/characters/:character" element={<CharacterPage />} />

          <Route path="/series" element={<AllSeriesPage />} />
          <Route path="/series/:series" element={<SeriesPage />} />

          <Route path="/explicitness" element={<AllExplicitnessPage />} />
          <Route path="/explicitness/:explicitness" element={<ExplicitnessPage />} />

        </Routes>
      </div>
    </SidebarProvider>
  );
}

export default App
