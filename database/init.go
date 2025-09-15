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

func createStartingTables(db *sql.DB) error {
	_, err := db.Exec(`
	CREATE TABLE IF NOT EXISTS images (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    phash TEXT UNIQUE NOT NULL,
	    filename TEXT,
	    width INTEGER,
	    height INTEGER,
	    rating INTEGER DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
	    favorite BOOLEAN DEFAULT FALSE,
	    like_count INTEGER DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS tags (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    name TEXT UNIQUE NOT NULL,
	    category TEXT,
	    favorite BOOLEAN DEFAULT FALSE
	);

	CREATE TABLE IF NOT EXISTS image_tags (
	    image_id INTEGER NOT NULL,
	    tag_id INTEGER NOT NULL,
	    PRIMARY KEY (image_id, tag_id),
	    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
	    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS albums (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    name TEXT NOT NULL,
	    type TEXT CHECK(type IN ('manual', 'smart')) NOT NULL
	);

	CREATE TABLE IF NOT EXISTS album_images (
	    album_id INTEGER,
	    image_id INTEGER,
	    PRIMARY KEY (album_id, image_id),
	    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
	    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS smart_album_filters (
	    album_id INTEGER PRIMARY KEY,
	    include_tag_ids TEXT,   
	    exclude_tag_ids TEXT,   
	    min_rating INTEGER,    
	    favorite_only BOOLEAN,
	    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
	);


	`)
	return err
}
