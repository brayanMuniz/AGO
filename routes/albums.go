package routes

import (
	"database/sql"

	"github.com/brayanMuniz/AGO/internal/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterAlbumRoutes(r *gin.RouterGroup, db *sql.DB) {
	albumGroup := r.Group("/albums")

	albumGroup.GET("/", handlers.GetAlbumsHandler(db))
	albumGroup.POST("/", handlers.CreateAlbumHandler(db))
	albumGroup.GET("/:id/images", handlers.GetAlbumImagesHandler(db))
	albumGroup.DELETE("/:id", handlers.DeleteAlbumHandler(db))

	// Manual album image management
	albumGroup.POST("/:id/images/:imageId", handlers.AddImageToAlbumHandler(db))
	albumGroup.DELETE("/:id/images/:imageId", handlers.RemoveImageFromAlbumHandler(db))

	// Smart album filter update
	albumGroup.PUT("/:id/filters", handlers.UpdateSmartAlbumFiltersHandler(db))
}
