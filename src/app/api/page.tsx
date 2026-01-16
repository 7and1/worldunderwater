import StaticPageLayout from "@/components/layout/StaticPageLayout";

export const metadata = {
  title: "API Access",
  description: "API access overview for World Under Water data feeds.",
};

export default function ApiAccessPage() {
  return (
    <StaticPageLayout
      title="API Access"
      subtitle="Programmatic access is available for partners and researchers."
      kicker="Platform"
    >
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          What You Can Access
        </h2>
        <ul className="space-y-2 text-foam-200">
          <li>Published disaster articles and metadata.</li>
          <li>Live event summaries with severity scoring.</li>
          <li>Product safety recommendations by disaster type.</li>
        </ul>
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Request Credentials
        </h2>
        <p className="text-foam-200">
          API access is currently available by request. Email
          api@worldunderwater.org with your use case and expected volume.
        </p>
      </section>
    </StaticPageLayout>
  );
}
