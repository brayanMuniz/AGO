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
	{

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

		// moves images with raw file names to gallery
		imageGroup.POST("/organize", func(ctx *gin.Context) {
			err := images.OrganizeImages("./raw_images", "./gallery")
			if err != nil {
				ctx.JSON(500, gin.H{"error": err.Error()})
				return
			}
			ctx.JSON(200, gin.H{"status": "Images processed successfully"})
		})

		// maps the organized images with the tags from each respestive text file into the db
		imageGroup.POST("/import", func(ctx *gin.Context) {
			// Load tag → category map
			tagMap, err := images.LoadTagCategoryMapping("./tag_to_category.json")
			if err != nil {
				ctx.JSON(500, gin.H{"error": "Failed to load tag metadata"})
				return
			}

			// Folder with raw txt tags
			txtDir := "./raw_txt_files"
			files, err := os.ReadDir(txtDir)
			if err != nil {
				ctx.JSON(500, gin.H{"error": "Failed to read tag files"})
				return
			}

			// Process each txt file
			for _, file := range files {
				if file.IsDir() || !strings.HasSuffix(file.Name(), ".txt") {
					continue
				}

				phash := strings.TrimSuffix(file.Name(), ".txt")

				exists, err := database.ImageExists(db, phash)
				if err != nil {
					continue // log error if needed
				}
				if exists {
					fmt.Printf("Skipping %s: already in DB\n", phash)
					continue
				}

				tagFilePath := filepath.Join(txtDir, file.Name())
				tags, err := images.LoadTagsFromFile(tagFilePath)
				if err != nil {
					continue
				}

				err = database.InsertImageWithTags(db, phash, file.Name(), tags, tagMap)
				if err != nil {
					fmt.Printf("Failed to insert image %s: %v\n", phash, err)
					continue
				}
			}

			ctx.JSON(200, gin.H{"status": "Imported images from tag files"})
		})
	}

}
