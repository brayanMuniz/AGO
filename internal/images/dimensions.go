package images

import (
	"image"
	_ "image/jpeg"
	_ "image/png"
	"os"
)

func GetImageDimensions(path string) (int, int, error) {
	f, err := os.Open(path)
	if err != nil {
		return 0, 0, err
	}
	defer f.Close()

	img, _, err := image.DecodeConfig(f) // Only decodes header, not full image
	if err != nil {
		return 0, 0, err
	}

	return img.Width, img.Height, nil
}
