"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/client";

interface RiskEvent {
  id: string;
  title: string;
  type: string;
  severity: string;
  distanceKm: number;
  sourceUrl?: string;
}

interface RiskResponse {
  ok: boolean;
  riskLevel: "low" | "elevated" | "high";
  events: RiskEvent[];
  fallback?: boolean;
  error?: string;
}

function ProgressIndicator({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-foam-muted">
        <span>Checking risk...</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-ocean-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-surface-400 to-phosphor-400 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 bg-ocean-800 rounded-lg animate-pulse" />
        <div className="h-24 bg-ocean-800 rounded-lg animate-pulse" />
        <div className="h-24 bg-ocean-800 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

const errorMessages: Record<string, { title: string; message: string }> = {
  geolocation: {
    title: "Location access denied",
    message:
      "Please enable location access in your browser or enter your coordinates manually.",
  },
  network: {
    title: "Network error",
    message:
      "Unable to connect to our risk detection service. Please check your connection and try again.",
  },
  invalid: {
    title: "Invalid coordinates",
    message:
      "Please enter valid latitude (-90 to 90) and longitude (-180 to 180) values.",
  },
  timeout: {
    title: "Request timeout",
    message:
      "The request took too long. Please try again with a smaller radius.",
  },
  default: {
    title: "Unable to check risk",
    message: "An unexpected error occurred. Please try again.",
  },
};

export default function RiskChecker() {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [radiusKm, setRadiusKm] = useState(50);
  const [status, setStatus] = useState<
    "idle" | "locating" | "loading" | "error" | "success"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<RiskResponse | null>(null);
  const [errorType, setErrorType] = useState<string>("default");

  const fetchRisk = async (latitude: number, longitude: number) => {
    setStatus("loading");
    setResult(null);
    setProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `/api/risk?lat=${latitude}&lon=${longitude}&radiusKm=${radiusKm}`,
        { signal: controller.signal },
      );
      clearTimeout(timeoutId);

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as RiskResponse;
      setResult(data);
      setStatus("success");
    } catch (error) {
      clearInterval(progressInterval);
      console.error(error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setErrorType("timeout");
        } else if (error.message.includes("Failed to fetch")) {
          setErrorType("network");
        } else {
          setErrorType("default");
        }
      }
      setStatus("error");
    }
  };

  const handleLocate = () => {
    trackEvent({ eventType: "click_cta_risk_geolocate" });
    if (!navigator.geolocation) {
      setErrorType("geolocation");
      setStatus("error");
      return;
    }

    setStatus("locating");
    setErrorType("default");
    setProgress(25);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProgress(50);
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude.toFixed(5));
        setLon(longitude.toFixed(5));
        fetchRisk(latitude, longitude);
      },
      () => {
        setErrorType("geolocation");
        setStatus("error");
        setProgress(0);
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  };

  const handleManualCheck = () => {
    trackEvent({ eventType: "click_cta_risk_manual" });
    const latitude = Number(lat);
    const longitude = Number(lon);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setErrorType("invalid");
      setStatus("error");
      return;
    }

    setErrorType("default");
    fetchRisk(latitude, longitude);
  };

  const errorContent = errorMessages[errorType] || errorMessages.default;

  return (
    <div className="card p-6 md:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-foam-100 mb-2">Am I Safe?</h2>
          <p className="text-foam-200">
            Check for disasters within your selected radius. Your location is
            used only for this lookup and is not stored.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleLocate}
          disabled={status === "locating" || status === "loading"}
          aria-busy={status === "locating" || status === "loading"}
          aria-describedby={
            status === "locating" || status === "loading"
              ? "risk-checker-status"
              : undefined
          }
        >
          {status === "locating" ? (
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Locating...
            </span>
          ) : status === "loading" ? (
            "Checking..."
          ) : (
            "Use My Location"
          )}
        </button>
        <span id="risk-checker-status" className="sr-only">
          {status === "locating"
            ? "Acquiring your location"
            : status === "loading"
              ? "Fetching disaster data"
              : ""}
        </span>
      </div>

      {(status === "locating" || status === "loading") && (
        <div className="mt-6" aria-live="polite" aria-atomic="true">
          <ProgressIndicator
            step={status === "locating" ? 1 : 2}
            totalSteps={2}
          />
        </div>
      )}

      {status === "loading" && <SkeletonLoader />}

      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <input
          type="text"
          inputMode="decimal"
          placeholder="Latitude"
          value={lat}
          onChange={(event) => setLat(event.target.value)}
          className="px-4 py-3 rounded-lg bg-ocean-800 border border-ocean-600 text-foam-100 placeholder:text-foam-muted focus:outline-none focus:border-surface-400 disabled:opacity-50"
          disabled={status === "loading"}
          aria-label="Latitude coordinate"
        />
        <input
          type="text"
          inputMode="decimal"
          placeholder="Longitude"
          value={lon}
          onChange={(event) => setLon(event.target.value)}
          className="px-4 py-3 rounded-lg bg-ocean-800 border border-ocean-600 text-foam-100 placeholder:text-foam-muted focus:outline-none focus:border-surface-400 disabled:opacity-50"
          disabled={status === "loading"}
          aria-label="Longitude coordinate"
        />
        <select
          value={radiusKm}
          onChange={(event) => setRadiusKm(Number(event.target.value))}
          className="px-4 py-3 rounded-lg bg-ocean-800 border border-ocean-600 text-foam-100 focus:outline-none focus:border-surface-400 disabled:opacity-50"
          disabled={status === "loading"}
          aria-label="Search radius in kilometers"
        >
          {[25, 50, 100, 250, 500].map((value) => (
            <option key={value} value={value}>
              {value} km radius
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleManualCheck}
          disabled={status === "loading"}
          aria-busy={status === "loading"}
        >
          Check Risk
        </button>
      </div>

      {status === "error" && (
        <div
          className="mt-4 p-4 rounded-lg bg-coral-500/10 border border-coral-500/30"
          role="alert"
          aria-live="assertive"
        >
          <h3 className="text-sm font-semibold text-coral-400 mb-1">
            {errorContent.title}
          </h3>
          <p className="text-sm text-foam-200">{errorContent.message}</p>
        </div>
      )}

      {status === "success" && result && (
        <div className="mt-6" aria-live="polite">
          <div
            className={`rounded-xl border p-4 mb-4 ${
              result.riskLevel === "high"
                ? "border-coral-500/40 bg-coral-500/10"
                : result.riskLevel === "elevated"
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-phosphor-400/40 bg-phosphor-500/10"
            }`}
          >
            <h3 className="text-lg font-semibold text-foam-100 mb-1">
              {result.riskLevel === "high"
                ? "Immediate risk detected"
                : result.riskLevel === "elevated"
                  ? "Heightened awareness"
                  : "No nearby active threats"}
            </h3>
            <p className="text-sm text-foam-200">
              {result.events.length > 0
                ? `Found ${result.events.length} events within ${radiusKm} km.`
                : "No significant events within the selected radius."}
            </p>
            {result.fallback && (
              <p className="text-xs text-foam-muted mt-2">
                Showing cached data due to service unavailability.
              </p>
            )}
            <div className="mt-4">
              {result.riskLevel === "high" ? (
                <a href="/products/emergency-kits" className="btn btn-danger">
                  Get Emergency Kits
                </a>
              ) : result.riskLevel === "elevated" ? (
                <a href="/products/communication" className="btn btn-ghost">
                  Check Communication Gear
                </a>
              ) : (
                <a href="/products/food-water" className="btn btn-ghost">
                  Build a Daily Reserve
                </a>
              )}
            </div>
          </div>

          {result.events.length > 0 && (
            <ul className="space-y-3">
              {result.events.map((event) => (
                <li key={event.id} className="card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-foam-100">
                        {event.title}
                      </h4>
                      <p className="text-xs text-foam-muted">
                        {event.type} &bull; {event.severity} &bull;{" "}
                        {event.distanceKm} km
                      </p>
                    </div>
                    {event.sourceUrl && (
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-surface-400 hover:underline"
                      >
                        Source
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
