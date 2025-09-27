package database

import (
	"database/sql"
	"fmt"
	"strings"
	
	"github.com/brayanMuniz/AGO/utils"
)

func GetSmartAlbumImages(db *sql.DB, albumID int) ([]ImageResult, error) {
	var includeTagCSV, excludeTagCSV, includeAlbumCSV, excludeAlbumCSV string
	var minRating int
	var favoriteOnly bool

	query := `SELECT include_tag_ids, exclude_tag_ids, min_rating, favorite_only, 
	                 COALESCE(include_album_ids, '') as include_album_ids,
	                 COALESCE(exclude_album_ids, '') as exclude_album_ids
	          FROM smart_album_filters WHERE album_id = ?`
	err := db.QueryRow(query, albumID).Scan(&includeTagCSV, &excludeTagCSV, &minRating, &favoriteOnly, &includeAlbumCSV, &excludeAlbumCSV)
	if err != nil {
		return nil, err
	}

	includeIDs := parseCSV(includeTagCSV)
	excludeIDs := parseCSV(excludeTagCSV)
	includeAlbumIDs := parseCSV(includeAlbumCSV)
	excludeAlbumIDs := parseCSV(excludeAlbumCSV)

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

	// Handle album inclusion/exclusion with proper precedence
	// Include albums: images must be in at least one of these albums
	if len(includeAlbumIDs) > 0 {
		placeholders := strings.Repeat("?,", len(includeAlbumIDs))
		placeholders = strings.TrimRight(placeholders, ",")
		conditions = append(conditions, fmt.Sprintf(`images.id IN (
			SELECT image_id FROM album_images WHERE album_id IN (%s)
		)`, placeholders))
		for _, id := range includeAlbumIDs {
			args = append(args, id)
		}
	}

	// Exclude albums: images must NOT be in any of these albums
	// BUT if an image is in both include and exclude albums, include takes precedence
	if len(excludeAlbumIDs) > 0 {
		placeholders := strings.Repeat("?,", len(excludeAlbumIDs))
		placeholders = strings.TrimRight(placeholders, ",")
		
		if len(includeAlbumIDs) > 0 {
			// If we have include albums, only exclude if the image is NOT in any include album
			includePlaceholders := strings.Repeat("?,", len(includeAlbumIDs))
			includePlaceholders = strings.TrimRight(includePlaceholders, ",")
			conditions = append(conditions, fmt.Sprintf(`(
				images.id NOT IN (
					SELECT image_id FROM album_images WHERE album_id IN (%s)
				) OR images.id IN (
					SELECT image_id FROM album_images WHERE album_id IN (%s)
				)
			)`, placeholders, includePlaceholders))
			// Add exclude album IDs to args
			for _, id := range excludeAlbumIDs {
				args = append(args, id)
			}
			// Add include album IDs to args again for the OR condition
			for _, id := range includeAlbumIDs {
				args = append(args, id)
			}
		} else {
			// No include albums, just exclude
			conditions = append(conditions, fmt.Sprintf(`images.id NOT IN (
				SELECT image_id FROM album_images WHERE album_id IN (%s)
			)`, placeholders))
			for _, id := range excludeAlbumIDs {
				args = append(args, id)
			}
		}
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

func GetSmartAlbumImagesPaginated(db *sql.DB, albumID int, page, limit int, sortBy string, includeCharacters, excludeCharacters, includeTags, excludeTags, includeExplicitness, excludeExplicitness []string) ([]ImageResult, int, error) {
	var includeTagCSV, excludeTagCSV, includeAlbumCSV, excludeAlbumCSV string
	var minRating int
	var favoriteOnly bool

	query := `SELECT include_tag_ids, exclude_tag_ids, min_rating, favorite_only,
	                 COALESCE(include_album_ids, '') as include_album_ids,
	                 COALESCE(exclude_album_ids, '') as exclude_album_ids
	          FROM smart_album_filters WHERE album_id = ?`
	err := db.QueryRow(query, albumID).Scan(&includeTagCSV, &excludeTagCSV, &minRating, &favoriteOnly, &includeAlbumCSV, &excludeAlbumCSV)
	if err != nil {
		return nil, 0, err
	}

	includeIDs := parseCSV(includeTagCSV)
	excludeIDs := parseCSV(excludeTagCSV)
	includeAlbumIDs := parseCSV(includeAlbumCSV)
	excludeAlbumIDs := parseCSV(excludeAlbumCSV)

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

	// Add character filtering conditions
	if len(includeCharacters) > 0 {
		placeholders := strings.Repeat("?,", len(includeCharacters))
		placeholders = strings.TrimRight(placeholders, ",")
		conditions = append(conditions, fmt.Sprintf(`
			images.id IN (
				SELECT DISTINCT it.image_id 
				FROM image_tags it 
				JOIN tags t ON it.tag_id = t.id 
				WHERE t.name IN (%s) AND t.category = 'character'
			)`, placeholders))
		for _, char := range includeCharacters {
			args = append(args, char)
		}
	}

	if len(excludeCharacters) > 0 {
		placeholders := strings.Repeat("?,", len(excludeCharacters))
		placeholders = strings.TrimRight(placeholders, ",")
		conditions = append(conditions, fmt.Sprintf(`
			images.id NOT IN (
				SELECT DISTINCT it.image_id 
				FROM image_tags it 
				JOIN tags t ON it.tag_id = t.id 
				WHERE t.name IN (%s) AND t.category = 'character'
			)`, placeholders))
		for _, char := range excludeCharacters {
			args = append(args, char)
		}
	}

	// Add tag filtering conditions (general tags)
	if len(includeTags) > 0 {
		placeholders := strings.Repeat("?,", len(includeTags))
		placeholders = strings.TrimRight(placeholders, ",")
		conditions = append(conditions, fmt.Sprintf(`
			images.id IN (
				SELECT DISTINCT it.image_id 
				FROM image_tags it 
				JOIN tags t ON it.tag_id = t.id 
				WHERE t.name IN (%s) AND t.category = 'general'
			)`, placeholders))
		for _, tag := range includeTags {
			args = append(args, tag)
		}
	}

	if len(excludeTags) > 0 {
		placeholders := strings.Repeat("?,", len(excludeTags))
		placeholders = strings.TrimRight(placeholders, ",")
		conditions = append(conditions, fmt.Sprintf(`
			images.id NOT IN (
				SELECT DISTINCT it.image_id 
				FROM image_tags it 
				JOIN tags t ON it.tag_id = t.id 
				WHERE t.name IN (%s) AND t.category = 'general'
			)`, placeholders))
		for _, tag := range excludeTags {
			args = append(args, tag)
		}
	}

	// Add explicitness filtering conditions (rating tags)
	if len(includeExplicitness) > 0 {
		// Map user-friendly names to actual tag names using shared utility
		ratingTags := utils.MapExplicitnessToTags(includeExplicitness)
		if len(ratingTags) > 0 {
			placeholders := strings.Repeat("?,", len(ratingTags))
			placeholders = strings.TrimRight(placeholders, ",")
			conditions = append(conditions, fmt.Sprintf(`
				images.id IN (
					SELECT DISTINCT it.image_id 
					FROM image_tags it 
					JOIN tags t ON it.tag_id = t.id 
					WHERE t.name IN (%s) AND t.category = 'rating'
				)`, placeholders))
			for _, tag := range ratingTags {
				args = append(args, tag)
			}
		}
	}

	if len(excludeExplicitness) > 0 {
		// Map user-friendly names to actual tag names using shared utility
		ratingTags := utils.MapExplicitnessToTags(excludeExplicitness)
		if len(ratingTags) > 0 {
			placeholders := strings.Repeat("?,", len(ratingTags))
			placeholders = strings.TrimRight(placeholders, ",")
			conditions = append(conditions, fmt.Sprintf(`
				images.id NOT IN (
					SELECT DISTINCT it.image_id 
					FROM image_tags it 
					JOIN tags t ON it.tag_id = t.id 
					WHERE t.name IN (%s) AND t.category = 'rating'
				)`, placeholders))
			for _, tag := range ratingTags {
				args = append(args, tag)
			}
		}
	}

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

	// Handle album inclusion/exclusion with proper precedence (same logic as non-paginated)
	// Include albums: images must be in at least one of these albums
	if len(includeAlbumIDs) > 0 {
		placeholders := strings.Repeat("?,", len(includeAlbumIDs))
		placeholders = strings.TrimRight(placeholders, ",")
		conditions = append(conditions, fmt.Sprintf(`images.id IN (
			SELECT image_id FROM album_images WHERE album_id IN (%s)
		)`, placeholders))
		for _, id := range includeAlbumIDs {
			args = append(args, id)
		}
	}

	// Exclude albums: images must NOT be in any of these albums
	// BUT if an image is in both include and exclude albums, include takes precedence
	if len(excludeAlbumIDs) > 0 {
		placeholders := strings.Repeat("?,", len(excludeAlbumIDs))
		placeholders = strings.TrimRight(placeholders, ",")
		
		if len(includeAlbumIDs) > 0 {
			// If we have include albums, only exclude if the image is NOT in any include album
			includePlaceholders := strings.Repeat("?,", len(includeAlbumIDs))
			includePlaceholders = strings.TrimRight(includePlaceholders, ",")
			conditions = append(conditions, fmt.Sprintf(`(
				images.id NOT IN (
					SELECT image_id FROM album_images WHERE album_id IN (%s)
				) OR images.id IN (
					SELECT image_id FROM album_images WHERE album_id IN (%s)
				)
			)`, placeholders, includePlaceholders))
			// Add exclude album IDs to args
			for _, id := range excludeAlbumIDs {
				args = append(args, id)
			}
			// Add include album IDs to args again for the OR condition
			for _, id := range includeAlbumIDs {
				args = append(args, id)
			}
		} else {
			// No include albums, just exclude
			conditions = append(conditions, fmt.Sprintf(`images.id NOT IN (
				SELECT image_id FROM album_images WHERE album_id IN (%s)
			)`, placeholders))
			for _, id := range excludeAlbumIDs {
				args = append(args, id)
			}
		}
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
