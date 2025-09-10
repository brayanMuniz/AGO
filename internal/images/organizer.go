package images

import (
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/corona10/goimagehash"
)

var extensions = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true,
}

func OrganizeImages(rawDir, galleryDir string) error {
	// Ensure gallery directory exists
	if err := os.MkdirAll(galleryDir, os.ModePerm); err != nil {
		log.Fatalf("Failed to create gallery dir: %v", err)
		return err
	}

	err := filepath.WalkDir(rawDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() {
			return nil
		}

		ext := strings.ToLower(filepath.Ext(d.Name()))
		if !extensions[ext] {
			fmt.Printf("Skipping non-image file: %s\n", d.Name())
			return nil
		}

		file, err := os.Open(path)
		if err != nil {
			fmt.Printf("Failed to open file: %s\n", d.Name())
			return nil
		}
		defer file.Close()

		var img image.Image
		switch ext {
		case ".jpg", ".jpeg":
			img, err = jpeg.Decode(file)
		case ".png":
			img, err = png.Decode(file)
		}

		if err != nil {
			fmt.Printf("Failed to decode image: %s\n", d.Name())
			return nil
		}

		hash, err := goimagehash.PerceptionHash(img)
		if err != nil {
			fmt.Printf("Failed to compute hash: %s\n", d.Name())
			return nil
		}

		hashStr := fmt.Sprintf("%x", hash.GetHash())
		newName := fmt.Sprintf("%s%s", hashStr, ext)
		newPath := filepath.Join(galleryDir, newName)

		if _, err := os.Stat(newPath); err == nil {
			fmt.Printf("File already exists: %s, skipping.\n", newName)
			return nil
		}

		err = os.Rename(path, newPath)
		if err != nil {
			fmt.Printf("Failed to move %s: %v\n", d.Name(), err)
			return nil
		}

		fmt.Printf("Moved: %s → %s\n", d.Name(), newName)
		return nil
	})

	if err != nil {
		log.Fatalf("Error walking directory: %v", err)
		return err
	}

	return nil
}
