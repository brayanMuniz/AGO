package routes

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/brayanMuniz/AGO/database"
	"github.com/brayanMuniz/AGO/internal/images"
	"github.com/gin-gonic/gin"
)

func RegisterImageRoutes(r *gin.RouterGroup, db *sql.DB) {
	imageGroup := r.Group("/images")

	// /api/images/by-tags?tags=1girl,heart_hands
	imageGroup.GET("/by-tags", func(ctx *gin.Context) {
		tagsParam := ctx.Query("tags")
		if tagsParam == "" {
			ctx.JSON(400, gin.H{"error": "Missing tags parameter"})
			return
		}

		// Split comma-separated tags into slice
		tagList := strings.Split(tagsParam, ",")
		for i := range tagList {
			tagList[i] = strings.TrimSpace(tagList[i])
		}

		results, err := database.GetImagesByTags(db, tagList)
		if err != nil {
			ctx.JSON(500, gin.H{"error": err.Error()})
			return
		}

		ctx.JSON(200, results)
	})

	// Serve an image by filename from the organized gallery directory
	// GET /api/images/file/:filename
	imageGroup.GET("/file/:filename", func(ctx *gin.Context) {
		filename := ctx.Param("filename")
		if filename == "" {
			ctx.JSON(400, gin.H{"error": "filename is required"})
			return
		}

		filename = filepath.Base(filename) // avoid path traversal

		fullPath := filepath.Join("./gallery", filename)
		if _, err := os.Stat(fullPath); err != nil {
			ctx.JSON(404, gin.H{"error": "file not found"})
			return
		}

		ctx.File(fullPath)
	})

	// moves images with raw file names to gallery
	imageGroup.POST("/organize", func(ctx *gin.Context) {
		err := images.OrganizeImages("./raw_images", "./gallery")
		if err != nil {
			ctx.JSON(500, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(200, gin.H{"status": "Images processed successfully"})
	})

	imageGroup.POST("/import", func(ctx *gin.Context) {
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
	})

}
