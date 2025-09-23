package images

import (
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"os"
	"path/filepath"
	"strings"

	"github.com/nfnt/resize"
)

// ThumbnailSize represents different thumbnail sizes
type ThumbnailSize struct {
	Name      string
	MaxWidth  uint
	MaxHeight uint
	Quality   int
}

// Predefined thumbnail sizes
var (
	SmallThumbnail = ThumbnailSize{
		Name:      "small",
		MaxWidth:  600,
		MaxHeight: 600,
		Quality:   85,
	}
	MediumThumbnail = ThumbnailSize{
		Name:      "medium",
		MaxWidth:  1200,
		MaxHeight: 1200,
		Quality:   90,
	}
	LargeThumbnail = ThumbnailSize{
		Name:      "large",
		MaxWidth:  2000,
		MaxHeight: 2000,
		Quality:   95,
	}
)

// GetThumbnailSizes returns all available thumbnail sizes
func GetThumbnailSizes() map[string]ThumbnailSize {
	return map[string]ThumbnailSize{
		"small":  SmallThumbnail,
		"medium": MediumThumbnail,
		"large":  LargeThumbnail,
	}
}

// GenerateThumbnail creates a thumbnail for the given image
func GenerateThumbnail(originalPath, thumbnailPath string, size ThumbnailSize) error {
	// Open original image
	file, err := os.Open(originalPath)
	if err != nil {
		return fmt.Errorf("failed to open original image: %w", err)
	}
	defer file.Close()

	// Decode image
	img, format, err := image.Decode(file)
	if err != nil {
		return fmt.Errorf("failed to decode image: %w", err)
	}

	// Calculate new dimensions while preserving aspect ratio
	originalBounds := img.Bounds()
	originalWidth := uint(originalBounds.Dx())
	originalHeight := uint(originalBounds.Dy())

	// Skip if image is already smaller than thumbnail size
	if originalWidth <= size.MaxWidth && originalHeight <= size.MaxHeight {
		// Just copy the original file
		return copyImageFile(originalPath, thumbnailPath)
	}

	// Calculate new dimensions
	var newWidth, newHeight uint
	if originalWidth > originalHeight {
		// Landscape: limit by width
		newWidth = size.MaxWidth
		newHeight = uint(float64(originalHeight) * float64(size.MaxWidth) / float64(originalWidth))
		if newHeight > size.MaxHeight {
			// Still too tall, limit by height instead
			newHeight = size.MaxHeight
			newWidth = uint(float64(originalWidth) * float64(size.MaxHeight) / float64(originalHeight))
		}
	} else {
		// Portrait or square: limit by height
		newHeight = size.MaxHeight
		newWidth = uint(float64(originalWidth) * float64(size.MaxHeight) / float64(originalHeight))
		if newWidth > size.MaxWidth {
			// Still too wide, limit by width instead
			newWidth = size.MaxWidth
			newHeight = uint(float64(originalHeight) * float64(size.MaxWidth) / float64(originalWidth))
		}
	}

	// Resize image
	resizedImg := resize.Resize(newWidth, newHeight, img, resize.Lanczos3)

	// Create thumbnail directory if it doesn't exist
	thumbnailDir := filepath.Dir(thumbnailPath)
	if err := os.MkdirAll(thumbnailDir, 0755); err != nil {
		return fmt.Errorf("failed to create thumbnail directory: %w", err)
	}

	// Create thumbnail file
	thumbnailFile, err := os.Create(thumbnailPath)
	if err != nil {
		return fmt.Errorf("failed to create thumbnail file: %w", err)
	}
	defer thumbnailFile.Close()

	// Encode and save thumbnail with optimized settings
	switch strings.ToLower(format) {
	case "jpeg", "jpg":
		// Use progressive JPEG for better loading experience
		err = jpeg.Encode(thumbnailFile, resizedImg, &jpeg.Options{
			Quality: size.Quality,
		})
	case "png":
		// Use PNG encoder for PNG images to preserve transparency
		encoder := png.Encoder{
			CompressionLevel: png.BestCompression,
		}
		err = encoder.Encode(thumbnailFile, resizedImg)
	default:
		// Default to high-quality JPEG for other formats
		err = jpeg.Encode(thumbnailFile, resizedImg, &jpeg.Options{
			Quality: size.Quality,
		})
	}

	if err != nil {
		return fmt.Errorf("failed to encode thumbnail: %w", err)
	}

	return nil
}

// GetThumbnailPath generates the path for a thumbnail
func GetThumbnailPath(originalFilename, sizeName string) string {
	ext := filepath.Ext(originalFilename)
	nameWithoutExt := strings.TrimSuffix(originalFilename, ext)
	return filepath.Join("gallery", "thumbnails", sizeName, nameWithoutExt+"_"+sizeName+ext)
}

// ThumbnailExists checks if a thumbnail already exists
func ThumbnailExists(thumbnailPath string) bool {
	_, err := os.Stat(thumbnailPath)
	return err == nil
}

// GenerateThumbnailIfNeeded creates a thumbnail only if it doesn't exist
func GenerateThumbnailIfNeeded(originalPath, originalFilename, sizeName string) (string, error) {
	thumbnailPath := GetThumbnailPath(originalFilename, sizeName)
	
	// Check if thumbnail already exists
	if ThumbnailExists(thumbnailPath) {
		return thumbnailPath, nil
	}

	// Get thumbnail size configuration
	sizes := GetThumbnailSizes()
	size, exists := sizes[sizeName]
	if !exists {
		return "", fmt.Errorf("unknown thumbnail size: %s", sizeName)
	}

	// Generate thumbnail
	err := GenerateThumbnail(originalPath, thumbnailPath, size)
	if err != nil {
		return "", fmt.Errorf("failed to generate thumbnail: %w", err)
	}

	return thumbnailPath, nil
}

// copyImageFile copies an image file (used when original is smaller than thumbnail size)
func copyImageFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	// Create destination directory if it doesn't exist
	dstDir := filepath.Dir(dst)
	if err := os.MkdirAll(dstDir, 0755); err != nil {
		return err
	}

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = sourceFile.Seek(0, 0)
	if err != nil {
		return err
	}

	_, err = destFile.ReadFrom(sourceFile)
	return err
}
