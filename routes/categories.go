package routes

import (
	"database/sql"

	"github.com/brayanMuniz/AGO/database"
	"github.com/gin-gonic/gin"
)

func RegisterCategoriesRoute(r *gin.RouterGroup, db *sql.DB) {

	categoryGroup := r.Group("/categories")

	categoryGroup.GET("/tags", categoryHandler(db, "general"))
	categoryGroup.GET("/series", categoryHandler(db, "copyright"))
	categoryGroup.GET("/characters", categoryHandler(db, "character"))
	categoryGroup.GET("/artists", categoryHandler(db, "artist"))
	categoryGroup.GET("/ratings", ratingsHandler())
	
	// Get tag info by name
	categoryGroup.GET("/tag/:name", getTagByNameHandler(db))

}

func categoryHandler(db *sql.DB, category string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tags, err := database.GetTagsByCategory(db, category)
		if err != nil {
			ctx.JSON(500, gin.H{"error": "Failed to fetch tags"})
			return
		}
		ctx.JSON(200, gin.H{"tags": tags})
	}
}

func ratingsHandler() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ratings := []map[string]interface{}{
			{"id": 1, "name": "general", "category": "rating"},
			{"id": 2, "name": "sensitive", "category": "rating"},
			{"id": 3, "name": "questionable", "category": "rating"},
			{"id": 4, "name": "explicit", "category": "rating"},
		}
		ctx.JSON(200, gin.H{"tags": ratings})
	}
}

func getTagByNameHandler(db *sql.DB) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tagName := ctx.Param("name")
		if tagName == "" {
			ctx.JSON(400, gin.H{"error": "Tag name is required"})
			return
		}
		
		tag, err := database.GetTagByName(db, tagName)
		if err != nil {
			ctx.JSON(500, gin.H{"error": "Failed to fetch tag"})
			return
		}
		
		if tag == nil {
			ctx.JSON(404, gin.H{"error": "Tag not found"})
			return
		}
		
		ctx.JSON(200, tag)
	}
}
