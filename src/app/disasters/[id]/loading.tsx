import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function DisasterDetailLoading() {
  return (
    <div className="min-h-screen">
      <section className="bg-ocean-900/50 border-b border-ocean-700">
        <div className="container-content py-8">
          <SkeletonLoader variant="text" className="w-64 h-10" />
        </div>
      </section>

      <section className="py-8">
        <div className="container-content">
          <div className="card p-6 md:p-8 mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <SkeletonLoader variant="badge" />
              <SkeletonLoader variant="badge" />
              <SkeletonLoader variant="badge" />
            </div>
            <dl className="grid gap-4 md:grid-cols-2">
              <SkeletonLoader variant="text" className="w-32 h-5" />
              <SkeletonLoader variant="text" className="w-32 h-5" />
              <SkeletonLoader variant="text" className="w-32 h-5" />
              <SkeletonLoader variant="text" className="w-32 h-5" />
            </dl>
            <SkeletonLoader variant="button" className="mt-6 w-32" />
          </div>

          <section>
            <SkeletonLoader variant="button" className="w-40" />
          </section>
        </div>
      </section>
    </div>
  );
}
