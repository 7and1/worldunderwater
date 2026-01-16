import type { EditorialStatus, EditorialTransition } from "@/types";

/**
 * Editorial workflow states for content management
 * Ensures human review before publishing
 */

// Valid status transitions
export const VALID_TRANSITIONS: EditorialTransition[] = [
  { from: "draft", to: "review", requiresHumanReview: false },
  { from: "review", to: "approved", requiresHumanReview: true },
  { from: "review", to: "draft", requiresHumanReview: false },
  { from: "approved", to: "published", requiresHumanReview: false },
  { from: "approved", to: "draft", requiresHumanReview: false },
  { from: "published", to: "draft", requiresHumanReview: false },
  { from: "published", to: "review", requiresHumanReview: false },
];

/**
 * Check if a status transition is valid
 */
export function isValidTransition(
  currentStatus: EditorialStatus,
  newStatus: EditorialStatus,
): boolean {
  return VALID_TRANSITIONS.some(
    (t) => t.from === currentStatus && t.to === newStatus,
  );
}

/**
 * Check if a transition requires human review
 */
export function requiresHumanReview(
  currentStatus: EditorialStatus,
  newStatus: EditorialStatus,
): boolean {
  const transition = VALID_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.to === newStatus,
  );
  return transition?.requiresHumanReview ?? false;
}

/**
 * Get allowed next statuses for a current status
 */
export function getNextStatuses(
  currentStatus: EditorialStatus,
): EditorialStatus[] {
  return VALID_TRANSITIONS.filter((t) => t.from === currentStatus).map(
    (t) => t.to,
  );
}

/**
 * Editorial workflow status labels for UI
 */
export const STATUS_LABELS: Record<EditorialStatus, string> = {
  draft: "Draft",
  review: "Under Review",
  approved: "Approved",
  published: "Published",
};

/**
 * Editorial workflow status colors for UI
 */
export const STATUS_COLORS: Record<EditorialStatus, string> = {
  draft: "bg-ocean-700 text-foam-200",
  review: "bg-amber-500/20 text-amber-400",
  approved: "bg-phosphor-500/20 text-phosphor-400",
  published: "bg-emerald-500/20 text-emerald-400",
};

/**
 * SEO requirements per status
 */
export const SEO_REQUIREMENTS: Record<EditorialStatus, string[]> = {
  draft: ["Basic content", "Primary category"],
  review: [
    "Complete content",
    "Meta title and description",
    "Featured image",
    "At least 3 tags",
    "Primary category",
  ],
  approved: [
    "Complete content",
    "Optimized meta title (50-60 chars)",
    "Optimized meta description (150-160 chars)",
    "High-quality featured image",
    "5-10 relevant tags",
    "Primary category",
    "Internal links",
    "FAQ section (optional but recommended)",
  ],
  published: [
    "All approved requirements",
    "Valid canonical URL",
    "Schema markup validated",
    "No broken links",
  ],
};
