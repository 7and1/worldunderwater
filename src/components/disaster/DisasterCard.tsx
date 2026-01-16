import Image from "next/image";
import Link from "next/link";
import type { DisasterEvent } from "@/types";
import SeverityBadge from "@/components/ui/SeverityBadge";
import DisasterTypeIcon from "@/components/ui/DisasterTypeIcon";
import { formatRelativeTime, formatLocation } from "@/lib/utils/format";

interface DisasterCardProps {
  disaster: DisasterEvent;
  variant?: "default" | "compact" | "featured";
  showImage?: boolean;
}

export default function DisasterCard({
  disaster,
  variant = "default",
  showImage = true,
}: DisasterCardProps) {
  const cardClasses = {
    default: "card group cursor-pointer",
    compact: "card group cursor-pointer flex flex-row items-center gap-4 p-4",
    featured: "card group cursor-pointer relative overflow-hidden",
  };

  if (variant === "compact") {
    return (
      <Link href={`/disasters/${disaster.id}`} className={cardClasses.compact}>
        <div
          className={`flex-shrink-0 p-3 rounded-lg disaster-${disaster.type}`}
          style={{ backgroundColor: "var(--accent)", opacity: 0.15 }}
        >
          <DisasterTypeIcon
            type={disaster.type}
            className="w-6 h-6"
            style={{ color: "var(--accent)" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SeverityBadge severity={disaster.severity} size="sm" />
            {disaster.isActive && (
              <span className="flex items-center gap-1 text-xs text-phosphor-400">
                <span className="w-1.5 h-1.5 rounded-full bg-phosphor-400 animate-pulse" />
                Active
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-foam-100 truncate group-hover:text-surface-300 transition-colors">
            {disaster.title}
          </h3>
          <p className="text-xs text-foam-muted truncate">
            {formatLocation(disaster.location)} &bull;{" "}
            {formatRelativeTime(disaster.updatedAt)}
          </p>
        </div>
        <svg
          className="w-5 h-5 text-foam-muted group-hover:text-surface-400 transition-colors flex-shrink-0"
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
    );
  }

  if (variant === "featured") {
    return (
      <Link href={`/disasters/${disaster.id}`} className={cardClasses.featured}>
        {/* Background Image */}
        {showImage && disaster.thumbnailUrl && (
          <div className="absolute inset-0">
            <Image
              src={disaster.thumbnailUrl}
              alt={disaster.title}
              fill
              className="object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-abyss-950 via-abyss-950/80 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="relative p-6 md:p-8 min-h-[300px] flex flex-col justify-end">
          <div className="flex items-center gap-3 mb-3">
            <SeverityBadge severity={disaster.severity} />
            <span
              className={`disaster-${disaster.type} px-2 py-1 rounded text-xs font-medium uppercase`}
              style={{
                backgroundColor: "rgba(var(--accent-rgb), 0.2)",
                color: "var(--accent)",
              }}
            >
              {disaster.type}
            </span>
            {disaster.isActive && (
              <span className="flex items-center gap-1.5 text-sm text-phosphor-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-phosphor-400 animate-pulse" />
                Live
              </span>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-foam-100 mb-2 group-hover:text-surface-300 transition-colors">
            {disaster.title}
          </h2>

          <p className="text-foam-200 mb-4 line-clamp-2">
            {disaster.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-foam-muted">
              <span className="flex items-center gap-1.5">
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {formatLocation(disaster.location)}
              </span>
              <span className="flex items-center gap-1.5">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatRelativeTime(disaster.updatedAt)}
              </span>
            </div>

            <span className="text-surface-400 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
              View Details
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
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/disasters/${disaster.id}`} className={cardClasses.default}>
      {/* Image */}
      {showImage && disaster.thumbnailUrl && (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={disaster.thumbnailUrl}
            alt={disaster.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/90 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <SeverityBadge severity={disaster.severity} size="sm" />
            {disaster.isActive && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-phosphor-500/20 text-xs text-phosphor-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-phosphor-400 animate-pulse" />
                Active
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`flex-shrink-0 p-2 rounded-lg disaster-${disaster.type}`}
            style={{ backgroundColor: "rgba(var(--accent-rgb), 0.15)" }}
          >
            <DisasterTypeIcon
              type={disaster.type}
              className="w-5 h-5"
              style={{ color: "var(--accent)" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foam-100 group-hover:text-surface-300 transition-colors line-clamp-2">
              {disaster.title}
            </h3>
            <p className="text-sm text-foam-muted mt-1">
              {formatLocation(disaster.location)}
            </p>
          </div>
        </div>

        <p className="text-sm text-foam-200 line-clamp-2 mb-3">
          {disaster.description}
        </p>

        <div className="flex items-center justify-between text-xs text-foam-muted pt-3 border-t border-ocean-700">
          <span>Source: {disaster.source.toUpperCase()}</span>
          <span>{formatRelativeTime(disaster.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
