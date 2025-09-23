package routes

import (
	"database/sql"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

func SetupRouter(database *sql.DB) *gin.Engine {
	r := gin.Default()

	// Add gzip compression middleware for better performance
	r.Use(gzip.Gzip(gzip.DefaultCompression))

	api := r.Group("/api")

	RegisterImageRoutes(api, database)
	RegisterCategoriesRoute(api, database)
	RegisterAlbumRoutes(api, database)
	RegisterUserRoutes(api, database)

	return r
}
