"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="container-narrow text-center">
        <div className="w-20 h-20 rounded-full bg-coral-500/20 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-coral-400"
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
        <h1 className="text-3xl md:text-4xl font-bold text-foam-100 mb-3">
          Something went wrong
        </h1>
        <p className="text-foam-200 mb-8 max-w-md mx-auto">
          We encountered an unexpected error. This has been logged and our team
          will investigate.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={reset}
            className="btn btn-primary"
            aria-label="Try again"
          >
            Try Again
          </button>
          <a href="/" className="btn btn-ghost">
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
