"use client";

import { useEffect } from "react";

export default function DisasterDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Disaster detail error:", error);
  }, [error]);

  return (
    <div className="min-h-screen">
      <section className="bg-ocean-900/50 border-b border-ocean-700">
        <div className="container-content py-8">
          <h1 className="text-2xl font-bold text-foam-100">Event Detail</h1>
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foam-100 mb-3">
              Unable to load event details
            </h2>
            <p className="text-foam-200 mb-6">
              We couldn&apos;t load the disaster event information. It may have
              been removed or is temporarily unavailable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={reset}
                className="btn btn-primary"
                aria-label="Try loading event details again"
              >
                Try Again
              </button>
              <a href="/disasters" className="btn btn-ghost">
                Back to Live Map
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
