package routes

import (
	"database/sql"

	"github.com/brayanMuniz/AGO/internal/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterImageRoutes(r *gin.RouterGroup, db *sql.DB) {
	imageGroup := r.Group("/images")
	{
		imageGroup.GET("/", handlers.GetImagesHandler(db))
		imageGroup.GET("/by-tags", handlers.GetImagesByTagsHandler(db))
		imageGroup.GET("/file/:filename", handlers.ServeImageFileHandler())
		imageGroup.POST("/organize", handlers.OrganizeImagesHandler())
		imageGroup.POST("/import", handlers.PopulateDatabaseHanlder(db))

		imageGroup.GET("/:id", handlers.GetImageByIDHandler(db))

		imageUpdateGroup := imageGroup.Group("/:id")
		{
			// Tag management
			imageUpdateGroup.POST("/tags", handlers.AddTagToImageHandler(db))
			imageUpdateGroup.DELETE("/tags", handlers.RemoveTagFromImageHandler(db))
		}

	}

	imageUpdateGroup := imageGroup.Group("/:id")
	{
		imageUpdateGroup.POST("/like", handlers.UpdateSingleImageFieldHandler[int](db, "like_count"))
		imageUpdateGroup.POST("/favorite", handlers.UpdateSingleImageFieldHandler[bool](db, "favorite"))
		imageUpdateGroup.POST("/rate", handlers.UpdateSingleImageFieldHandler[int](db, "rating"))

	}

}
