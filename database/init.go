package database

import (
	"database/sql"
)

func InitDB(filepath string) (*sql.DB, error) {
	database, err := sql.Open("sqlite3", filepath)
	if err != nil {
		return nil, err
	}

	if err := createStartingTables(database); err != nil {
		return nil, err
	}

	return database, nil
}

// Create images, tags and image_tags tables
func createStartingTables(db *sql.DB) error {
	_, err := db.Exec(`
	CREATE TABLE IF NOT EXISTS images (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    phash TEXT UNIQUE NOT NULL,
	    filename TEXT
	);

	CREATE TABLE IF NOT EXISTS tags (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    name TEXT UNIQUE NOT NULL,
	    category TEXT
	);

	CREATE TABLE IF NOT EXISTS image_tags (
	    image_id INTEGER NOT NULL,
	    tag_id INTEGER NOT NULL,
	    PRIMARY KEY (image_id, tag_id),
	    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
	    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
	);

	`)
	return err
}
