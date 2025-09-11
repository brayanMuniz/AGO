package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

var supportedExtensions = []string{".jpg", ".jpeg", ".png", ".webp", ".gif"}

func InsertImageWithTags(db *sql.DB, phash string, tags []string, tagCategoryMap map[string]string, width, height int) error {
	imagePath, err := FindImageFile(phash)
	if err != nil {
		return fmt.Errorf("image file not found for phash %s: %w", phash, err)
	}

	filename := filepath.Base(imagePath)

	var imageID int64
	imageInsertStmt := `INSERT INTO images (phash, filename, width, height) VALUES (?, ?, ?, ?)`
	result, err := db.Exec(imageInsertStmt, phash, filename, width, height)
	if err != nil {
		return fmt.Errorf("insert image: %w", err)
	}
	imageID, err = result.LastInsertId()
	if err != nil {
		return fmt.Errorf("get last insert ID: %w", err)
	}

	for _, tag := range tags {
		tag = sanitizeTag(tag)
		if tag == "" {
			continue
		}

		category := tagCategoryMap[tag]

		var tagID int64
		tagInsertStmt := `
			INSERT INTO tags (name, category) 
			VALUES (?, ?)
			ON CONFLICT(name) DO UPDATE SET category=excluded.category;
		`
		_, err := db.Exec(tagInsertStmt, tag, category)
		if err != nil {
			return fmt.Errorf("insert tag '%s': %w", tag, err)
		}

		err = db.QueryRow(`SELECT id FROM tags WHERE name = ?`, tag).Scan(&tagID)
		if err != nil {
			return fmt.Errorf("get tag ID for '%s': %w", tag, err)
		}

		linkStmt := `INSERT OR IGNORE INTO image_tags (image_id, tag_id) VALUES (?, ?)`
		_, err = db.Exec(linkStmt, imageID, tagID)
		if err != nil {
			return fmt.Errorf("link image to tag '%s': %w", tag, err)
		}
	}

	return nil
}

func sanitizeTag(tag string) string {
	tag = filepath.Base(tag)
	tag = string([]rune(tag)) // remove bad characters if needed
	return tag
}

// FindImageFile finds the first image file matching a phash with common extensions in the gallery folder.
func FindImageFile(phash string) (string, error) {
	extensions := []string{".jpeg", ".jpg", ".png", ".webp", ".gif"}

	for _, ext := range extensions {
		fullPath := filepath.Join("./gallery", phash+ext)
		if _, err := os.Stat(fullPath); err == nil {
			return fullPath, nil
		}
	}

	return "", fmt.Errorf("no matching image file found for %s", phash)
}

type ImageResult struct {
	Phash    string `json:"phash"`
	Filename string `json:"filename"`
	Width    int    `json:"width"`
	Height   int    `json:"height"`
}

func GetImagesByTags(db *sql.DB, tags []string) ([]ImageResult, error) {
	if len(tags) == 0 {
		return nil, fmt.Errorf("no tags provided")
	}

	placeholders := strings.TrimRight(strings.Repeat("?,", len(tags)), ",")
	query := fmt.Sprintf(`
		SELECT images.phash, images.filename, images.width, images.height
		FROM images
		JOIN image_tags ON images.id = image_tags.image_id
		JOIN tags ON tags.id = image_tags.tag_id
		WHERE tags.name IN (%s)
		GROUP BY images.id
		HAVING COUNT(DISTINCT tags.name) = ?
	`, placeholders)

	// Arguments for IN clause + final count check
	args := make([]any, len(tags)+1)
	for i, tag := range tags {
		args[i] = tag
	}
	args[len(tags)] = len(tags)

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []ImageResult
	for rows.Next() {
		var img ImageResult
		if err := rows.Scan(&img.Phash, &img.Filename, &img.Width, &img.Height); err != nil {
			return nil, err
		}
		results = append(results, img)
	}

	return results, nil
}

func ImageExists(db *sql.DB, phash string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM images WHERE phash = ?)`
	err := db.QueryRow(query, phash).Scan(&exists)
	return exists, err
}
