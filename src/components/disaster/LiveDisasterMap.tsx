"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { DisasterEvent, DisasterType, MapMarker } from "@/types";
import SeverityBadge from "@/components/ui/SeverityBadge";
import DisasterTypeIcon from "@/components/ui/DisasterTypeIcon";
import { formatRelativeTime, formatLocation } from "@/lib/utils/format";

// Dynamically import the interactive map to avoid SSR issues
const InteractiveDisasterMap = dynamic(
  () => import("./InteractiveDisasterMap").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-ocean-900 rounded-xl">
        <div className="w-12 h-12 border-4 border-surface-400 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  },
);

interface LiveDisasterMapProps {
  disasters: DisasterEvent[];
  initialCenter?: [number, number];
  initialZoom?: number;
  onMarkerClick?: (disaster: DisasterEvent) => void;
  useInteractiveMap?: boolean;
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

export default function LiveDisasterMap({
  disasters,
  initialCenter = [20, 0],
  initialZoom = 2,
  onMarkerClick,
  useInteractiveMap = true,
}: LiveDisasterMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedDisaster, setSelectedDisaster] =
    useState<DisasterEvent | null>(null);
  const [filterType, setFilterType] = useState<DisasterType | "all">("all");
  const [showActiveOnly, setShowActiveOnly] = useState(true);

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

  const handleMarkerClick = (disaster: DisasterEvent) => {
    setSelectedDisaster(disaster);
    onMarkerClick?.(disaster);
  };

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

  // Use interactive map if enabled, otherwise use fallback SVG map
  if (useInteractiveMap) {
    return (
      <InteractiveDisasterMap
        disasters={disasters}
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        onMarkerClick={onMarkerClick}
      />
    );
  }

  // Fallback to SVG-based placeholder map
  return (
    <div className="relative h-full min-h-[600px] bg-ocean-900 rounded-xl overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row gap-4">
        {/* Filter by type */}
        <div className="flex flex-wrap gap-2">
          {disasterTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-200
                ${
                  filterType === type
                    ? "bg-surface-400 text-abyss-950"
                    : "glass text-foam-200 hover:bg-ocean-700"
                }
              `}
            >
              {type !== "all" && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: disasterColors[type as DisasterType],
                  }}
                />
              )}
              <span className="capitalize">{type}</span>
              {disasterCounts[type] && (
                <span
                  className={`
                  px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${filterType === type ? "bg-abyss-950/20" : "bg-ocean-600"}
                `}
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
          />
          <span className="text-xs text-foam-200">Active only</span>
        </label>
      </div>

      {/* Map Container - Placeholder for actual map implementation */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 bg-gradient-to-br from-ocean-900 via-ocean-800 to-abyss-950"
      >
        {/* SVG World Map Placeholder */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full opacity-30"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Simplified world map paths would go here */}
          <rect
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            x="0"
            y="0"
            width="1000"
            height="500"
            className="text-ocean-600"
          />
          {/* Grid lines */}
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * 50}
              x2="1000"
              y2={i * 50}
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-ocean-700"
            />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 50}
              y1="0"
              x2={i * 50}
              y2="500"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-ocean-700"
            />
          ))}
        </svg>

        {/* Disaster Markers */}
        {filteredDisasters.map((disaster) => {
          // Convert lat/lng to approximate SVG coordinates
          const x = ((disaster.location.lng + 180) / 360) * 100;
          const y = ((90 - disaster.location.lat) / 180) * 100;

          return (
            <button
              key={disaster.id}
              type="button"
              onClick={() => handleMarkerClick(disaster)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
            >
              {/* Pulse animation for active disasters */}
              {disaster.isActive && (
                <span
                  className="absolute inset-0 rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: disasterColors[disaster.type] }}
                />
              )}
              {/* Marker */}
              <span
                className="relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-transform group-hover:scale-125"
                style={{ backgroundColor: disasterColors[disaster.type] }}
              >
                <DisasterTypeIcon
                  type={disaster.type}
                  className="w-4 h-4 text-white"
                />
              </span>
              {/* Tooltip on hover */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-abyss-950 text-xs text-foam-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {disaster.title}
              </span>
            </button>
          );
        })}
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
                />
                <span className="text-xs text-foam-200 capitalize">{type}</span>
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
      {disasters.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-abyss-950/80">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-surface-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-foam-200">Loading disaster data...</p>
          </div>
        </div>
      )}
    </div>
  );
}
