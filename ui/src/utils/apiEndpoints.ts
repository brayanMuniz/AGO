// Shared API endpoint builder utility to eliminate URL construction duplication

export interface ApiEndpointParams {
  page: number;
  limit: number;
  sort: string;
  seed?: string;
  includeCharacters?: string | string[];
  excludeCharacters?: string | string[];
  includeTags?: string | string[];
  excludeTags?: string | string[];
  includeExplicitness?: string | string[];
  excludeExplicitness?: string | string[];
  includeSeries?: string | string[];
  excludeSeries?: string | string[];
  includeArtists?: string | string[];
  excludeArtists?: string | string[];
}

/**
 * Converts array or string parameters to comma-separated strings
 */
function normalizeFilterParam(param: string | string[] | undefined): string | undefined {
  if (!param) return undefined;
  if (Array.isArray(param)) {
    return param.length > 0 ? param.join(',') : undefined;
  }
  return param;
}

/**
 * Builds query string parameters from the provided params object
 */
function buildQueryParams(params: ApiEndpointParams): string {
  const queryParts: string[] = [];
  
  // Core pagination and sorting parameters
  queryParts.push(`page=${params.page}`);
  queryParts.push(`limit=${params.limit}`);
  queryParts.push(`sort=${params.sort}`);
  
  // Optional seed parameter
  if (params.seed) {
    queryParts.push(`seed=${params.seed}`);
  }
  
  // Filter parameters - normalize arrays to comma-separated strings
  const includeCharacters = normalizeFilterParam(params.includeCharacters);
  if (includeCharacters) {
    queryParts.push(`include_characters=${includeCharacters}`);
  }
  
  const excludeCharacters = normalizeFilterParam(params.excludeCharacters);
  if (excludeCharacters) {
    queryParts.push(`exclude_characters=${excludeCharacters}`);
  }
  
  const includeTags = normalizeFilterParam(params.includeTags);
  if (includeTags) {
    queryParts.push(`include_tags=${includeTags}`);
  }
  
  const excludeTags = normalizeFilterParam(params.excludeTags);
  if (excludeTags) {
    queryParts.push(`exclude_tags=${excludeTags}`);
  }
  
  const includeExplicitness = normalizeFilterParam(params.includeExplicitness);
  if (includeExplicitness) {
    queryParts.push(`include_explicitness=${includeExplicitness}`);
  }
  
  const excludeExplicitness = normalizeFilterParam(params.excludeExplicitness);
  if (excludeExplicitness) {
    queryParts.push(`exclude_explicitness=${excludeExplicitness}`);
  }
  
  const includeSeries = normalizeFilterParam(params.includeSeries);
  if (includeSeries) {
    queryParts.push(`include_series=${includeSeries}`);
  }
  
  const excludeSeries = normalizeFilterParam(params.excludeSeries);
  if (excludeSeries) {
    queryParts.push(`exclude_series=${excludeSeries}`);
  }
  
  const includeArtists = normalizeFilterParam(params.includeArtists);
  if (includeArtists) {
    queryParts.push(`include_artists=${includeArtists}`);
  }
  
  const excludeArtists = normalizeFilterParam(params.excludeArtists);
  if (excludeArtists) {
    queryParts.push(`exclude_artists=${excludeArtists}`);
  }
  
  return queryParts.join('&');
}

/**
 * API Endpoint Builders
 */
export const ApiEndpoints = {
  /**
   * Build URL for general images endpoint
   */
  images: (params: ApiEndpointParams): string => {
    const queryString = buildQueryParams(params);
    return `/api/images?${queryString}`;
  },

  /**
   * Build URL for images by tags endpoint
   */
  imagesByTags: (tags: string, params: ApiEndpointParams): string => {
    const queryString = buildQueryParams(params);
    return `/api/images/by-tags?tags=${encodeURIComponent(tags)}&${queryString}`;
  },

  /**
   * Build URL for album images endpoint
   */
  albumImages: (albumId: string, params: ApiEndpointParams): string => {
    const queryString = buildQueryParams(params);
    return `/api/albums/${albumId}/images?${queryString}`;
  },
};

/**
 * Legacy parameter conversion utilities for backward compatibility
 */
export const LegacyParamConverters = {
  /**
   * Convert from the old individual parameter format to the new unified format
   */
  fromLegacyParams: (legacyParams: {
    page: number;
    limit: number;
    sort: string;
    seed?: string;
    includeCharacters?: string;
    excludeCharacters?: string;
    includeTags?: string;
    excludeTags?: string;
    includeExplicitness?: string;
    excludeExplicitness?: string;
    includeSeries?: string;
    excludeSeries?: string;
    includeArtists?: string;
    excludeArtists?: string;
  }): ApiEndpointParams => {
    return {
      page: legacyParams.page,
      limit: legacyParams.limit,
      sort: legacyParams.sort,
      seed: legacyParams.seed,
      includeCharacters: legacyParams.includeCharacters,
      excludeCharacters: legacyParams.excludeCharacters,
      includeTags: legacyParams.includeTags,
      excludeTags: legacyParams.excludeTags,
      includeExplicitness: legacyParams.includeExplicitness,
      excludeExplicitness: legacyParams.excludeExplicitness,
      includeSeries: legacyParams.includeSeries,
      excludeSeries: legacyParams.excludeSeries,
      includeArtists: legacyParams.includeArtists,
      excludeArtists: legacyParams.excludeArtists,
    };
  },
};
