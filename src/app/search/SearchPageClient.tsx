"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import type {
  SearchResult,
  SearchResponse,
  RecentSearch,
} from "@/types/search.types";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

const RECENT_SEARCHES_KEY = "wu:recentSearches";
const MAX_RECENT_SEARCHES = 8;
const DEBOUNCE_MS = 300;

interface SearchPageState {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: {
    types: string[];
    disasterTypes: string[];
    productCategories: string[];
  };
  suggestions: string[];
  recentSearches: RecentSearch[];
  selectedFilters: Set<string>;
}

export default function SearchPageClient({
  initialQuery,
}: {
  initialQuery: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const abortRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<SearchPageState>({
    results: [],
    total: 0,
    page: 1,
    totalPages: 0,
    loading: false,
    error: null,
    filters: {
      types: ["article", "product", "disaster"],
      disasterTypes: [
        "flood",
        "hurricane",
        "tsunami",
        "wildfire",
        "earthquake",
        "tornado",
        "drought",
        "volcanic",
        "landslide",
        "storm",
        "heat_wave",
        "cold_wave",
      ],
      productCategories: [
        "emergency-kits",
        "water-safety",
        "shelter",
        "communication",
        "first-aid",
        "food-water",
        "lighting",
        "tools",
      ],
    },
    suggestions: [],
    recentSearches: loadRecentSearches(),
    selectedFilters: new Set<string>(),
  });

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const filterPanelOpen = state.filters.types.length > 0;

  // Load recent searches from localStorage
  function loadRecentSearches(): RecentSearch[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Save recent searches to localStorage
  function saveRecentSearches(searches: RecentSearch[]) {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch {}
  }

  // Add to recent searches
  function addRecentSearch(q: string, count: number) {
    const newRecent: RecentSearch = {
      query: q,
      timestamp: Date.now(),
      resultCount: count,
    };

    const filtered = state.recentSearches.filter((s) => s.query !== q);
    const updated = [newRecent, ...filtered].slice(0, MAX_RECENT_SEARCHES);

    setState((prev) => ({ ...prev, recentSearches: updated }));
    saveRecentSearches(updated);
  }

  // Debounce query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string, pageNum = 1) => {
      if (!searchQuery.trim()) {
        setState((prev) => ({
          ...prev,
          results: [],
          total: 0,
          page: 1,
          loading: false,
        }));
        return;
      }

      // Cancel previous request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        page: pageNum,
      }));

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          page: String(pageNum),
          limit: "20",
        });

        // Add selected filters
        const selected = Array.from(state.selectedFilters);
        const types = selected.filter((f) =>
          ["article", "product", "disaster"].includes(f),
        );
        const disasterTypes = selected.filter((f) =>
          state.filters.disasterTypes.includes(f),
        );
        const categories = selected.filter((f) =>
          state.filters.productCategories.includes(f),
        );

        if (types.length) params.set("types", types.join(","));
        if (disasterTypes.length)
          params.set("disasterTypes", disasterTypes.join(","));
        if (categories.length) params.set("categories", categories.join(","));

        const response = await fetch(`/api/search?${params}`, {
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Search failed. Please try again.");
        }

        const data: SearchResponse = await response.json();

        setState((prev) => ({
          ...prev,
          results: data.results,
          total: data.total,
          totalPages: data.totalPages,
          loading: false,
          suggestions: data.suggestions || [],
        }));

        // Add to recent searches on first page
        if (pageNum === 1) {
          addRecentSearch(searchQuery, data.total);
        }

        // Update URL
        router.replace(`${pathname}?q=${encodeURIComponent(searchQuery)}`, {
          scroll: false,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setState((prev) => ({
            ...prev,
            error: err.message,
            loading: false,
          }));
        }
      }
    },
    [state.selectedFilters, state.filters, pathname, router],
  );

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery !== initialQuery || state.page === 1) {
      performSearch(debouncedQuery, state.page);
    }
  }, [debouncedQuery]);

  // Toggle filter
  function toggleFilter(filter: string) {
    setState((prev) => {
      const newSelected = new Set(prev.selectedFilters);
      if (newSelected.has(filter)) {
        newSelected.delete(filter);
      } else {
        newSelected.add(filter);
      }
      return { ...prev, selectedFilters: newSelected, page: 1 };
    });
  }

  // Clear all filters
  function clearFilters() {
    setState((prev) => ({ ...prev, selectedFilters: new Set(), page: 1 }));
  }

  // Handle form submit
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    performSearch(query, 1);
  }

  // Handle suggestion click
  function handleSuggestionClick(suggestion: string) {
    setQuery(suggestion);
  }

  // Handle recent search click
  function handleRecentSearchClick(recent: RecentSearch) {
    setQuery(recent.query);
  }

  // Render result card
  function renderResult(result: SearchResult) {
    const isArticle = result.type === "article";
    const isProduct = result.type === "product";
    const isDisaster = result.type === "disaster";

    return (
      <article
        key={result.id}
        className="card p-5 hover:border-ocean-500/50 transition-colors"
      >
        <div className="flex gap-4">
          {/* Thumbnail */}
          {"thumbnailUrl" in result && result.thumbnailUrl && (
            <Link
              href={result.url}
              className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-ocean-900"
            >
              <img
                src={result.thumbnailUrl}
                alt={result.title}
                className="w-full h-full object-cover"
              />
            </Link>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-ocean-700 text-foam-300 capitalize">
                {result.type}
              </span>
              {isProduct && result.price && (
                <span className="text-sm font-semibold text-surface-300">
                  ${result.price}
                </span>
              )}
              {isDisaster && result.severity && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-abyss-800 text-foam-300 capitalize">
                  {result.severity}
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-foam-100 mb-1 line-clamp-2">
              <Link
                href={result.url}
                dangerouslySetInnerHTML={{
                  __html: result.highlightedTitle || result.title,
                }}
              />
            </h3>

            <p
              className="text-sm text-foam-300 mb-3 line-clamp-2"
              dangerouslySetInnerHTML={{
                __html: result.highlightedDescription || result.description,
              }}
            />

            <div className="flex items-center gap-3 text-xs text-foam-muted">
              {isArticle && result.publishedAt && (
                <time dateTime={result.publishedAt}>
                  {new Date(result.publishedAt).toLocaleDateString()}
                </time>
              )}
              {isProduct && result.category && (
                <span className="capitalize">{result.category}</span>
              )}
              {isDisaster && result.location && <span>{result.location}</span>}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Filters Sidebar */}
      <aside className="lg:col-span-1 space-y-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foam-100">Filters</h3>
            {state.selectedFilters.size > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-ocean-400 hover:text-ocean-300"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Content Type */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-foam-300 uppercase tracking-wider mb-3">
              Content Type
            </h4>
            <div className="space-y-2">
              {["article", "product", "disaster"].map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={state.selectedFilters.has(type)}
                    onChange={() => toggleFilter(type)}
                    className="w-4 h-4 rounded border-ocean-600 bg-ocean-900 text-ocean-500 focus:ring-ocean-500"
                  />
                  <span className="text-sm text-foam-200 capitalize">
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Disaster Type */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-foam-300 uppercase tracking-wider mb-3">
              Disaster Type
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {state.filters.disasterTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={state.selectedFilters.has(type)}
                    onChange={() => toggleFilter(type)}
                    className="w-4 h-4 rounded border-ocean-600 bg-ocean-900 text-ocean-500 focus:ring-ocean-500"
                  />
                  <span className="text-sm text-foam-200 capitalize">
                    {type.replace("_", " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="text-xs font-semibold text-foam-300 uppercase tracking-wider mb-3">
              Product Category
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {state.filters.productCategories.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={state.selectedFilters.has(cat)}
                    onChange={() => toggleFilter(cat)}
                    className="w-4 h-4 rounded border-ocean-600 bg-ocean-900 text-ocean-500 focus:ring-ocean-500"
                  />
                  <span className="text-sm text-foam-200 capitalize">
                    {cat.replace("-", " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Searches */}
        {state.recentSearches.length > 0 && !query && (
          <div className="card p-5">
            <h3 className="font-semibold text-foam-100 mb-3">
              Recent Searches
            </h3>
            <ul className="space-y-2">
              {state.recentSearches.slice(0, 5).map((recent) => (
                <li key={recent.query}>
                  <button
                    onClick={() => handleRecentSearchClick(recent)}
                    className="w-full text-left text-sm text-foam-300 hover:text-foam-100 truncate"
                  >
                    {recent.query}
                    <span className="ml-2 text-xs text-foam-muted">
                      {recent.resultCount} results
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="lg:col-span-3">
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles, products, disasters..."
              className="w-full px-4 py-3 pl-12 bg-ocean-900/50 border border-ocean-600 rounded-lg text-foam-100 placeholder-foam-500 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
              autoFocus
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foam-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-foam-500 hover:text-foam-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* Loading State */}
        {state.loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} variant="card" />
            ))}
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="card p-6 bg-red-900/20 border-red-700">
            <p className="text-red-300">{state.error}</p>
          </div>
        )}

        {/* No Results State */}
        {!state.loading && query && state.results.length === 0 && (
          <div className="card p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-foam-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-foam-100 mb-2">
              No results found
            </h3>
            <p className="text-foam-300 mb-4">
              We could not find any results for "{query}"
            </p>

            {/* Suggestions */}
            {state.suggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-foam-400 mb-2">
                  Try these suggestions:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {state.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 text-sm bg-ocean-700 text-foam-200 rounded-full hover:bg-ocean-600"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-foam-400">
              <p>Try:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Checking your spelling</li>
                <li>Using fewer words</li>
                <li>Using more general terms</li>
                <li>Clearing some filters</li>
              </ul>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!state.loading && !query && (
          <div className="card p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-foam-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-foam-100 mb-2">
              Search World Under Water
            </h3>
            <p className="text-foam-300 mb-4">
              Find disaster coverage, survival guides, and preparedness
              products.
            </p>
            <div className="text-sm text-foam-400">
              <p className="mb-2">Popular searches:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "hurricane",
                  "earthquake",
                  "emergency kit",
                  "water safety",
                ].map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSuggestionClick(term)}
                    className="px-3 py-1 bg-ocean-700 text-foam-200 rounded-full hover:bg-ocean-600"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!state.loading && state.results.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-foam-300">
                Found{" "}
                <span className="font-semibold text-foam-100">
                  {state.total}
                </span>{" "}
                results
                {state.total > 0 && (
                  <span className="text-foam-400"> for "{query}"</span>
                )}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {state.results.map(renderResult)}
            </div>

            {/* Pagination */}
            {state.totalPages > 1 && (
              <nav
                className="flex justify-center gap-2"
                aria-label="Search pagination"
              >
                <button
                  onClick={() => performSearch(query, state.page - 1)}
                  disabled={state.page === 1 || state.loading}
                  className="px-4 py-2 bg-ocean-800 text-foam-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ocean-700"
                >
                  Previous
                </button>

                {Array.from(
                  { length: Math.min(5, state.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (state.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (state.page <= 3) {
                      pageNum = i + 1;
                    } else if (state.page >= state.totalPages - 2) {
                      pageNum = state.totalPages - 4 + i;
                    } else {
                      pageNum = state.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => performSearch(query, pageNum)}
                        disabled={state.loading}
                        className={`px-4 py-2 rounded-lg ${
                          state.page === pageNum
                            ? "bg-ocean-500 text-foam-100"
                            : "bg-ocean-800 text-foam-200 hover:bg-ocean-700"
                        } disabled:opacity-50`}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}

                <button
                  onClick={() => performSearch(query, state.page + 1)}
                  disabled={state.page === state.totalPages || state.loading}
                  className="px-4 py-2 bg-ocean-800 text-foam-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ocean-700"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}
