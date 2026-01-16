import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function DisastersLoading() {
  return (
    <div className="min-h-screen">
      <section className="bg-ocean-900/50 border-b border-ocean-700">
        <div className="container-content py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <SkeletonLoader variant="text" className="w-64 h-10" />
            <div className="flex items-center gap-4">
              <SkeletonLoader variant="box" className="w-20 h-14" />
              <SkeletonLoader variant="box" className="w-20 h-14" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container-wide">
          <SkeletonLoader
            variant="map"
            className="h-[600px] lg:h-[700px] w-full"
          />
        </div>
      </section>

      <section className="py-12 bg-ocean-900/30">
        <div className="container-content">
          <SkeletonLoader variant="text" className="w-48 h-8 mb-6" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonLoader key={i} variant="card" />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-content">
          <SkeletonLoader variant="text" className="w-40 h-8 mb-6" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SkeletonLoader key={i} variant="card" variantSize="compact" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
