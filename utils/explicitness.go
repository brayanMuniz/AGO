package utils

// ExplicitnessMapping maps user-friendly explicitness levels to database tag names
var ExplicitnessMapping = map[string]string{
	"general":      "rating_general",
	"sensitive":    "rating_sensitive",
	"questionable": "rating_questionable",
	"explicit":     "rating_explicit",
}

// MapExplicitnessToTags converts user-friendly explicitness levels to database tag names
func MapExplicitnessToTags(explicitnessLevels []string) []string {
	var ratingTags []string
	for _, level := range explicitnessLevels {
		if tagName, exists := ExplicitnessMapping[level]; exists {
			ratingTags = append(ratingTags, tagName)
		}
	}
	return ratingTags
}

// IsValidExplicitnessLevel checks if the given level is a valid explicitness level
func IsValidExplicitnessLevel(level string) bool {
	_, exists := ExplicitnessMapping[level]
	return exists
}

// GetAllExplicitnessLevels returns all valid explicitness level names
func GetAllExplicitnessLevels() []string {
	levels := make([]string, 0, len(ExplicitnessMapping))
	for level := range ExplicitnessMapping {
		levels = append(levels, level)
	}
	return levels
}
