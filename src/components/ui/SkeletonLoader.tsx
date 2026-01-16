interface SkeletonLoaderProps {
  variant:
    | "text"
    | "box"
    | "card"
    | "image"
    | "map"
    | "badge"
    | "button"
    | "product";
  variantSize?: "default" | "compact";
  className?: string;
}

const baseClasses =
  "bg-gradient-to-r from-ocean-800 via-ocean-700 to-ocean-800 bg-[length:200%_100%] animate-pulse rounded";

export function SkeletonLoader({
  variant,
  variantSize = "default",
  className = "",
}: SkeletonLoaderProps) {
  const combinedClasses = `${baseClasses} ${className}`.trim();

  const variantStyles: Record<string, string> =
    variantSize === "compact"
      ? {
          text: combinedClasses,
          box: combinedClasses,
          card: `${combinedClasses} h-32 w-full`,
          image: `${combinedClasses} w-full`,
          map: `${combinedClasses} w-full rounded-lg`,
          badge: `${combinedClasses} h-6 w-16 rounded-full`,
          button: `${combinedClasses} h-10 w-32 rounded-lg`,
          product: `${combinedClasses} h-64 w-full rounded-lg`,
        }
      : {
          text: combinedClasses,
          box: combinedClasses,
          card: `${combinedClasses} h-80 w-full`,
          image: `${combinedClasses} w-full`,
          map: `${combinedClasses} w-full rounded-lg`,
          badge: `${combinedClasses} h-6 w-16 rounded-full`,
          button: `${combinedClasses} h-10 w-32 rounded-lg`,
          product: `${combinedClasses} h-96 w-full rounded-lg`,
        };

  return <div className={variantStyles[variant]} aria-hidden="true" />;
}
