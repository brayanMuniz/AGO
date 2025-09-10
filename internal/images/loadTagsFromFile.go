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
	tags := strings.Split(content, ",")

	// Trim spaces
	for i := range tags {
		tags[i] = strings.TrimSpace(tags[i])
	}

	return tags, nil
}
