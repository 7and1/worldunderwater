"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AlertBannerData } from "@/types";

// This would typically fetch from an API
async function getActiveAlert(): Promise<AlertBannerData | null> {
  // Placeholder - replace with actual API call
  return null;
}

const alertStyles = {
  breaking: {
    bg: "bg-gradient-to-r from-coral-600 to-coral-500",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    label: "BREAKING",
  },
  urgent: {
    bg: "bg-gradient-to-r from-amber-600 to-amber-500",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    label: "URGENT",
  },
  update: {
    bg: "bg-gradient-to-r from-surface-500 to-ocean-500",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    label: "UPDATE",
  },
};

export default function AlertBanner() {
  const [alert, setAlert] = useState<AlertBannerData | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    getActiveAlert().then(setAlert);
  }, []);

  if (!alert || isDismissed) {
    return null;
  }

  const style = alertStyles[alert.type];

  return (
    <div className={`${style.bg} text-white relative`}>
      <div className="container-wide py-2.5 pr-12">
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="flex items-center gap-2 font-bold">
            {style.icon}
            <span className="hidden sm:inline">{style.label}:</span>
          </span>
          <p className="font-medium truncate">{alert.message}</p>
          {alert.link && (
            <Link
              href={alert.link}
              className="hidden sm:inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline whitespace-nowrap"
            >
              Learn more
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/20 transition-colors"
        aria-label="Dismiss alert"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
