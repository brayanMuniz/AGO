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

func GetImagesByTagsHandler(db *sql.DB) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tagsParam := ctx.Query("tags")
		if tagsParam == "" {
			ctx.JSON(400, gin.H{"error": "Missing tags parameter"})
			return
		}
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
