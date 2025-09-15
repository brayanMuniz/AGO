package handlers

import (
	"database/sql"
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

		var albumType string
		err := db.QueryRow("SELECT type FROM albums WHERE id = ?", id).Scan(&albumType)
		if err != nil {
			c.JSON(404, gin.H{"error": "Album not found"})
			return
		}

		var images []database.ImageResult

		if albumType == "manual" {
			rows, err := db.Query(`
				SELECT images.id, images.phash, images.filename, images.width, images.height, images.favorite, images.like_count, images.rating
				FROM album_images
				JOIN images ON album_images.image_id = images.id
				WHERE album_images.album_id = ?
			`, id)

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
			images, err = database.GetSmartAlbumImages(db, albumID)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
		}

		c.JSON(200, images)
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
			IncludeTagIDs string `json:"include_tag_ids"`
			ExcludeTagIDs string `json:"exclude_tag_ids"`
			MinRating     int    `json:"min_rating"`
			FavoriteOnly  bool   `json:"favorite_only"`
		}

		err := db.QueryRow(`
			SELECT include_tag_ids, exclude_tag_ids, min_rating, favorite_only
			FROM smart_album_filters 
			WHERE album_id = ?`,
			albumID,
		).Scan(&filters.IncludeTagIDs, &filters.ExcludeTagIDs, &filters.MinRating, &filters.FavoriteOnly)

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
			IncludeTagIDs string `json:"include_tag_ids"`
			ExcludeTagIDs string `json:"exclude_tag_ids"`
			MinRating     int    `json:"min_rating"`
			FavoriteOnly  bool   `json:"favorite_only"`
			CoverImageID  *int   `json:"cover_image_id"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": "Invalid input"})
			return
		}

		// Update smart album filters
		_, err := db.Exec(`
			UPDATE smart_album_filters 
			SET include_tag_ids = ?, exclude_tag_ids = ?, min_rating = ?, favorite_only = ? 
			WHERE album_id = ?`,
			input.IncludeTagIDs, input.ExcludeTagIDs, input.MinRating, input.FavoriteOnly, albumID,
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
		rows, err := db.Query("SELECT id, name, type, cover_image_id FROM albums")
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
			rows.Scan(&id, &name, &typ, &coverImageID)

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
