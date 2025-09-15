package database

import (
	"database/sql"
	"fmt"
	"strings"
)

type Tag struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	Category   string `json:"category"`
	ImageCount int    `json:"imageCount"`
	IsFavorite bool   `json:"isFavorite"`
}

func GetTagsByCategory(db *sql.DB, category string) ([]Tag, error) {
	rows, err := db.Query(`
        SELECT t.id, t.name, t.category,
               COUNT(it.image_id) as image_count,
               COALESCE(t.favorite, false) as is_favorite
        FROM tags t
        LEFT JOIN image_tags it ON t.id = it.tag_id
        WHERE t.category = ?
        GROUP BY t.id, t.name, t.category, t.favorite
        ORDER BY t.name
    `, category)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []Tag
	for rows.Next() {
		var tg Tag
		if err := rows.Scan(&tg.ID, &tg.Name, &tg.Category, &tg.ImageCount, &tg.IsFavorite); err != nil {
			return nil, err
		}
		tags = append(tags, tg)
	}
	return tags, rows.Err()
}

func AddTagToImage(db *sql.DB, imageID int, tagName string, category string) error {
	tagName = strings.TrimSpace(tagName)
	if tagName == "" {
		return fmt.Errorf("tag name is empty")
	}

	// Insert tag into `tags` table if it doesn't exist
	tagInsert := `
		INSERT INTO tags (name, category)
		VALUES (?, ?)
		ON CONFLICT(name) DO UPDATE SET category=excluded.category;
	`
	_, err := db.Exec(tagInsert, tagName, category)
	if err != nil {
		return fmt.Errorf("insert tag: %w", err)
	}

	// Get tag ID
	var tagID int
	err = db.QueryRow(`SELECT id FROM tags WHERE name = ?`, tagName).Scan(&tagID)
	if err != nil {
		return fmt.Errorf("get tag id: %w", err)
	}

	// Insert into `image_tags`
	linkInsert := `INSERT OR IGNORE INTO image_tags (image_id, tag_id) VALUES (?, ?)`
	_, err = db.Exec(linkInsert, imageID, tagID)
	if err != nil {
		return fmt.Errorf("link tag to image: %w", err)
	}

	return nil
}

func RemoveTagFromImage(db *sql.DB, imageID int, tagName string) error {
	var tagID int
	err := db.QueryRow(`SELECT id FROM tags WHERE name = ?`, tagName).Scan(&tagID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil // Tag doesn't exist, nothing to remove
		}
		return fmt.Errorf("get tag id: %w", err)
	}

	delStmt := `DELETE FROM image_tags WHERE image_id = ? AND tag_id = ?`
	_, err = db.Exec(delStmt, imageID, tagID)
	if err != nil {
		return fmt.Errorf("remove tag from image: %w", err)
	}

	return nil
}
