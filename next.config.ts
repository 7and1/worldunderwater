import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: false,
  },

  // P1-6: Image optimization with explicit device sizes and format configuration
  images: {
    // P1-6: Explicit device sizes for responsive images (reduces variants)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // P1-6: Image breakpoints for srcset generation
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // P1-6: Optimize format selection - prefer WebP/AVIF with fallbacks
    formats: ["image/avif", "image/webp"],
    // P1-6: Restrict remotePatterns to specific domains for security
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.nasa.gov",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.usgs.gov",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.mapbox.com",
        port: "",
        pathname: "/**",
      },
    ],
    // P1-6: Enable sharp for faster image processing
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 31536000, // 1 year for static images
  },

  // P0-6: Security headers including Content Security Policy
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy
          // Restricts sources for scripts, styles, images, etc.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self';",
              // Script sources: self, inline for Next.js, mapbox for maps
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' api.mapbox.com;",
              // Style sources: self, inline for Next.js, mapbox, google fonts
              "style-src 'self' 'unsafe-inline' api.mapbox.com fonts.googleapis.com;",
              // Image sources: self, data URIs, mapbox, NASA, USGS, unsplash, amazon
              "img-src 'self' data: blob: https://api.mapbox.com https://*.nasa.gov https://*.usgs.gov https://images.unsplash.com https://m.media-amazon.com https://tile.openstreetmap.org;",
              // Font sources: self, google fonts
              "font-src 'self' fonts.gstatic.com fonts.googleapis.com data:;",
              // Connect sources: API endpoints, analytics
              "connect-src 'self' api.mapbox.com events.mapbox.com https://tile.openstreetmap.org;",
              // Frame sources: none (disallow iframes)
              "frame-src 'none';",
              // Media sources: self
              "media-src 'self';",
              // Object sources: none (disallow plugins)
              "object-src 'none';",
              // Base URI: self
              "base-uri 'self';",
              // Form action: self
              "form-action 'self';",
              // Frame ancestors: prevent clickjacking
              "frame-ancestors 'none';",
              // Manifest source: self
              "manifest-src 'self';",
              // Worker sources: self
              "worker-src 'self' blob:;",
              // Upgrade insecure requests
              "upgrade-insecure-requests;",
            ].join(" "),
          },
          // Strict Transport Security (HSTS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // X-Content-Type-Options
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // X-Frame-Options
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // X-XSS-Protection
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer-Policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions-Policy
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(), geolocation=(self), payment=()",
          },
        ],
      },
      // API routes get more restrictive CSP
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'; object-src 'none';",
          },
        ],
      },
    ];
  },
};

// P1-7: Apply bundle analyzer wrapper - use function export for dynamic import
export default async function () {
  const withBundleAnalyzer =
    process.env.ANALYZE === "true"
      ? (await import("@next/bundle-analyzer")).default({ enabled: true })
      : (config: NextConfig) => config;
  return withPayload(withBundleAnalyzer(nextConfig));
}
