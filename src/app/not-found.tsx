import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container-narrow text-center">
        <div className="w-16 h-16 rounded-full bg-ocean-800 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl text-foam-100">404</span>
        </div>
        <h1 className="text-3xl font-bold text-foam-100 mb-3">
          Page not found
        </h1>
        <p className="text-foam-200 mb-8">
          The page you requested may have moved or no longer exists. Explore the
          live map or return home.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
          <Link href="/disasters" className="btn btn-ghost">
            View Live Map
          </Link>
        </div>
      </div>
    </div>
  );
}
