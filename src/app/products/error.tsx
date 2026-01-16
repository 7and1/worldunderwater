"use client";

import { useEffect } from "react";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Products page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen">
      <section className="bg-ocean-900/50 border-b border-ocean-700">
        <div className="container-content py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foam-100 mb-2">
            Preparedness Products
          </h1>
          <p className="text-foam-200">
            Curated survival gear and emergency supplies.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-content">
          <div className="card p-8 md:p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-coral-500/20 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-coral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foam-100 mb-3">
              Unable to load products
            </h2>
            <p className="text-foam-200 mb-6">
              We couldn&apos;t fetch the product catalog. Please try again
              later.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={reset}
                className="btn btn-primary"
                aria-label="Try loading products again"
              >
                Try Again
              </button>
              <a href="/disasters" className="btn btn-ghost">
                View Live Map
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
