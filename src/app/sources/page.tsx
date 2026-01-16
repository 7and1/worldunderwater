import StaticPageLayout from "@/components/layout/StaticPageLayout";

export const metadata = {
  title: "Data Sources",
  description:
    "Official data sources powering World Under Water's disaster monitoring.",
};

const sources = [
  {
    name: "NASA EONET",
    description: "Global natural event tracking with satellite-backed updates.",
    url: "https://eonet.gsfc.nasa.gov/",
  },
  {
    name: "USGS Earthquake Hazards Program",
    description: "Real-time earthquake feeds and seismic updates.",
    url: "https://earthquake.usgs.gov/",
  },
  {
    name: "ReliefWeb",
    description: "Humanitarian disaster data and situation reports.",
    url: "https://reliefweb.int/",
  },
  {
    name: "NOAA / National Hurricane Center",
    description: "Atlantic and Pacific storm advisories.",
    url: "https://www.nhc.noaa.gov/",
  },
];

export default function SourcesPage() {
  return (
    <StaticPageLayout
      title="Data Sources"
      subtitle="We aggregate data from reputable scientific and government agencies."
      kicker="Attribution"
    >
      <section className="grid gap-6 md:grid-cols-2">
        {sources.map((source) => (
          <a
            key={source.name}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card p-6 hover:border-surface-400/40"
          >
            <h2 className="text-lg font-semibold text-foam-100 mb-2">
              {source.name}
            </h2>
            <p className="text-foam-200">{source.description}</p>
          </a>
        ))}
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Source Attribution
        </h2>
        <p className="text-foam-200">
          Every article and alert includes source attribution so you can verify
          the original dataset. If a source updates or retracts information, we
          reflect those changes as quickly as possible.
        </p>
      </section>
    </StaticPageLayout>
  );
}
