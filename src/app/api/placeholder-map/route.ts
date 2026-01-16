import { NextRequest, NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat") || "0";
  const lon = searchParams.get("lon") || "0";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a1628" />
      <stop offset="100%" stop-color="#030810" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="600" cy="315" r="120" fill="#0ea5e9" opacity="0.15" />
  <circle cx="600" cy="315" r="6" fill="#38bdf8" />
  <text x="600" y="360" text-anchor="middle" fill="#f0f9ff" font-family="Arial" font-size="24">
    Map preview unavailable
  </text>
  <text x="600" y="400" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="18">
    Lat ${lat} • Lon ${lon}
  </text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
