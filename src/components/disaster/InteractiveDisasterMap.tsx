"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import type { DisasterEvent, DisasterType } from "@/types";
import SeverityBadge from "@/components/ui/SeverityBadge";
import DisasterTypeIcon from "@/components/ui/DisasterTypeIcon";
import { formatRelativeTime, formatLocation } from "@/lib/utils/format";

// Dynamic import of maplibre-gl-js to avoid SSR issues
const MapLibreGlWrapper = dynamic(
  () => import("./MapLibreGlWrapper").then((mod) => mod.MapLibreGlWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-ocean-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-surface-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foam-200">Loading map...</p>
        </div>
      </div>
    ),
  },
);

interface InteractiveDisasterMapProps {
  disasters: DisasterEvent[];
  initialCenter?: [number, number];
  initialZoom?: number;
  onMarkerClick?: (disaster: DisasterEvent) => void;
  className?: string;
}

const disasterColors: Record<DisasterType, string> = {
  flood: "#0ea5e9",
  hurricane: "#6366f1",
  tsunami: "#0891b2",
  wildfire: "#f97316",
  earthquake: "#a855f7",
  tornado: "#8b5cf6",
  drought: "#eab308",
  volcano: "#dc2626",
  volcanic: "#dc2626",
  landslide: "#78716c",
  storm: "#38bdf8",
  heat_wave: "#f97316",
  cold_wave: "#0ea5e9",
};

const severityRadius: Record<string, number> = {
  watch: 12,
  warning: 16,
  emergency: 20,
  catastrophic: 26,
};

