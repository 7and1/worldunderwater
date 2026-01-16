import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function ArticlesLoading() {
  return (
    <div className="min-h-screen">
      <section className="bg-ocean-900/50 border-b border-ocean-700">
        <div className="container-content py-8 md:py-12">
          <SkeletonLoader variant="text" className="w-48 h-10 mb-2" />
          <SkeletonLoader variant="text" className="w-96 h-6" />
        </div>
      </section>

      <section className="py-12">
        <div className="container-content">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card overflow-hidden">
                <SkeletonLoader
                  variant="image"
                  className="aspect-video w-full"
                />
                <div className="p-5">
                  <SkeletonLoader variant="text" className="w-full h-6 mb-2" />
                  <SkeletonLoader variant="text" className="w-3/4 h-6 mb-3" />
                  <SkeletonLoader variant="text" className="w-full h-4 mb-1" />
                  <SkeletonLoader variant="text" className="w-5/6 h-4 mb-1" />
                  <SkeletonLoader variant="text" className="w-2/3 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
