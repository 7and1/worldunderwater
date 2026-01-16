"use client";

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import type { DisasterEvent, DisasterType } from "@/types";

interface MapLibreGlWrapperProps {
  disasters: DisasterEvent[];
  initialCenter: [number, number];
  initialZoom: number;
  onMarkerClick: (disaster: DisasterEvent) => void;
  onError: (error: string) => void;
  disasterColors: Record<DisasterType, string>;
  severityRadius: Record<string, number>;
  userLocation: [number, number] | null;
}

export interface MapLibreGlWrapperRef {
  flyTo: (options: {
    center: [number, number];
    zoom: number;
    speed?: number;
  }) => void;
  fitBounds: (bounds: any, options?: any) => void;
  LngLatBounds: any;
}

const MapLibreGlWrapper = forwardRef<
  MapLibreGlWrapperRef,
  MapLibreGlWrapperProps
>(
  (
    {
      disasters,
      initialCenter,
      initialZoom,
      onMarkerClick,
      onError,
      disasterColors,
      severityRadius,
      userLocation,
    },
    ref,
  ) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const isInitializedRef = useRef(false);

    // Expose map methods via ref
    useImperativeHandle(ref, () => ({
      flyTo: (options) => mapRef.current?.flyTo(options),
      fitBounds: (bounds, options) =>
        mapRef.current?.fitBounds(bounds, options),
      LngLatBounds: (sw: [number, number], ne: [number, number]) => {
        if (typeof window !== "undefined" && window.mapboxgl) {
          return new window.mapboxgl.LngLatBounds(sw, ne);
        }
        return null;
      },
    }));

    // Create SVG marker for disaster
    const createMarker = useCallback(
      (disaster: DisasterEvent, isSelected: boolean = false) => {
        const color = disasterColors[disaster.type];
        const radius = severityRadius[disaster.severity] || 16;
        const size = isSelected ? radius * 1.5 : radius;

        // Create marker SVG element
        const el = document.createElement("div");
        el.className = "disaster-marker";
        el.style.cssText = `
        width: ${size * 2}px;
        height: ${size * 2}px;
        cursor: pointer;
        position: relative;
      `;

        // Pulse animation for active disasters
        const pulse = disaster.isActive
          ? `
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background-color: ${color};
          opacity: 0.4;
          animation: marker-pulse 2s ease-in-out infinite;
        "></div>
      `
          : "";

        el.innerHTML = `
        ${pulse}
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: ${isSelected ? "3px solid white" : "2px solid rgba(255,255,255,0.8)"};
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg viewBox="0 0 24 24" width="${size * 0.6}" height="${size * 0.6}" fill="white">
            ${getIconPath(disaster.type)}
          </svg>
        </div>
        <style>
          @keyframes marker-pulse {
            0%, 100% { transform: scale(1); opacity: 0.4; }
            50% { transform: scale(1.5); opacity: 0.1; }
          }
        </style>
      `;

        // Add click handler
        el.addEventListener("click", () => {
          onMarkerClick(disaster);
        });

        // Add keyboard accessibility
        el.setAttribute("tabindex", "0");
        el.setAttribute("role", "button");
        el.setAttribute(
          "aria-label",
          `${disaster.title} - ${disaster.type} in ${disaster.location.country}`,
        );
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onMarkerClick(disaster);
          }
        });

        return el;
      },
      [disasterColors, severityRadius, onMarkerClick],
    );

    // Get SVG icon path for disaster type
    function getIconPath(type: DisasterType): string {
      const paths: Record<DisasterType, string> = {
        flood:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>',
        hurricane:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>',
        tsunami:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>',
        wildfire:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/>',
        earthquake:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>',
        tornado:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l4 4m0 0l-4 4m4-4h12M5 13l4 4m0 0l-4 4m4-4h8"/>',
        drought:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/>',
        volcano:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>',
        volcanic:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>',
        landslide:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 20h18M5 20l6-8 6 8M9 12l2-3 2 3"/>',
        storm:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16l-2 4m6-4l-2 4"/>',
        heat_wave:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.95 6.95l-1.414-1.414M7.464 7.464L6.05 6.05m12.9 0l-1.414 1.414M7.464 16.536L6.05 17.95"/><circle cx="12" cy="12" r="4" stroke-width="2"/>',
        cold_wave:
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v20m0 0l-3-3m3 3l3-3M4 7h16M4 17h16"/>',
      };
      return paths[type] || paths.storm;
    }

    // Initialize map
    useEffect(() => {
      if (isInitializedRef.current || !mapContainerRef.current) return;

      const initMap = async () => {
        try {
          // Dynamically import maplibre-gl
          const maplibregl = await import("maplibre-gl");
          (window as any).mapboxgl = maplibregl;

          // Create the map
          const map = new maplibregl.Map({
            container: mapContainerRef.current!,
            style: {
              version: 8,
              sources: {
                "osm-tiles": {
                  type: "raster",
                  tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                  tileSize: 256,
                  attribution: "&copy; OpenStreetMap contributors",
                },
              },
              layers: [
                {
                  id: "background",
                  type: "background",
                  paint: {
                    "background-color": "#0a1628",
                  },
                },
                {
                  id: "osm-tiles",
                  type: "raster",
                  source: "osm-tiles",
                  minzoom: 0,
                  maxzoom: 19,
                },
                {
                  id: "ocean-overlay",
                  type: "background",
                  paint: {
                    "background-color": "rgba(10, 22, 40, 0.3)",
                    "background-opacity": 0.5,
                  },
                },
              ],
            },
            center: initialCenter,
            zoom: initialZoom,
            minZoom: 1,
            maxZoom: 18,
            attributionControl: false,
          });

          // Add navigation controls
          map.addControl(
            new maplibregl.NavigationControl({ showCompass: false }),
            "bottom-right",
          );

          // Add fullscreen control
          map.addControl(new maplibregl.FullscreenControl(), "bottom-right");

          // Add scale control
          map.addControl(
            new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }),
            "bottom-left",
          );

          // Darken the map for underwater theme
          map.on("styledata", () => {
            const layers = map.getStyle().layers;
            layers?.forEach((layer: any) => {
              if (layer.type === "line" || layer.type === "fill") {
                map.setPaintProperty(layer.id, "fill-opacity", 0.7);
              }
            });
          });

          mapRef.current = map;
          isInitializedRef.current = true;

          // Add custom attribution
          const attributionDiv = document.createElement("div");
          attributionDiv.className = "map-attribution";
          attributionDiv.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            padding: 4px 8px;
            font-size: 10px;
            color: rgba(255,255,255,0.6);
            background: rgba(0,0,0,0.5);
            pointer-events: none;
          `;
          attributionDiv.innerHTML =
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" style="color: rgba(56, 189, 248, 0.8);">OpenStreetMap</a>';
          mapContainerRef.current?.appendChild(attributionDiv);
        } catch (error) {
          console.error("Failed to initialize map:", error);
          onError("Failed to load map. Please check your internet connection.");
        }
      };

      initMap();

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          isInitializedRef.current = false;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update markers when disasters change
    useEffect(() => {
      if (!mapRef.current || !isInitializedRef.current) return;

      // Remove existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const maplibregl = (window as any).mapboxgl;
      if (!maplibregl) return;

      // Add new markers
      disasters.forEach((disaster) => {
        const el = createMarker(disaster);

        const marker = new maplibregl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([disaster.location.lng, disaster.location.lat])
          .addTo(mapRef.current);

        markersRef.current.push(marker);
      });

      // Add user location marker
      if (userLocation) {
        const userEl = document.createElement("div");
        userEl.className = "user-location-marker";
        userEl.style.cssText = `
          width: 20px;
          height: 20px;
          background-color: #38bdf8;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
        `;

        const userMarker = new maplibregl.Marker({
          element: userEl,
          anchor: "center",
        })
          .setLngLat(userLocation)
          .addTo(mapRef.current);

        markersRef.current.push(userMarker);

        // Add accuracy circle
        if (mapRef.current.getSource("user-location-circle")) {
          (mapRef.current.getSource("user-location-circle") as any).setData({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: userLocation,
            },
          });
        } else {
          mapRef.current.addSource("user-location-circle", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: userLocation,
              },
            },
          });

          mapRef.current.addLayer({
            id: "user-location-circle",
            type: "circle",
            source: "user-location-circle",
            paint: {
              "circle-radius": 20,
              "circle-color": "#38bdf8",
              "circle-opacity": 0.2,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#38bdf8",
            },
          });
        }
      }
    }, [disasters, userLocation, createMarker]);

    return (
      <div
        ref={mapContainerRef}
        className="absolute inset-0"
        role="application"
        aria-label="Interactive disaster map showing global disaster events"
      />
    );
  },
);

MapLibreGlWrapper.displayName = "MapLibreGlWrapper";

export { MapLibreGlWrapper };
