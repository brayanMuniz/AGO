package database

import (
	"database/sql"
	"fmt"
	"path/filepath"
	"strings"
)

// InsertImageWithTags inserts the image and links it to its tags
func InsertImageWithTags(db *sql.DB, phash, filename string, tags []string, tagCategoryMap map[string]string) error {
	// Insert image
	var imageID int64
	imageInsertStmt := `INSERT INTO images (phash, filename) VALUES (?, ?)`
	result, err := db.Exec(imageInsertStmt, phash, filename)
	if err != nil {
		return fmt.Errorf("insert image: %w", err)
	}
	imageID, err = result.LastInsertId()
	if err != nil {
		return fmt.Errorf("get last insert ID: %w", err)
	}

	// For each tag: insert if missing, then link
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

type ImageResult struct {
	Phash    string `json:"phash"`
	Filename string `json:"filename"`
}

func GetImagesByTags(db *sql.DB, tags []string) ([]ImageResult, error) {
	if len(tags) == 0 {
		return nil, fmt.Errorf("no tags provided")
	}

	placeholders := strings.TrimRight(strings.Repeat("?,", len(tags)), ",")
	query := fmt.Sprintf(`
		SELECT images.phash, images.filename
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
		if err := rows.Scan(&img.Phash, &img.Filename); err != nil {
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
