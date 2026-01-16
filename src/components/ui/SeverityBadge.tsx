import type { SeverityLevel } from "@/types";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const severityConfig: Record<
  SeverityLevel,
  { label: string; className: string }
> = {
  watch: {
    label: "Watch",
    className: "badge-watch",
  },
  warning: {
    label: "Warning",
    className: "badge-warning",
  },
  emergency: {
    label: "Emergency",
    className: "badge-emergency",
  },
  catastrophic: {
    label: "Catastrophic",
    className: "badge-catastrophic",
  },
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-3 py-1 text-xs",
  lg: "px-4 py-1.5 text-sm",
};

export default function SeverityBadge({
  severity,
  size = "md",
  showLabel = true,
}: SeverityBadgeProps) {
  const config = severityConfig[severity];

  return (
    <span className={`badge ${config.className} ${sizeClasses[size]}`}>
      {showLabel ? config.label : severity.charAt(0).toUpperCase()}
    </span>
  );
}
