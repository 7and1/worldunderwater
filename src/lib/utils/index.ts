export {
  formatRelativeTime,
  formatLocation,
  formatNumber,
  formatPrice,
  formatReadingTime,
  truncateText as truncate,
  slugify,
  capitalize,
  formatAffectedPopulation,
  formatDate,
  formatDateTime,
} from "./format";

export { hashPayload } from "./hash";

// cn utility for className merging
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
