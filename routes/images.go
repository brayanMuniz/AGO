package routes

import (
	"github.com/brayanMuniz/AGO/internal/images"
	"github.com/gin-gonic/gin"
)

func RegisterImageRoutes(r *gin.RouterGroup) {
	imageGroup := r.Group("/images")
	{
		imageGroup.POST("/organize", func(ctx *gin.Context) {
			err := images.OrganizeImages("./raw_images", "./gallery")
			if err != nil {
				ctx.JSON(500, gin.H{"error": err.Error()})
				return
			}
			ctx.JSON(200, gin.H{"status": "Images processed successfully"})
		})
	}
}
