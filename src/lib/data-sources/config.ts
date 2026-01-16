import type { DataSource, DataSourceConfig } from "./types";

export const DATA_SOURCES: Record<DataSource, DataSourceConfig> = {
  nasa_eonet: {
    name: "NASA EONET",
    baseUrl: "https://eonet.gsfc.nasa.gov/api/v3",
    endpoints: {
      events: "/events",
      categories: "/categories",
    },
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerDay: 1000,
    },
    pollingIntervalMs: 15 * 60 * 1000, // 15 minutes
    requiresAuth: false,
  },

  usgs_earthquake: {
    name: "USGS Earthquakes",
    baseUrl: "https://earthquake.usgs.gov/fdsnws/event/1",
    endpoints: {
      query: "/query",
    },
    rateLimit: {
      requestsPerMinute: 60,
    },
    pollingIntervalMs: 5 * 60 * 1000, // 5 minutes
    requiresAuth: false,
  },

  reliefweb: {
    name: "ReliefWeb",
    baseUrl: "https://api.reliefweb.int/v1",
    endpoints: {
      disasters: "/disasters",
      reports: "/reports",
    },
    rateLimit: {
      requestsPerMinute: 100,
    },
    pollingIntervalMs: 30 * 60 * 1000, // 30 minutes
    requiresAuth: false,
  },

  openweathermap: {
    name: "OpenWeatherMap",
    baseUrl: "https://api.openweathermap.org/data/3.0",
    endpoints: {
      onecall: "/onecall",
    },
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerDay: 1000,
    },
    pollingIntervalMs: 10 * 60 * 1000, // 10 minutes
    requiresAuth: true,
  },
};

// High-risk cities for weather monitoring
export const MONITORED_LOCATIONS = [
  { name: "Miami", lat: 25.7617, lon: -80.1918, country: "US" },
  { name: "New Orleans", lat: 29.9511, lon: -90.0715, country: "US" },
  { name: "Houston", lat: 29.7604, lon: -95.3698, country: "US" },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, country: "JP" },
  { name: "Manila", lat: 14.5995, lon: 120.9842, country: "PH" },
  { name: "Mumbai", lat: 19.076, lon: 72.8777, country: "IN" },
  { name: "Bangkok", lat: 13.7563, lon: 100.5018, country: "TH" },
  { name: "Jakarta", lat: -6.2088, lon: 106.8456, country: "ID" },
  { name: "Ho Chi Minh City", lat: 10.8231, lon: 106.6297, country: "VN" },
  { name: "Dhaka", lat: 23.8103, lon: 90.4125, country: "BD" },
];
