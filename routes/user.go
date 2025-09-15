package routes

import (
	"database/sql"

	"github.com/brayanMuniz/AGO/internal/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(r *gin.RouterGroup, db *sql.DB) {
	userGroup := r.Group("/user")
	favoriteGroup := userGroup.Group("/favorite")

	// Tag favorites
	favoriteGroup.POST("/tag/:id", handlers.AddTagFavoriteHandler(db))
	favoriteGroup.DELETE("/tag/:id", handlers.RemoveTagFavoriteHandler(db))

	// Artist favorites
	favoriteGroup.POST("/artist/:id", handlers.AddTagFavoriteHandler(db))
	favoriteGroup.DELETE("/artist/:id", handlers.RemoveTagFavoriteHandler(db))

	// Character favorites
	favoriteGroup.POST("/character/:id", handlers.AddTagFavoriteHandler(db))
	favoriteGroup.DELETE("/character/:id", handlers.RemoveTagFavoriteHandler(db))

	// Series favorites
	favoriteGroup.POST("/series/:id", handlers.AddTagFavoriteHandler(db))
	favoriteGroup.DELETE("/series/:id", handlers.RemoveTagFavoriteHandler(db))
}
