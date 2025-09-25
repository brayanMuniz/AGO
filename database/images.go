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

func UpdateImageFields(db *sql.DB, imageID int, updates map[string]any) error {
	if len(updates) == 0 {
		return nil
	}

	setClauses := []string{}
	args := []any{}
	for col, val := range updates {
		setClauses = append(setClauses, fmt.Sprintf("%s = ?", col))
		args = append(args, val)
	}
	args = append(args, imageID)

	query := fmt.Sprintf("UPDATE images SET %s WHERE id = ?", strings.Join(setClauses, ", "))
	_, err := db.Exec(query, args...)
	return err
}

// finds the first image file matching a phash with common extensions in the gallery folder.
func FindImageFile(phash string) (string, error) {
	for _, ext := range supportedExtensions {
		fullPath := filepath.Join("./gallery", phash+ext)
		if _, err := os.Stat(fullPath); err == nil {
			return fullPath, nil
		}
	}

	return "", fmt.Errorf("no matching image file found for %s", phash)
}

type TagInfo struct {
	Name     string `json:"name"`
	Favorite bool   `json:"favorite"`
}

type ImageResult struct {
	ID       int                    `json:"id"`
	Phash    string                 `json:"phash"`
	Filename string                 `json:"filename"`
	Width    int                    `json:"width"`
	Height   int                    `json:"height"`
	Favorite bool                   `json:"favorite"`
	Likes    int                    `json:"likes"`
	Rating   int                    `json:"rating"`
	Tags     map[string][]TagInfo   `json:"tags"` // Grouped by category with favorite info
}

func GetImagesByTags(db *sql.DB, tags []string) ([]ImageResult, error) {
	if len(tags) == 0 {
		return nil, fmt.Errorf("no tags provided")
	}

	placeholders := strings.TrimRight(strings.Repeat("?,", len(tags)), ",")
	query := fmt.Sprintf(`
	SELECT 
		images.id,
		images.phash,
		images.filename,
		images.width,
		images.height,
		images.favorite,
		images.like_count,
		images.rating
	FROM images
	JOIN image_tags ON images.id = image_tags.image_id
	JOIN tags ON tags.id = image_tags.tag_id
	WHERE tags.name IN (%s)
	GROUP BY images.id
	HAVING COUNT(DISTINCT tags.name) = ?
	`, placeholders)

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
		err := rows.Scan(
			&img.ID,
			&img.Phash,
			&img.Filename,
			&img.Width,
			&img.Height,
			&img.Favorite,
			&img.Likes,
			&img.Rating,
		)
		if err != nil {
			return nil, err
		}
		results = append(results, img)
	}

	return results, nil
}

func GetImagesByTagsPaginated(db *sql.DB, tags []string, page, limit int, sortBy string, seed string) ([]ImageResult, int, error) {
	if len(tags) == 0 {
		return nil, 0, fmt.Errorf("no tags provided")
	}

	offset := (page - 1) * limit

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
		if seed != "" {
			// Use seeded random for reproducible results
			orderBy = fmt.Sprintf("ORDER BY (images.id * %s) %% 1000000", seed)
		} else {
			orderBy = "ORDER BY RANDOM()"
		}
	default:
		orderBy = "ORDER BY RANDOM()"
	}

	placeholders := strings.TrimRight(strings.Repeat("?,", len(tags)), ",")

	// Get total count first
	countQuery := fmt.Sprintf(`
		SELECT COUNT(DISTINCT images.id)
		FROM images
		JOIN image_tags ON images.id = image_tags.image_id
		JOIN tags ON tags.id = image_tags.tag_id
		WHERE tags.name IN (%s)
		GROUP BY images.id
		HAVING COUNT(DISTINCT tags.name) = ?
	`, placeholders)

	args := make([]any, len(tags)+1)
	for i, tag := range tags {
		args[i] = tag
	}
	args[len(tags)] = len(tags)

	// Count total matching images
	var totalCount int
	countRows, err := db.Query(countQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer countRows.Close()

	for countRows.Next() {
		totalCount++
	}

	// Get paginated results
	query := fmt.Sprintf(`
		SELECT 
			images.id,
			images.phash,
			images.filename,
			images.width,
			images.height,
			images.favorite,
			images.like_count,
			images.rating
		FROM images
		JOIN image_tags ON images.id = image_tags.image_id
		JOIN tags ON tags.id = image_tags.tag_id
		WHERE tags.name IN (%s)
		GROUP BY images.id
		HAVING COUNT(DISTINCT tags.name) = ?
		%s
		LIMIT ? OFFSET ?
	`, placeholders, orderBy)

	paginatedArgs := make([]any, len(tags)+3)
	for i, tag := range tags {
		paginatedArgs[i] = tag
	}
	paginatedArgs[len(tags)] = len(tags)
	paginatedArgs[len(tags)+1] = limit
	paginatedArgs[len(tags)+2] = offset

	rows, err := db.Query(query, paginatedArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var results []ImageResult
	for rows.Next() {
		var img ImageResult
		err := rows.Scan(
			&img.ID,
			&img.Phash,
			&img.Filename,
			&img.Width,
			&img.Height,
			&img.Favorite,
			&img.Likes,
			&img.Rating,
		)
		if err != nil {
			return nil, 0, err
		}
		results = append(results, img)
	}

	return results, totalCount, nil
}

func GetImageByID(db *sql.DB, id int) (*ImageResult, error) {
	query := `
		SELECT id, phash, filename, width, height, favorite, rating, like_count
		FROM images
		WHERE id = ?
	`

	row := db.QueryRow(query, id)

	var img ImageResult
	if err := row.Scan(&img.ID, &img.Phash, &img.Filename, &img.Width, &img.Height, &img.Favorite, &img.Rating, &img.Likes); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // not found
		}
		return nil, fmt.Errorf("failed to get image: %w", err)
	}

	tags, err := GetTagsByImageID(db, img.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tags: %w", err)
	}
	img.Tags = tags

	return &img, nil
}

func GetTagsByImageID(db *sql.DB, imageID int) (map[string][]TagInfo, error) {
	query := `
		SELECT tags.name, tags.category, tags.favorite
		FROM tags
		JOIN image_tags ON tags.id = image_tags.tag_id
		WHERE image_tags.image_id = ?
	`

	rows, err := db.Query(query, imageID)
	if err != nil {
		return nil, fmt.Errorf("query tags for image: %w", err)
	}
	defer rows.Close()

	tagsByCategory := make(map[string][]TagInfo)

	for rows.Next() {
		var name string
		var category sql.NullString
		var favorite bool
		if err := rows.Scan(&name, &category, &favorite); err != nil {
			return nil, fmt.Errorf("scan tag: %w", err)
		}

		cat := "uncategorized"
		if category.Valid && category.String != "" {
			cat = category.String
		}

		tagInfo := TagInfo{
			Name:     name,
			Favorite: favorite,
		}

		tagsByCategory[cat] = append(tagsByCategory[cat], tagInfo)
	}

	return tagsByCategory, nil
}

func ImageExists(db *sql.DB, phash string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM images WHERE phash = ?)`
	err := db.QueryRow(query, phash).Scan(&exists)
	return exists, err
}