function InteractiveDisasterMap({
  disasters,
  initialCenter = [20, 0],
  initialZoom = 2,
  onMarkerClick,
  className = "",
}: InteractiveDisasterMapProps) {
  const mapRef = useRef<any>(null);
  const [selectedDisaster, setSelectedDisaster] =
    useState<DisasterEvent | null>(null);
  const [filterType, setFilterType] = useState<DisasterType | "all">("all");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter disasters based on current filters
  const filteredDisasters = disasters.filter((d) => {
    if (filterType !== "all" && d.type !== filterType) return false;
    if (showActiveOnly && !d.isActive) return false;
    return true;
  });

  // Disaster type filter buttons
  const disasterTypes: (DisasterType | "all")[] = [
    "all",
    "flood",
    "hurricane",
    "wildfire",
    "earthquake",
    "tsunami",
    "tornado",
    "drought",
    "volcano",
    "volcanic",
    "landslide",
    "storm",
    "heat_wave",
    "cold_wave",
  ];

  // Count active disasters by type
  const disasterCounts = disasters.reduce(
    (acc, d) => {
      if (d.isActive) {
        acc[d.type] = (acc[d.type] || 0) + 1;
        acc.all = (acc.all || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  // Handle marker click
  const handleMarkerClick = useCallback(
    (disaster: DisasterEvent) => {
      setSelectedDisaster(disaster);
      onMarkerClick?.(disaster);
    },
    [onMarkerClick],
  );

  // Handle zoom to fit all disasters
  const handleFitBounds = useCallback(() => {
    if (mapRef.current && filteredDisasters.length > 0) {
      const bounds = filteredDisasters.reduce(
        (acc, d) => {
          acc.extend([d.location.lng, d.location.lat]);
          return acc;
        },
        new mapRef.current.LngLatBounds(
          [
            filteredDisasters[0].location.lng,
            filteredDisasters[0].location.lat,
          ],
          [
            filteredDisasters[0].location.lng,
            filteredDisasters[0].location.lat,
          ],
        ),
      );
      mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }
  }, [filteredDisasters]);

  // Get user location
  const handleGetUserLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setUserLocation(loc);
          if (mapRef.current) {
            mapRef.current.flyTo({ center: loc, zoom: 8, speed: 1.5 });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
      );
    }
  }, []);

  // Toggle fullscreen
  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Zoom to specific disaster
  const handleZoomToDisaster = useCallback((disaster: DisasterEvent) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [disaster.location.lng, disaster.location.lat],
        zoom: 8,
        speed: 1.5,
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative h-full min-h-[600px] bg-ocean-900 rounded-xl overflow-hidden ${className}`}
    >
      {/* Map Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row gap-4">
        {/* Filter by type */}
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {disasterTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-200 whitespace-nowrap
                ${
                  filterType === type
                    ? "bg-surface-400 text-abyss-950"
                    : "glass text-foam-200 hover:bg-ocean-700"
                }
              `}
              aria-label={`Filter by ${type} disasters`}
              aria-pressed={filterType === type}
            >
              {type !== "all" && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: disasterColors[type as DisasterType],
                  }}
                  aria-hidden="true"
                />
              )}
              <span className="capitalize">{type.replace("_", " ")}</span>
              {disasterCounts[type] !== undefined && (
                <span
                  className={`
                  px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${filterType === type ? "bg-abyss-950/20" : "bg-ocean-600"}
                `}
                  aria-label={`${disasterCounts[type]} ${type} disasters`}
                >
                  {disasterCounts[type]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Active only toggle */}
        <label className="flex items-center gap-2 glass px-3 py-1.5 rounded-full cursor-pointer">
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
            className="w-4 h-4 rounded border-ocean-600 bg-ocean-800 text-surface-400 focus:ring-surface-400"
            aria-label="Show active disasters only"
          />
          <span className="text-xs text-foam-200">Active only</span>
        </label>
      </div>

      {/* Maplibre GL Map */}
      {mapError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-abyss-950">
          <div className="text-center max-w-md px-4">
            <svg
              className="w-16 h-16 text-coral-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-bold text-foam-100 mb-2">
              Map Unavailable
            </h3>
            <p className="text-sm text-foam-200 mb-4">{mapError}</p>
            <p className="text-xs text-foam-muted">
              Please check your connection or try refreshing the page.
            </p>
          </div>
        </div>
      ) : (
        <MapLibreGlWrapper
          ref={mapRef}
          disasters={filteredDisasters}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          onMarkerClick={handleMarkerClick}
          onError={setMapError}
          disasterColors={disasterColors}
          severityRadius={severityRadius}
          userLocation={userLocation}
        />
      )}

      {/* Map Control Buttons */}
      <div className="absolute bottom-20 right-4 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleFitBounds}
          className="glass p-2 rounded-lg hover:bg-ocean-700 transition-colors group"
          aria-label="Fit all disasters in view"
          title="Fit all disasters in view"
        >
          <svg
            className="w-5 h-5 text-foam-200 group-hover:text-surface-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleGetUserLocation}
          className="glass p-2 rounded-lg hover:bg-ocean-700 transition-colors group"
          aria-label="Show my location"
          title="Show my location"
        >
          <svg
            className="w-5 h-5 text-foam-200 group-hover:text-surface-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
        </button>

        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="glass p-2 rounded-lg hover:bg-ocean-700 transition-colors group"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <svg
              className="w-5 h-5 text-foam-200 group-hover:text-surface-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-foam-200 group-hover:text-surface-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Selected Disaster Panel */}
      {selectedDisaster && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-20">
          <div className="card p-4 glass">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `${disasterColors[selectedDisaster.type]}20`,
                  }}
                >
                  <DisasterTypeIcon
                    type={selectedDisaster.type}
                    className="w-6 h-6"
                    style={{ color: disasterColors[selectedDisaster.type] }}
                  />
                </div>
                <div>
                  <SeverityBadge
                    severity={selectedDisaster.severity}
                    size="sm"
                  />
                  {selectedDisaster.isActive && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-phosphor-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-phosphor-400 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleZoomToDisaster(selectedDisaster)}
                  className="p-1 rounded hover:bg-ocean-700 transition-colors"
                  aria-label="Zoom to disaster"
                  title="Zoom to disaster"
                >
                  <svg
                    className="w-4 h-4 text-foam-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDisaster(null)}
                  className="p-1 rounded hover:bg-ocean-700 transition-colors"
                  aria-label="Close panel"
                >
                  <svg
                    className="w-5 h-5 text-foam-muted"
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
              </div>
            </div>

            <h3 className="text-lg font-bold text-foam-100 mb-2">
              {selectedDisaster.title}
            </h3>
            <p className="text-sm text-foam-200 mb-4 line-clamp-3">
              {selectedDisaster.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-foam-muted mb-4">
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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
                {formatLocation(selectedDisaster.location)}
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatRelativeTime(selectedDisaster.updatedAt)}
              </span>
            </div>

            <div className="flex gap-2">
              <a
                href={`/disasters/${selectedDisaster.id}`}
                className="btn btn-primary flex-1 text-sm"
              >
                View Details
              </a>
              <a
                href={selectedDisaster.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost text-sm"
              >
                {selectedDisaster.source.toUpperCase()}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:block">
        <div className="glass rounded-lg p-3">
          <h4 className="text-xs font-semibold text-foam-muted uppercase tracking-wide mb-2">
            Legend
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(disasterColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span className="text-xs text-foam-200 capitalize">
                  {type.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="absolute top-20 sm:top-4 right-4 z-10">
        <div className="glass rounded-lg px-4 py-2 flex items-center gap-4">
          <div className="text-center">
            <span className="block text-2xl font-bold text-coral-400">
              {disasters.filter((d) => d.isActive).length}
            </span>
            <span className="text-xs text-foam-muted">Active Events</span>
          </div>
          <div className="w-px h-10 bg-ocean-600" />
          <div className="text-center">
            <span className="block text-2xl font-bold text-foam-100">
              {new Set(disasters.map((d) => d.location.country)).size}
            </span>
            <span className="text-xs text-foam-muted">Countries</span>
          </div>
        </div>
      </div>

      {/* Loading State Overlay */}
      {disasters.length === 0 && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-abyss-950/80">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-surface-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-foam-200">Loading disaster data...</p>
          </div>
        </div>
      )}

      {/* No disasters message */}
      {disasters.length > 0 && filteredDisasters.length === 0 && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-abyss-950/80">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-foam-muted mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-foam-200 mb-2">
              No disasters match your filters
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterType("all");
                setShowActiveOnly(false);
              }}
              className="btn btn-ghost text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(InteractiveDisasterMap);
