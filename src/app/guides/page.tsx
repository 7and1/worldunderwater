import StaticPageLayout from "@/components/layout/StaticPageLayout";
import Link from "next/link";

export const metadata = {
  title: "Survival Guides",
  description:
    "Preparedness guides and playbooks for floods, wildfires, earthquakes, and more.",
};

const guides = [
  {
    title: "Flood Preparedness Playbook",
    description:
      "Essential steps for sandbagging, evacuation, and water safety.",
  },
  {
    title: "Wildfire Smoke Safety",
    description: "How to protect your lungs and home during wildfire season.",
  },
  {
    title: "Earthquake Grab-and-Go Checklist",
    description: "Supplies and plans for the first 72 hours after a quake.",
  },
  {
    title: "Hurricane Readiness",
    description: "Pre-storm prep, generator safety, and evacuation planning.",
  },
];

export default function GuidesPage() {
  return (
    <StaticPageLayout
      title="Survival Guides"
      subtitle="Actionable preparedness guidance curated from verified data sources."
      kicker="Preparedness"
    >
      <section className="grid gap-6 md:grid-cols-2">
        {guides.map((guide) => (
          <div key={guide.title} className="card p-6">
            <h2 className="text-lg font-semibold text-foam-100 mb-2">
              {guide.title}
            </h2>
            <p className="text-foam-200 mb-4">{guide.description}</p>
            <span className="text-sm text-foam-muted">
              Guide publishing in progress
            </span>
          </div>
        ))}
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Need live updates?
        </h2>
        <p className="text-foam-200">
          Browse the latest disaster coverage in the Articles section.
        </p>
        <Link href="/articles" className="btn btn-ghost mt-4">
          View Articles
        </Link>
      </section>
    </StaticPageLayout>
  );
}
