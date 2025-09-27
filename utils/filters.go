package utils

import (
	"fmt"
	"strings"
)

// FilterCondition represents a SQL filter condition with its arguments
type FilterCondition struct {
	SQL  string
	Args []interface{}
}

// BuildTagFilterCondition creates a SQL condition for filtering images by tags
// category: 'character', 'general', 'rating', etc.
// include: if true, creates an IN condition; if false, creates a NOT IN condition
func BuildTagFilterCondition(tags []string, category string, include bool) FilterCondition {
	if len(tags) == 0 {
		return FilterCondition{}
	}

	// Create placeholders for the IN clause
	placeholders := strings.TrimRight(strings.Repeat("?,", len(tags)), ",")
	
	// Choose IN or NOT IN based on include parameter
	operator := "IN"
	if !include {
		operator = "NOT IN"
	}

	// Build the SQL condition
	sql := fmt.Sprintf(`
		images.id %s (
			SELECT DISTINCT it.image_id 
			FROM image_tags it 
			JOIN tags t ON it.tag_id = t.id 
			WHERE t.name IN (%s) AND t.category = '%s'
		)`, operator, placeholders, category)

	// Convert tags to interface{} slice for SQL args
	args := make([]interface{}, len(tags))
	for i, tag := range tags {
		args[i] = tag
	}

	return FilterCondition{
		SQL:  sql,
		Args: args,
	}
}

// BuildCharacterFilterCondition creates a filter condition for character tags
func BuildCharacterFilterCondition(characters []string, include bool) FilterCondition {
	return BuildTagFilterCondition(characters, "character", include)
}

// BuildGeneralTagFilterCondition creates a filter condition for general tags
func BuildGeneralTagFilterCondition(tags []string, include bool) FilterCondition {
	return BuildTagFilterCondition(tags, "general", include)
}

// BuildExplicitnessFilterCondition creates a filter condition for explicitness/rating tags
func BuildExplicitnessFilterCondition(explicitnessLevels []string, include bool) FilterCondition {
	// Map explicitness levels to rating tags
	ratingTags := MapExplicitnessToTags(explicitnessLevels)
	return BuildTagFilterCondition(ratingTags, "rating", include)
}

// CombineFilterConditions combines multiple filter conditions into a single WHERE clause
func CombineFilterConditions(conditions []FilterCondition) (string, []interface{}) {
	if len(conditions) == 0 {
		return "", nil
	}

	var sqlParts []string
	var allArgs []interface{}

	for _, condition := range conditions {
		if condition.SQL != "" {
			sqlParts = append(sqlParts, condition.SQL)
			allArgs = append(allArgs, condition.Args...)
		}
	}

	if len(sqlParts) == 0 {
		return "", nil
	}

	whereClause := "WHERE " + strings.Join(sqlParts, " AND ")
	return whereClause, allArgs
}
