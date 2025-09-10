package routes

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

func SetupRouter(database *sql.DB) *gin.Engine {
	r := gin.Default()

	api := r.Group("/api")

	RegisterImageRoutes(api)

	return r
}
