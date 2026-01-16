import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata = {
  title: "Contact World Under Water",
  description:
    "Get in touch with the World Under Water team for press, partnerships, or support.",
};

export default function ContactPage() {
  return (
    <StaticPageLayout
      title="Contact"
      subtitle="Questions, partnerships, or press inquiries? We would love to hear from you."
      kicker="Get In Touch"
    >
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foam-100 mb-4">
            General Inquiries
          </h2>
          <p className="text-foam-200 mb-6">
            Email our editorial team for corrections, source updates, or
            coverage requests.
          </p>
          <p className="text-foam-100 font-semibold">
            hello@worldunderwater.org
          </p>
          <p className="text-xs text-foam-muted mt-2">
            We respond within 2 business days.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foam-100 mb-4">
            Partnerships & Media
          </h2>
          <p className="text-foam-200 mb-6">
            For affiliate programs, data collaborations, or media requests,
            contact our partnerships desk.
          </p>
          <p className="text-foam-100 font-semibold">
            partnerships@worldunderwater.org
          </p>
          <p className="text-xs text-foam-muted mt-2">
            Include your organization and timeline.
          </p>
        </div>
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-4">
          Send a Message
        </h2>
        <ContactForm />
      </section>
    </StaticPageLayout>
  );
}
