package utils

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// ImageQueryParams represents all possible query parameters for image endpoints
type ImageQueryParams struct {
	Page                int
	Limit               int
	SortBy              string
	Seed                string
	IncludeCharacters   string
	ExcludeCharacters   string
	IncludeTags         string
	ExcludeTags         string
	IncludeExplicitness string
	ExcludeExplicitness string
}

// ParseImageQueryParams extracts and validates all image query parameters from gin context
func ParseImageQueryParams(c *gin.Context) ImageQueryParams {
	// Parse pagination parameters with validation
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 1000 {
		limit = 20
	}

	return ImageQueryParams{
		Page:                page,
		Limit:               limit,
		SortBy:              c.DefaultQuery("sort", "random"),
		Seed:                c.DefaultQuery("seed", ""),
		IncludeCharacters:   c.DefaultQuery("include_characters", ""),
		ExcludeCharacters:   c.DefaultQuery("exclude_characters", ""),
		IncludeTags:         c.DefaultQuery("include_tags", ""),
		ExcludeTags:         c.DefaultQuery("exclude_tags", ""),
		IncludeExplicitness: c.DefaultQuery("include_explicitness", ""),
		ExcludeExplicitness: c.DefaultQuery("exclude_explicitness", ""),
	}
}

// ParseFilterArrays converts comma-separated filter strings to trimmed string arrays
func ParseFilterArrays(params ImageQueryParams) (
	includeCharacters, excludeCharacters, includeTags, excludeTags, includeExplicitness, excludeExplicitness []string,
) {
	// Parse character filters
	if params.IncludeCharacters != "" {
		includeCharacters = strings.Split(params.IncludeCharacters, ",")
		for i := range includeCharacters {
			includeCharacters[i] = strings.TrimSpace(includeCharacters[i])
		}
	}
	if params.ExcludeCharacters != "" {
		excludeCharacters = strings.Split(params.ExcludeCharacters, ",")
		for i := range excludeCharacters {
			excludeCharacters[i] = strings.TrimSpace(excludeCharacters[i])
		}
	}
	
	// Parse tag filters
	if params.IncludeTags != "" {
		includeTags = strings.Split(params.IncludeTags, ",")
		for i := range includeTags {
			includeTags[i] = strings.TrimSpace(includeTags[i])
		}
	}
	if params.ExcludeTags != "" {
		excludeTags = strings.Split(params.ExcludeTags, ",")
		for i := range excludeTags {
			excludeTags[i] = strings.TrimSpace(excludeTags[i])
		}
	}
	
	// Parse explicitness filters
	if params.IncludeExplicitness != "" {
		includeExplicitness = strings.Split(params.IncludeExplicitness, ",")
		for i := range includeExplicitness {
			includeExplicitness[i] = strings.TrimSpace(includeExplicitness[i])
		}
	}
	if params.ExcludeExplicitness != "" {
		excludeExplicitness = strings.Split(params.ExcludeExplicitness, ",")
		for i := range excludeExplicitness {
			excludeExplicitness[i] = strings.TrimSpace(excludeExplicitness[i])
		}
	}
	
	return
}

// BuildFilterConditionsFromParams creates filter conditions from parsed parameters
func BuildFilterConditionsFromParams(params ImageQueryParams) []FilterCondition {
	includeCharacters, excludeCharacters, includeTags, excludeTags, includeExplicitness, excludeExplicitness := ParseFilterArrays(params)
	
	var filterConditions []FilterCondition
	
	// Character filters
	if len(includeCharacters) > 0 {
		filterConditions = append(filterConditions, BuildCharacterFilterCondition(includeCharacters, true))
	}
	if len(excludeCharacters) > 0 {
		filterConditions = append(filterConditions, BuildCharacterFilterCondition(excludeCharacters, false))
	}
	
	// Tag filters
	if len(includeTags) > 0 {
		filterConditions = append(filterConditions, BuildGeneralTagFilterCondition(includeTags, true))
	}
	if len(excludeTags) > 0 {
		filterConditions = append(filterConditions, BuildGeneralTagFilterCondition(excludeTags, false))
	}
	
	// Explicitness filters
	if len(includeExplicitness) > 0 {
		filterConditions = append(filterConditions, BuildExplicitnessFilterCondition(includeExplicitness, true))
	}
	if len(excludeExplicitness) > 0 {
		filterConditions = append(filterConditions, BuildExplicitnessFilterCondition(excludeExplicitness, false))
	}
	
	return filterConditions
}
