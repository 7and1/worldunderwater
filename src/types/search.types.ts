export type SearchResultType = "article" | "product" | "disaster";

export interface BaseSearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  url: string;
  score: number;
  highlightedTitle?: string;
  highlightedDescription?: string;
}

export interface ArticleSearchResult extends BaseSearchResult {
  type: "article";
  publishedAt: string;
  readingTime?: number;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface ProductSearchResult extends BaseSearchResult {
  type: "product";
  price?: number;
  currency?: string;
  category?: string;
  thumbnailUrl?: string;
  inStock?: boolean;
}

export interface DisasterSearchResult extends BaseSearchResult {
  type: "disaster";
  disasterType: string;
  severity?: string;
  location?: string;
  startDate?: string;
  isActive?: boolean;
}

export type SearchResult =
  | ArticleSearchResult
  | ProductSearchResult
  | DisasterSearchResult;

export interface SearchFilters {
  types?: SearchResultType[];
  disasterTypes?: string[];
  productCategories?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchQuery {
  q: string;
  page?: number;
  limit?: number;
  filters?: SearchFilters;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  query: string;
  filters: SearchFilters;
  suggestions?: string[];
}

export interface RecentSearch {
  query: string;
  timestamp: number;
  resultCount?: number;
}

export interface SearchIndexEntry {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  content?: string;
  url: string;
  metadata: Record<string, unknown>;
  indexedAt: number;
}
