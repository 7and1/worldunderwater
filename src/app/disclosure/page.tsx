import StaticPageLayout from "@/components/layout/StaticPageLayout";

export const metadata = {
  title: "Affiliate Disclosure",
  description:
    "World Under Water participates in affiliate programs. Learn how we fund our work.",
};

export default function DisclosurePage() {
  return (
    <StaticPageLayout
      title="Affiliate Disclosure"
      subtitle="Transparency about how we earn revenue to support this project."
      kicker="Disclosure"
    >
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Amazon Associate Program
        </h2>
        <p className="text-foam-200">
          As an Amazon Associate, we earn from qualifying purchases. Product
          links on this site may contain affiliate tracking parameters.
        </p>
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          How We Choose Products
        </h2>
        <p className="text-foam-200">
          Product recommendations are matched to disaster types and reviewed for
          relevance, availability, and safety. Affiliate partnerships never
          override safety or preparedness guidance.
        </p>
      </section>
    </StaticPageLayout>
  );
}
