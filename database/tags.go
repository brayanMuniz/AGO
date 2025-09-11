package database

import (
	"database/sql"
)

type Tag struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	Category   string `json:"category"`
	ImageCount int    `json:"imageCount"`
}

func GetTagsByCategory(db *sql.DB, category string) ([]Tag, error) {
	rows, err := db.Query(`
        SELECT t.id, t.name, t.category,
               COUNT(it.image_id) as image_count
        FROM tags t
        LEFT JOIN image_tags it ON t.id = it.tag_id
        WHERE t.category = ?
        GROUP BY t.id, t.name, t.category
        ORDER BY t.name
    `, category)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []Tag
	for rows.Next() {
		var tg Tag
		if err := rows.Scan(&tg.ID, &tg.Name, &tg.Category, &tg.ImageCount); err != nil {
			return nil, err
		}
		tags = append(tags, tg)
	}
	return tags, rows.Err()
}
