package database

import (
	"database/sql"
	"fmt"
	"strings"
)

func GetSmartAlbumImages(db *sql.DB, albumID int) ([]ImageResult, error) {
	var includeTagCSV, excludeTagCSV string
	var minRating int
	var favoriteOnly bool

	query := `SELECT include_tag_ids, exclude_tag_ids, min_rating, favorite_only FROM smart_album_filters WHERE album_id = ?`
	err := db.QueryRow(query, albumID).Scan(&includeTagCSV, &excludeTagCSV, &minRating, &favoriteOnly)
	if err != nil {
		return nil, err
	}

	includeIDs := parseCSV(includeTagCSV)
	excludeIDs := parseCSV(excludeTagCSV)

	base := `
	SELECT DISTINCT images.id, images.phash, images.filename, images.width, images.height, images.favorite, images.like_count, images.rating
	FROM images
	LEFT JOIN image_tags ON images.id = image_tags.image_id
	WHERE 1=1
	`

	conditions := []string{}
	args := []any{}

	if len(includeIDs) > 0 {
		placeholders := strings.Repeat("?,", len(includeIDs))
		placeholders = strings.TrimRight(placeholders, ",")
		conditions = append(conditions, fmt.Sprintf("image_tags.tag_id IN (%s)", placeholders))
		for _, id := range includeIDs {
			args = append(args, id)
		}
	}

	if len(excludeIDs) > 0 {
		placeholders := strings.Repeat("?,", len(excludeIDs))
		placeholders = strings.TrimRight(placeholders, ",")
		conditions = append(conditions, fmt.Sprintf(`images.id NOT IN (
			SELECT image_id FROM image_tags WHERE tag_id IN (%s)
		)`, placeholders))
		for _, id := range excludeIDs {
			args = append(args, id)
		}
	}

	if minRating > 0 {
		conditions = append(conditions, "images.rating >= ?")
		args = append(args, minRating)
	}

	if favoriteOnly {
		conditions = append(conditions, "images.favorite = 1")
	}

	finalQuery := base
	if len(conditions) > 0 {
		finalQuery += " AND " + strings.Join(conditions, " AND ")
	}

	rows, err := db.Query(finalQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []ImageResult
	for rows.Next() {
		var img ImageResult
		err := rows.Scan(&img.ID, &img.Phash, &img.Filename, &img.Width, &img.Height, &img.Favorite, &img.Likes, &img.Rating)
		if err != nil {
			return nil, err
		}
		results = append(results, img)
	}

	return results, nil
}

func GetSmartAlbumImagesPaginated(db *sql.DB, albumID int, page, limit int, sortBy string) ([]ImageResult, int, error) {
	var includeTagCSV, excludeTagCSV string
	var minRating int
	var favoriteOnly bool

	query := `SELECT include_tag_ids, exclude_tag_ids, min_rating, favorite_only FROM smart_album_filters WHERE album_id = ?`
	err := db.QueryRow(query, albumID).Scan(&includeTagCSV, &excludeTagCSV, &minRating, &favoriteOnly)
	if err != nil {
		return nil, 0, err
	}

	includeIDs := parseCSV(includeTagCSV)
	excludeIDs := parseCSV(excludeTagCSV)

	// Build order by clause
	var orderBy string
	switch sortBy {
	case "date_asc":
		orderBy = "ORDER BY images.id ASC"
	case "date_desc":
		orderBy = "ORDER BY images.id DESC"
	case "rating_desc":
		orderBy = "ORDER BY images.rating DESC, images.id DESC"
	case "rating_asc":
		orderBy = "ORDER BY images.rating ASC, images.id ASC"
	case "likes_desc":
		orderBy = "ORDER BY images.like_count DESC, images.id DESC"
	case "likes_asc":
		orderBy = "ORDER BY images.like_count ASC, images.id ASC"
	case "random":
		orderBy = "ORDER BY RANDOM()"
	default:
		orderBy = "ORDER BY RANDOM()"
	}

	base := `
	SELECT DISTINCT images.id, images.phash, images.filename, images.width, images.height, images.favorite, images.like_count, images.rating
	FROM images
	LEFT JOIN image_tags ON images.id = image_tags.image_id
	WHERE 1=1
	`

	conditions := []string{}
	args := []any{}

	if len(includeIDs) > 0 {
		placeholders := strings.Repeat("?,", len(includeIDs))
		placeholders = strings.TrimRight(placeholders, ",")
		conditions = append(conditions, fmt.Sprintf("image_tags.tag_id IN (%s)", placeholders))
		for _, id := range includeIDs {
			args = append(args, id)
		}
	}

	if len(excludeIDs) > 0 {
		placeholders := strings.Repeat("?,", len(excludeIDs))
		placeholders = strings.TrimRight(placeholders, ",")
		conditions = append(conditions, fmt.Sprintf(`images.id NOT IN (
			SELECT image_id FROM image_tags WHERE tag_id IN (%s)
		)`, placeholders))
		for _, id := range excludeIDs {
			args = append(args, id)
		}
	}

	if minRating > 0 {
		conditions = append(conditions, "images.rating >= ?")
		args = append(args, minRating)
	}

	if favoriteOnly {
		conditions = append(conditions, "images.favorite = 1")
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " AND " + strings.Join(conditions, " AND ")
	}

	// Get total count
	countQuery := `
	SELECT COUNT(DISTINCT images.id)
	FROM images
	LEFT JOIN image_tags ON images.id = image_tags.image_id
	WHERE 1=1` + whereClause

	var totalCount int
	err = db.QueryRow(countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * limit
	finalQuery := base + whereClause + " " + orderBy + " LIMIT ? OFFSET ?"
	paginatedArgs := append(args, limit, offset)

	rows, err := db.Query(finalQuery, paginatedArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var results []ImageResult
	for rows.Next() {
		var img ImageResult
		err := rows.Scan(&img.ID, &img.Phash, &img.Filename, &img.Width, &img.Height, &img.Favorite, &img.Likes, &img.Rating)
		if err != nil {
			return nil, 0, err
		}
		results = append(results, img)
	}

	return results, totalCount, nil
}

func parseCSV(csv string) []string {
	if csv == "" {
		return []string{}
	}
	parts := strings.Split(csv, ",")
	for i, p := range parts {
		parts[i] = strings.TrimSpace(p)
	}
	return parts
}
