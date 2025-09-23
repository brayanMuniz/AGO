package handlers

import (
	"database/sql"
	"strings"
	"github.com/brayanMuniz/AGO/database"
	"github.com/gin-gonic/gin"
	"strconv"
)

func CreateAlbumHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			Name         string `json:"name"`
			Type         string `json:"type"`           // "manual" or "smart"
			CoverImageID *int   `json:"cover_image_id"` // Optional
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": "Invalid input"})
			return
		}

		res, err := db.Exec("INSERT INTO albums (name, type, cover_image_id) VALUES (?, ?, ?)", input.Name, input.Type, input.CoverImageID)

		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		id, _ := res.LastInsertId()

		// If smart album, create an empty filter entry
		if input.Type == "smart" {
			_, err := db.Exec("INSERT INTO smart_album_filters (album_id) VALUES (?)", id)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to initialize smart album filters"})
				return
			}
		}

		c.JSON(200, gin.H{"id": id})
	}
}

func GetAlbumImagesHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		
		// Parse pagination parameters
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
		sortBy := c.DefaultQuery("sort", "random")

		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 100 {
			limit = 20
		}

		offset := (page - 1) * limit

		var albumType string
		err := db.QueryRow("SELECT type FROM albums WHERE id = ?", id).Scan(&albumType)
		if err != nil {
			c.JSON(404, gin.H{"error": "Album not found"})
			return
		}

		var images []database.ImageResult
		var totalCount int

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

		if albumType == "manual" {
			// Get total count
			err = db.QueryRow(`
				SELECT COUNT(*)
				FROM album_images
				JOIN images ON album_images.image_id = images.id
				WHERE album_images.album_id = ?
			`, id).Scan(&totalCount)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}

			// Get paginated results
			query := `
				SELECT images.id, images.phash, images.filename, images.width, images.height, images.favorite, images.like_count, images.rating
				FROM album_images
				JOIN images ON album_images.image_id = images.id
				WHERE album_images.album_id = ?
				` + orderBy + `
				LIMIT ? OFFSET ?
			`

			rows, err := db.Query(query, id, limit, offset)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			for rows.Next() {
				var img database.ImageResult
				err := rows.Scan(&img.ID, &img.Phash, &img.Filename, &img.Width, &img.Height, &img.Favorite, &img.Likes, &img.Rating)
				if err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				images = append(images, img)
			}

		} else if albumType == "smart" {
			albumID, _ := strconv.Atoi(id)
			images, totalCount, err = database.GetSmartAlbumImagesPaginated(db, albumID, page, limit, sortBy)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
		}

		totalPages := (totalCount + limit - 1) / limit

		c.JSON(200, gin.H{
			"images": images,
			"pagination": gin.H{
				"current_page": page,
				"total_pages":  totalPages,
				"total_count":  totalCount,
				"limit":        limit,
			},
		})
	}
}

func AddImageToAlbumHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		albumID := c.Param("id")
		imageID := c.Param("imageId")

		_, err := db.Exec("INSERT OR IGNORE INTO album_images (album_id, image_id) VALUES (?, ?)", albumID, imageID)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.Status(204)
	}
}

func RemoveImageFromAlbumHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		albumID := c.Param("id")
		imageID := c.Param("imageId")

		_, err := db.Exec("DELETE FROM album_images WHERE album_id = ? AND image_id = ?", albumID, imageID)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.Status(204)
	}
}

func GetSmartAlbumFiltersHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		albumID := c.Param("id")

		var filters struct {
			IncludeTagIDs   string `json:"include_tag_ids"`
			ExcludeTagIDs   string `json:"exclude_tag_ids"`
			MinRating       int    `json:"min_rating"`
			FavoriteOnly    bool   `json:"favorite_only"`
			IncludeAlbumIDs string `json:"include_album_ids"`
			ExcludeAlbumIDs string `json:"exclude_album_ids"`
		}

		err := db.QueryRow(`
			SELECT include_tag_ids, exclude_tag_ids, min_rating, favorite_only, 
			       COALESCE(include_album_ids, '') as include_album_ids, 
			       COALESCE(exclude_album_ids, '') as exclude_album_ids
			FROM smart_album_filters 
			WHERE album_id = ?`,
			albumID,
		).Scan(&filters.IncludeTagIDs, &filters.ExcludeTagIDs, &filters.MinRating, &filters.FavoriteOnly, &filters.IncludeAlbumIDs, &filters.ExcludeAlbumIDs)

		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, filters)
	}
}

func UpdateSmartAlbumFiltersHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		albumID := c.Param("id")

		var input struct {
			IncludeTagIDs   string `json:"include_tag_ids"`
			ExcludeTagIDs   string `json:"exclude_tag_ids"`
			MinRating       int    `json:"min_rating"`
			FavoriteOnly    bool   `json:"favorite_only"`
			IncludeAlbumIDs string `json:"include_album_ids"`
			ExcludeAlbumIDs string `json:"exclude_album_ids"`
			CoverImageID    *int   `json:"cover_image_id"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": "Invalid input"})
			return
		}

		// Update smart album filters
		_, err := db.Exec(`
			UPDATE smart_album_filters 
			SET include_tag_ids = ?, exclude_tag_ids = ?, min_rating = ?, favorite_only = ?, 
			    include_album_ids = ?, exclude_album_ids = ?
			WHERE album_id = ?`,
			input.IncludeTagIDs, input.ExcludeTagIDs, input.MinRating, input.FavoriteOnly, 
			input.IncludeAlbumIDs, input.ExcludeAlbumIDs, albumID,
		)

		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		// Update cover image in albums table if provided
		if input.CoverImageID != nil {
			_, err = db.Exec(`
				UPDATE albums 
				SET cover_image_id = ? 
				WHERE id = ?`,
				input.CoverImageID, albumID,
			)
		}

		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.Status(204)
	}
}

func GetAlbumsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query(`
			SELECT a.id, a.name, a.type, a.cover_image_id, COUNT(ai.image_id) as image_count
			FROM albums a
			LEFT JOIN album_images ai ON a.id = ai.album_id
			GROUP BY a.id, a.name, a.type, a.cover_image_id
		`)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var albums []map[string]any

		for rows.Next() {
			var id int
			var name, typ string
			var coverImageID sql.NullInt64
			var imageCount int
			rows.Scan(&id, &name, &typ, &coverImageID, &imageCount)

			var coverID *int
			if coverImageID.Valid {
				tmp := int(coverImageID.Int64)
				coverID = &tmp
			}

			albums = append(albums, map[string]any{
				"id":             id,
				"name":           name,
				"type":           typ,
				"cover_image_id": coverID,
				"imageCount":     imageCount,
			})

		}

		// to not break front end
		if albums == nil {
			c.JSON(200, []map[string]any{})
			return
		}

		c.JSON(200, albums)
	}
}

func DeleteAlbumHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		_, err := db.Exec("DELETE FROM albums WHERE id = ?", id)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.Status(204)
	}
}

func UpdateAlbumHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		albumIDStr := c.Param("id")
		albumID, err := strconv.Atoi(albumIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid album ID"})
			return
		}

		var input struct {
			Name         *string `json:"name"`
			CoverImageID *int    `json:"cover_image_id"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request body"})
			return
		}

		// Build dynamic update query
		updates := []string{}
		args := []interface{}{}

		if input.Name != nil {
			updates = append(updates, "name = ?")
			args = append(args, *input.Name)
		}

		if input.CoverImageID != nil {
			updates = append(updates, "cover_image_id = ?")
			args = append(args, *input.CoverImageID)
		}

		if len(updates) == 0 {
			c.JSON(400, gin.H{"error": "No fields to update"})
			return
		}

		// Add album ID to args
		args = append(args, albumID)

		query := "UPDATE albums SET " + strings.Join(updates, ", ") + " WHERE id = ?"
		_, err = db.Exec(query, args...)

		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to update album"})
			return
		}

		c.JSON(200, gin.H{"message": "Album updated successfully"})
	}
}

func UpdateAlbumCoverHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		albumIDStr := c.Param("id")
		albumID, err := strconv.Atoi(albumIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid album ID"})
			return
		}

		var input struct {
			CoverImageID int `json:"cover_image_id"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request body"})
			return
		}

		// Update cover image in albums table
		_, err = db.Exec(`
			UPDATE albums 
			SET cover_image_id = ? 
			WHERE id = ?`,
			input.CoverImageID, albumID,
		)

		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to update album cover"})
			return
		}

		c.JSON(200, gin.H{"message": "Album cover updated successfully"})
	}
}

func AddImagesToAlbumHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		albumIDStr := c.Param("id")
		albumID, err := strconv.Atoi(albumIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid album ID"})
			return
		}

		var input struct {
			ImageIds []int `json:"imageIds"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request body"})
			return
		}

		if len(input.ImageIds) == 0 {
			c.JSON(400, gin.H{"error": "No image IDs provided"})
			return
		}

		// Verify album exists and is manual
		var albumType string
		err = db.QueryRow("SELECT type FROM albums WHERE id = ?", albumID).Scan(&albumType)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(404, gin.H{"error": "Album not found"})
				return
			}
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		if albumType != "manual" {
			c.JSON(400, gin.H{"error": "Can only add images to manual albums"})
			return
		}

		// Add images to album
		for _, imageID := range input.ImageIds {
			_, err = db.Exec(`
				INSERT OR IGNORE INTO album_images (album_id, image_id) 
				VALUES (?, ?)`,
				albumID, imageID,
			)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to add images to album"})
				return
			}
		}

		c.JSON(200, gin.H{"message": "Images added to album successfully"})
	}
}

func RemoveImagesFromAlbumHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		albumIDStr := c.Param("id")
		albumID, err := strconv.Atoi(albumIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid album ID"})
			return
		}

		var input struct {
			ImageIds []int `json:"imageIds"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request body"})
			return
		}

		if len(input.ImageIds) == 0 {
			c.JSON(400, gin.H{"error": "No image IDs provided"})
			return
		}

		// Verify album exists and is manual
		var albumType string
		err = db.QueryRow("SELECT type FROM albums WHERE id = ?", albumID).Scan(&albumType)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(404, gin.H{"error": "Album not found"})
				return
			}
			c.JSON(500, gin.H{"error": "Database error"})
			return
		}

		if albumType != "manual" {
			c.JSON(400, gin.H{"error": "Can only remove images from manual albums"})
			return
		}

		// Remove images from album
		for _, imageID := range input.ImageIds {
			_, err = db.Exec(`
				DELETE FROM album_images 
				WHERE album_id = ? AND image_id = ?`,
				albumID, imageID,
			)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to remove images from album"})
				return
			}
		}

		c.JSON(200, gin.H{"message": "Images removed from album successfully"})
	}
}
