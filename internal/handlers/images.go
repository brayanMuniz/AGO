package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/brayanMuniz/AGO/database"
	"github.com/brayanMuniz/AGO/internal/images"
	"github.com/gin-gonic/gin"
)

func GetImagesHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parse query parameters
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

		// Build query based on sort parameter
		var orderBy string
		switch sortBy {
		case "date_asc":
			orderBy = "ORDER BY id ASC"
		case "date_desc":
			orderBy = "ORDER BY id DESC"
		case "rating_desc":
			orderBy = "ORDER BY rating DESC, id DESC"
		case "rating_asc":
			orderBy = "ORDER BY rating ASC, id ASC"
		case "likes_desc":
			orderBy = "ORDER BY like_count DESC, id DESC"
		case "likes_asc":
			orderBy = "ORDER BY like_count ASC, id ASC"
		case "random":
			orderBy = "ORDER BY RANDOM()"
		default:
			orderBy = "ORDER BY RANDOM()"
		}

		// Get total count
		var totalCount int
		countQuery := "SELECT COUNT(*) FROM images"
		err := db.QueryRow(countQuery).Scan(&totalCount)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count images"})
			return
		}

		// Get images with pagination
		query := fmt.Sprintf(`
			SELECT id, phash, filename, width, height, favorite, like_count, rating
			FROM images
			%s
			LIMIT ? OFFSET ?
		`, orderBy)

		rows, err := db.Query(query, limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch images"})
			return
		}
		defer rows.Close()

		var images []database.ImageResult
		for rows.Next() {
			var img database.ImageResult
			err := rows.Scan(&img.ID, &img.Phash, &img.Filename, &img.Width, &img.Height, &img.Favorite, &img.Likes, &img.Rating)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan image"})
				return
			}
			images = append(images, img)
		}

		totalPages := (totalCount + limit - 1) / limit

		c.JSON(http.StatusOK, gin.H{
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

func GetImageByIDHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		id, err := strconv.Atoi(idStr)
		if err != nil || id < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
			return
		}

		img, err := database.GetImageByID(db, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch image"})
			return
		}

		if img == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
			return
		}

		c.JSON(http.StatusOK, img)
	}
}

func GetImagesByTagsHandler(db *sql.DB) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tagsParam := ctx.Query("tags")
		if tagsParam == "" {
			ctx.JSON(400, gin.H{"error": "Missing tags parameter"})
			return
		}

		// Parse pagination parameters
		page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))
		sortBy := ctx.DefaultQuery("sort", "random")

		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 100 {
			limit = 20
		}

		tagList := strings.Split(tagsParam, ",")
		for i := range tagList {
			tagList[i] = strings.TrimSpace(tagList[i])
		}

		// Get paginated results
		results, totalCount, err := database.GetImagesByTagsPaginated(db, tagList, page, limit, sortBy)
		if err != nil {
			ctx.JSON(500, gin.H{"error": err.Error()})
			return
		}

		totalPages := (totalCount + limit - 1) / limit

		ctx.JSON(200, gin.H{
			"images": results,
			"pagination": gin.H{
				"current_page": page,
				"total_pages":  totalPages,
				"total_count":  totalCount,
				"limit":        limit,
			},
		})
	}
}

func ServeImageFileHandler() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		filename := ctx.Param("filename")
		if filename == "" {
			ctx.JSON(400, gin.H{"error": "filename is required"})
			return
		}
		filename = filepath.Base(filename)
		fullPath := filepath.Join("./gallery", filename)
		if _, err := os.Stat(fullPath); err != nil {
			ctx.JSON(404, gin.H{"error": "file not found"})
			return
		}
		ctx.File(fullPath)
	}
}

func UpdateSingleImageFieldHandler[T any](db *sql.DB, fieldName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := c.Param("id")
		imageID, err := strconv.Atoi(idParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
			return
		}

		var body map[string]T
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON body"})
			return
		}

		val, ok := body[fieldName]
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Missing '%s' field in request body", fieldName)})
			return
		}

		updates := map[string]any{fieldName: val}

		if err := database.UpdateImageFields(db, imageID, updates); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to update image: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":   "success",
			"image_id": imageID,
			fieldName:  val,
		})
	}
}

func AddTagToImageHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		imageID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
			return
		}

		var body struct {
			Tag      string `json:"tag"`
			Category string `json:"category"`
		}

		if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Tag) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tag and category are required"})
			return
		}

		err = database.AddTagToImage(db, imageID, body.Tag, body.Category)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "tag added", "tag": body.Tag})
	}
}

func RemoveTagFromImageHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		imageID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
			return
		}

		var body struct {
			Tag string `json:"tag"`
		}

		if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Tag) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tag is required"})
			return
		}

		err = database.RemoveTagFromImage(db, imageID, body.Tag)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "tag removed", "tag": body.Tag})
	}
}

// moves images with raw file names to gallery
func OrganizeImagesHandler() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		err := images.OrganizeImages("./raw_images", "./gallery")
		if err != nil {
			ctx.JSON(500, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(200, gin.H{"status": "Images processed successfully"})
	}
}

// populates database by cross referencing images and text files
func PopulateDatabaseHanlder(db *sql.DB) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tagMap, err := images.LoadTagCategoryMapping("./tag_to_category.json")
		if err != nil {
			ctx.JSON(500, gin.H{"error": "Failed to load tag metadata"})
			return
		}

		txtDir := "./raw_txt_files"
		files, err := os.ReadDir(txtDir)
		if err != nil {
			ctx.JSON(500, gin.H{"error": "Failed to read tag files"})
			return
		}

		for _, file := range files {
			if file.IsDir() || !strings.HasSuffix(file.Name(), ".txt") {
				continue
			}

			phash := strings.TrimSuffix(file.Name(), ".txt")

			exists, err := database.ImageExists(db, phash)
			if err != nil || exists {
				continue
			}

			tagFilePath := filepath.Join(txtDir, file.Name())
			tags, err := images.LoadTagsFromFile(tagFilePath)
			if err != nil {
				continue
			}

			// Get image dimensions
			imagePath, err := database.FindImageFile(phash)
			if err != nil {
				fmt.Printf("Could not find image for %s: %v\n", phash, err)
				continue
			}

			width, height, err := images.GetImageDimensions(imagePath)
			if err != nil {
				fmt.Printf("Failed to read image dimensions for %s: %v\n", phash, err)
				continue
			}

			// Insert into DB
			err = database.InsertImageWithTags(db, phash, tags, tagMap, width, height)
			if err != nil {
				fmt.Printf("Failed to insert image %s: %v\n", phash, err)
				continue
			}
		}

		ctx.JSON(200, gin.H{"status": "Imported images from tag files"})

	}
}
