import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function ProductsLoading() {
  return (
    <div className="min-h-screen">
      <section className="bg-ocean-900/50 border-b border-ocean-700">
        <div className="container-content py-8 md:py-12">
          <SkeletonLoader variant="text" className="w-64 h-10 mb-2" />
          <SkeletonLoader variant="text" className="w-96 h-6" />
        </div>
      </section>

      <section className="py-12">
        <div className="container-content">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <SkeletonLoader key={i} variant="card" />
            ))}
          </div>

          <SkeletonLoader variant="text" className="w-48 h-8 mb-4" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonLoader key={i} variant="product" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
