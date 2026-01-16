"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { SearchResult } from "@/types/search.types";

const RECENT_SEARCHES_KEY = "wu:recentSearches";
const MAX_RECENT_SEARCHES = 5;
const DEBOUNCE_MS = 200;

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModalState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  selectedIndex: number;
  showRecent: boolean;
  recentSearches: string[];
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<ModalState>({
    query: "",
    results: [],
    loading: false,
    selectedIndex: -1,
    showRecent: true,
    recentSearches: loadRecentSearches(),
  });

  function loadRecentSearches(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed
          .map((r: { query: string }) => r.query)
          .slice(0, MAX_RECENT_SEARCHES);
      }
    } catch {}
    return [];
  }

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedIndex: Math.min(
            prev.results.length - 1,
            prev.selectedIndex + 1,
          ),
        }));
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedIndex: Math.max(-1, prev.selectedIndex - 1),
        }));
      }

      if (e.key === "Enter" && state.selectedIndex >= 0) {
        const selected = state.results[state.selectedIndex];
        if (selected) {
          window.location.href = selected.url;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, state.results, state.selectedIndex, onClose]);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setState((prev) => ({
        ...prev,
        results: [],
        loading: false,
        showRecent: true,
      }));
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      loading: true,
      showRecent: false,
      selectedIndex: -1,
    }));

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=6`,
        { signal: abortRef.current.signal },
      );

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        results: data.results || [],
        loading: false,
      }));
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setState((prev) => ({ ...prev, loading: false }));
      }
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.query) {
        performSearch(state.query);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [state.query, performSearch]);

  // Handle input change
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setState((prev) => ({ ...prev, query: e.target.value }));
  }

  // Handle recent search click
  function handleRecentClick(query: string) {
    setState((prev) => ({ ...prev, query, showRecent: false }));
    performSearch(query);
  }

  // Handle result click
  function handleResultClick(result: SearchResult) {
    onClose();
  }

  // Render result item
  function renderResult(result: SearchResult, index: number) {
    const isSelected = state.selectedIndex === index;
    const isArticle = result.type === "article";
    const isProduct = result.type === "product";
    const isDisaster = result.type === "disaster";

    return (
      <Link
        key={result.id + "-modal"}
        href={result.url}
        onClick={() => handleResultClick(result)}
        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
          isSelected ? "bg-ocean-700" : "hover:bg-ocean-800"
        }`}
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded bg-ocean-700 flex items-center justify-center">
          {isArticle ? (
            <svg
              className="w-5 h-5 text-foam-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          ) : isProduct ? (
            <svg
              className="w-5 h-5 text-foam-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-foam-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-ocean-600 text-foam-300 capitalize">
              {result.type}
            </span>
            {isProduct && result.price && (
              <span className="text-xs font-semibold text-surface-300">
                ${result.price}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-foam-100 truncate">
            {result.title}
          </p>
          {result.description && (
            <p className="text-xs text-foam-400 truncate">
              {result.description}
            </p>
          )}
        </div>

        {/* Arrow key hint */}
        <svg
          className="w-4 h-4 text-foam-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-abyss-950/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-ocean-900 rounded-xl shadow-2xl border border-ocean-600 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-ocean-700">
          <svg
            className="w-5 h-5 text-foam-500 flex-shrink-0"
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
          <input
            ref={inputRef}
            type="search"
            value={state.query}
            onChange={handleInputChange}
            placeholder="Search articles, products, disasters..."
            className="flex-1 bg-transparent text-foam-100 placeholder-foam-500 focus:outline-none"
          />
          {state.query && (
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  query: "",
                  results: [],
                  showRecent: true,
                }))
              }
              className="p-1 text-foam-500 hover:text-foam-300"
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
          <kbd className="hidden sm:inline-flex px-2 py-0.5 text-xs font-medium text-foam-500 bg-ocean-800 rounded border border-ocean-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Loading */}
          {state.loading && (
            <div className="px-4 py-8 text-center text-foam-400">
              <div className="inline-block w-6 h-6 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Recent Searches */}
          {!state.loading &&
            state.showRecent &&
            state.recentSearches.length > 0 && (
              <div className="p-4">
                <h3 className="text-xs font-semibold text-foam-400 uppercase tracking-wider mb-3">
                  Recent Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {state.recentSearches.map((query) => (
                    <button
                      key={query}
                      onClick={() => handleRecentClick(query)}
                      className="px-3 py-1.5 text-sm bg-ocean-800 text-foam-200 rounded-lg hover:bg-ocean-700 transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Results List */}
          {!state.loading && state.results.length > 0 && (
            <div className="py-2">
              {state.results.map((result, index) =>
                renderResult(result, index),
              )}
            </div>
          )}

          {/* No Results */}
          {!state.loading && state.query && state.results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-foam-400 mb-4">
                No results found for "{state.query}"
              </p>
              <Link
                href={`/search?q=${encodeURIComponent(state.query)}`}
                onClick={onClose}
                className="inline-flex items-center gap-2 text-ocean-400 hover:text-ocean-300"
              >
                <span>Go to full search page</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            </div>
          )}

          {/* Empty State */}
          {!state.loading &&
            !state.query &&
            state.recentSearches.length === 0 && (
              <div className="px-4 py-8 text-center text-foam-500">
                <p>Start typing to search...</p>
                <p className="text-xs mt-2">
                  Use arrow keys to navigate, Enter to select
                </p>
              </div>
            )}
        </div>

        {/* Footer */}
        {state.results.length > 0 && (
          <div className="px-4 py-3 border-t border-ocean-700 flex items-center justify-between">
            <p className="text-xs text-foam-500">
              Press{" "}
              <kbd className="px-1 py-0.5 bg-ocean-800 rounded">Enter</kbd> to
              visit
            </p>
            <Link
              href={`/search?q=${encodeURIComponent(state.query)}`}
              onClick={onClose}
              className="text-sm text-ocean-400 hover:text-ocean-300"
            >
              View all results
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
