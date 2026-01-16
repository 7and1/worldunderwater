/**
 * Mapbox Static Images API Integration
 *
 * Generates map thumbnails for disaster events to use as og:image
 * and article featured images.
 */

import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

export interface MapThumbnailOptions {
  latitude: number;
  longitude: number;
  zoom?: number;
  width?: number;
  height?: number;
  scale?: 1 | 2;
  marker?: {
    color: string;
    label?: string;
  };
}

// Marker colors for different disaster types
export const DISASTER_MARKER_COLORS: Record<string, string> = {
  flood: "3b82f6",
  earthquake: "f59e0b",
  hurricane: "8b5cf6",
  wildfire: "ef4444",
  tsunami: "06b6d4",
  tornado: "a855f7",
  volcanic: "dc2626",
  drought: "eab308",
  landslide: "78716c",
  storm: "6366f1",
  heat_wave: "f97316",
  cold_wave: "0ea5e9",
};

/**
 * Generate a Mapbox Static Image URL for a disaster event
 */
export function generateMapThumbnailUrl(
  options: MapThumbnailOptions,
  disasterType?: string,
): string {
  if (!MAPBOX_ACCESS_TOKEN) {
    return `/api/placeholder-map?lat=${options.latitude}&lon=${options.longitude}`;
  }

  const {
    latitude,
    longitude,
    zoom = 8,
    width = 1200,
    height = 630,
    scale = 1,
  } = options;

  const markerColor =
    options.marker?.color ||
    DISASTER_MARKER_COLORS[disasterType || "storm"] ||
    "ef4444";
  const markerLabel = options.marker?.label || "";

  const marker = `pin-l-${markerLabel}+${markerColor}(${longitude},${latitude})`;

  const styleId = "dark-v11";
  const url = new URL(
    `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/${marker}/${longitude},${latitude},${zoom},0/${width}x${height}@${scale}x`,
  );

  url.searchParams.set("access_token", MAPBOX_ACCESS_TOKEN);
  url.searchParams.set("attribution", "false");
  url.searchParams.set("logo", "false");

  return url.toString();
}

/**
 * Generate a map thumbnail with affected area overlay
 */
export function generateAreaMapUrl(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  disasterType: string,
  width = 1200,
  height = 630,
  scale = 1,
): string {
  if (!MAPBOX_ACCESS_TOKEN) {
    return `/api/placeholder-map?lat=${centerLat}&lon=${centerLon}&radius=${radiusKm}`;
  }

  const zoom = Math.max(3, Math.min(12, Math.round(14 - Math.log2(radiusKm))));
  const markerColor = DISASTER_MARKER_COLORS[disasterType] || "ef4444";

  const circleGeoJson = createCircleGeoJson(
    centerLat,
    centerLon,
    radiusKm,
    markerColor,
  );

  const geoJsonEncoded = encodeURIComponent(JSON.stringify(circleGeoJson));

  const styleId = "dark-v11";
  const url = new URL(
    `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/geojson(${geoJsonEncoded})/${centerLon},${centerLat},${zoom},0/${width}x${height}@${scale}x`,
  );

  url.searchParams.set("access_token", MAPBOX_ACCESS_TOKEN);
  url.searchParams.set("attribution", "false");
  url.searchParams.set("logo", "false");

  return url.toString();
}

interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

interface GeoJsonFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: "Point" | "Polygon";
    coordinates: number[] | number[][][];
  };
}

function createCircleGeoJson(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  color: string,
): GeoJsonFeatureCollection {
  const points = 64;
  const coordinates: number[][] = [];

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusKm * Math.cos(angle);
    const dy = radiusKm * Math.sin(angle);

    const latOffset = dy / 111.32;
    const lonOffset = dx / (111.32 * Math.cos((centerLat * Math.PI) / 180));

    coordinates.push([centerLon + lonOffset, centerLat + latOffset]);
  }
  coordinates.push(coordinates[0]);

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          fill: `#${color}`,
          "fill-opacity": 0.3,
          stroke: `#${color}`,
          "stroke-width": 2,
          "stroke-opacity": 0.8,
        },
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
      },
      {
        type: "Feature",
        properties: {
          "marker-color": `#${color}`,
          "marker-size": "large",
        },
        geometry: {
          type: "Point",
          coordinates: [centerLon, centerLat],
        },
      },
    ],
  };
}

/**
 * Generate thumbnail for an article based on disaster data
 */
export function generateArticleThumbnail(
  disasterType: string,
  latitude: number,
  longitude: number,
  affectedRadiusKm?: number,
): string {
  if (affectedRadiusKm && affectedRadiusKm > 10) {
    return generateAreaMapUrl(
      latitude,
      longitude,
      affectedRadiusKm,
      disasterType,
    );
  }

  return generateMapThumbnailUrl(
    {
      latitude,
      longitude,
      zoom: 10,
    },
    disasterType,
  );
}

/**
 * Pre-generate thumbnail URL for a disaster event
 */
export async function generateAndCacheThumbnail(
  eventId: string,
  disasterType: string,
  latitude: number,
  longitude: number,
  affectedRadiusKm?: number,
): Promise<string> {
  const cacheDir = path.join(process.cwd(), "public", "generated", "maps");
  const hash = createHash("md5")
    .update(`${eventId}-${disasterType}-${latitude}-${longitude}`)
    .digest("hex")
    .slice(0, 12);
  const fileName = `${hash}.jpg`;
  const filePath = path.join(cacheDir, fileName);
  const publicUrl = `/generated/maps/${fileName}`;

  try {
    await fs.access(filePath);
    return publicUrl;
  } catch {
    // Cache miss - continue to fetch
  }

  const remoteUrl = affectedRadiusKm
    ? generateAreaMapUrl(latitude, longitude, affectedRadiusKm, disasterType)
    : generateMapThumbnailUrl(
        {
          latitude,
          longitude,
          zoom: 8,
          width: 1200,
          height: 630,
          scale: 1,
        },
        disasterType,
      );

  if (!MAPBOX_ACCESS_TOKEN) {
    return remoteUrl;
  }

  try {
    await fs.mkdir(cacheDir, { recursive: true });
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(`Mapbox fetch failed: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    return publicUrl;
  } catch (error) {
    console.warn("Thumbnail cache failed:", error);
    return remoteUrl;
  }
}
