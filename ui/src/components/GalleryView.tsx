import React from "react";
import { Link } from "react-router-dom";
import Masonry from "react-masonry-css";

interface ImageItem {
  id: number;
  filename: string;
  width: number;
  height: number;
}

interface ImageMasonryProps {
  images: ImageItem[];
}

const breakpointColumnsObj = {
  default: 6,
  1600: 5,
  1280: 4,
  1024: 3,
  768: 2,
  640: 1,
};

const ImageMasonry: React.FC<ImageMasonryProps> = ({ images }) => {
  if (images.length === 0) {
    return <div className="text-center text-gray-400 py-8">No images found.</div>;
  }

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto gap-1"
      columnClassName="masonry-column"
    >
      {images.map((img) => (
        <Link
          key={img.id}
          to={`/image/${img.id}`}
          className="break-inside-avoid bg-gray-800 rounded overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
        >
          <img
            src={`/api/images/file/${img.filename}`}
            alt={img.filename}
            className="w-full h-auto object-cover"
            loading="lazy"
            decoding="async"
          />
        </Link>
      ))}
    </Masonry>
  );
};

export default ImageMasonry;

