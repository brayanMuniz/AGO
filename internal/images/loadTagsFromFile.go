package images

import (
	"encoding/json"
	"os"
	"strings"
)

func LoadTagCategoryMapping(path string) (map[string]string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var mapping map[string]string
	if err := json.Unmarshal(data, &mapping); err != nil {
		return nil, err
	}

	return mapping, nil
}

func LoadTagsFromFile(path string) ([]string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	content := strings.TrimSpace(string(data))
	content = strings.TrimSuffix(content, "%")
	rawTags := strings.Split(content, ",")

	// Trim spaces and filter out empty strings
	var tags []string
	for _, tag := range rawTags {
		trimmed := strings.TrimSpace(tag)
		if trimmed != "" {
			tags = append(tags, trimmed)
		}
	}

	return tags, nil
}
