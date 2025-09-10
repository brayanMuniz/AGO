package main

import (
	"github.com/brayanMuniz/AGO/database"
	"github.com/brayanMuniz/AGO/routes"
	_ "github.com/mattn/go-sqlite3"
	"log"
)

func main() {
	database, err := database.InitDB("./galleryDB.db")
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	r := routes.SetupRouter(database)
	if err := r.Run(":8081"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
