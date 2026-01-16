import StaticPageLayout from "@/components/layout/StaticPageLayout";

export const metadata = {
  title: "Emergency Checklist",
  description:
    "A practical 72-hour emergency checklist for disaster preparedness.",
};

const checklistItems = [
  "Water (1 gallon per person per day, 3-day supply)",
  "Non-perishable food (3-day supply)",
  "Battery-powered or hand-crank radio",
  "Flashlights and extra batteries",
  "First aid kit and critical medications",
  "Phone chargers / power banks",
  "Copies of important documents",
  "Cash in small bills",
  "Whistle, multi-tool, and duct tape",
  "Warm clothing and sturdy footwear",
];

export default function ChecklistPage() {
  return (
    <StaticPageLayout
      title="Emergency Checklist"
      subtitle="A 72-hour survival checklist to keep your household ready."
      kicker="Preparedness"
    >
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-4">
          Core Supplies
        </h2>
        <ul className="grid gap-3 md:grid-cols-2 text-foam-200">
          {checklistItems.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 w-2 h-2 rounded-full bg-surface-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Customize for Your Region
        </h2>
        <p className="text-foam-200">
          Add supplies for your local hazards (flood barriers, N95 masks, fire
          blankets). Check your risk on the homepage to see active threats.
        </p>
      </section>
    </StaticPageLayout>
  );
}
