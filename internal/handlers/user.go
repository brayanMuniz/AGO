package handlers

import (
	"database/sql"
	"strconv"

	"github.com/gin-gonic/gin"
)

func AddTagFavoriteHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		tagIDStr := c.Param("id")
		tagID, err := strconv.Atoi(tagIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid tag ID"})
			return
		}

		// Update the tag to set favorite = true
		_, err = db.Exec("UPDATE tags SET favorite = true WHERE id = ?", tagID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to add favorite"})
			return
		}

		c.JSON(200, gin.H{"message": "Added to favorites"})
	}
}

func RemoveTagFavoriteHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		tagIDStr := c.Param("id")
		tagID, err := strconv.Atoi(tagIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid tag ID"})
			return
		}

		// Update the tag to set favorite = false
		_, err = db.Exec("UPDATE tags SET favorite = false WHERE id = ?", tagID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to remove favorite"})
			return
		}

		c.JSON(200, gin.H{"message": "Removed from favorites"})
	}
}
