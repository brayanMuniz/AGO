import './App.css'

import Home from "./pages/Home";
import AllTagsPage from "./pages/AllTagsPage";
import TagPage from "./pages/TagPage";

import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tags" element={<AllTagsPage />} />
        <Route path="/tags/:tag" element={<TagPage />} />
      </Routes>
    </div>
  );
}

export default App
