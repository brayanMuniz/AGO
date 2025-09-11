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
