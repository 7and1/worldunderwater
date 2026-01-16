import type { Metadata } from "next";
import LiveDisasterMap from "@/components/disaster/LiveDisasterMap";
import DisasterCard from "@/components/disaster/DisasterCard";
import { generateDisasterMapMetadata } from "@/lib/seo/metadata";
import type { DisasterType } from "@/types";
import { getRecentDisasters } from "@/lib/data";

export const metadata: Metadata = generateDisasterMapMetadata();
export const revalidate = 300;

async function getDisasters() {
  return getRecentDisasters(200);
}

interface DisastersPageProps {
  searchParams: Promise<{ type?: DisasterType }>;
}

export default async function DisastersPage({
  searchParams,
}: DisastersPageProps) {
  const disasters = await getDisasters();
  const { type: filterType } = await searchParams;

  const filteredDisasters = filterType
    ? disasters.filter((d) => d.type === filterType)
    : disasters;

  const activeDisasters = filteredDisasters.filter((d) => d.isActive);
  const pastDisasters = filteredDisasters.filter((d) => !d.isActive);

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="bg-ocean-900/50 border-b border-ocean-700">
        <div className="container-content py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foam-100 mb-2">
                Live Disaster Map
              </h1>
              <p className="text-foam-200">
                Real-time tracking of natural disasters worldwide from NASA,
                USGS, and NOAA.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 rounded-lg bg-ocean-800">
                <span className="block text-2xl font-bold text-coral-400">
                  {activeDisasters.length}
                </span>
                <span className="text-xs text-foam-muted">Active Events</span>
              </div>
              <div className="text-center px-4 py-2 rounded-lg bg-ocean-800">
                <span className="block text-2xl font-bold text-foam-100">
                  {new Set(disasters.map((d) => d.location.country)).size}
                </span>
                <span className="text-xs text-foam-muted">Countries</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-8">
        <div className="container-wide">
          <div className="h-[600px] lg:h-[700px]">
            <LiveDisasterMap disasters={disasters} />
          </div>
        </div>
      </section>

      {/* Active Disasters List */}
      {activeDisasters.length > 0 && (
        <section className="py-12 bg-ocean-900/30">
          <div className="container-content">
            <h2 className="text-2xl font-bold text-foam-100 mb-6 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-coral-500 animate-pulse" />
              Active Disasters
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeDisasters.map((disaster) => (
                <DisasterCard key={disaster.id} disaster={disaster} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Past Disasters */}
      {pastDisasters.length > 0 && (
        <section className="py-12">
          <div className="container-content">
            <h2 className="text-2xl font-bold text-foam-100 mb-6">
              Recent Past Events
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pastDisasters.slice(0, 8).map((disaster) => (
                <DisasterCard
                  key={disaster.id}
                  disaster={disaster}
                  variant="compact"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Data Sources */}
      <section className="py-8 border-t border-ocean-800">
        <div className="container-content">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-foam-muted">
            <span>Data Sources:</span>
            <a
              href="https://eonet.gsfc.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-surface-400"
            >
              NASA EONET
            </a>
            <a
              href="https://earthquake.usgs.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-surface-400"
            >
              USGS Earthquake
            </a>
            <a
              href="https://www.nhc.noaa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-surface-400"
            >
              NOAA NHC
            </a>
            <a
              href="https://gdacs.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-surface-400"
            >
              GDACS
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
