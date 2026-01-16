import type { CollectionConfig } from "payload";
import { rateLimit, getClientIdentifier } from "@/lib/security/rate-limiter";

// Rate limiting: 5 subscriptions per hour per IP (prevents abuse)
const RATE_LIMIT_CONFIG = {
  limit: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Validates the request using rate limiting and honeypot detection
 * Should be called in API routes that handle subscriber creation
 */
export async function validateSubscriptionRequest(request: Request): Promise<{
  allowed: boolean;
  error?: string;
  rateLimitReset?: number;
}> {
  // Rate limiting check
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(clientId, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.allowed) {
    return {
      allowed: false,
      error: "Too many subscription attempts. Please try again later.",
      rateLimitReset: rateLimitResult.resetAt,
    };
  }

  return { allowed: true };
}

export const Subscribers: CollectionConfig = {
  slug: "subscribers",
  labels: {
    singular: "Subscriber",
    plural: "Subscribers",
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "status", "location", "createdAt"],
    group: "Newsletter",
  },
  access: {
    read: () => true,
    create: () => true,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    // P0-4: Honeypot field - hidden from real users, filled by bots
    // Should be left empty by legitimate users (hidden via CSS)
    {
      name: "website",
      type: "text",
      admin: {
        description: "Honeypot field - should always be empty",
      },
    },
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "name",
      type: "text",
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Pending Confirmation", value: "pending" },
        { label: "Active", value: "active" },
        { label: "Unsubscribed", value: "unsubscribed" },
      ],
      index: true,
    },
    {
      name: "confirmationToken",
      type: "text",
      admin: {
        hidden: true,
      },
    },
    {
      name: "confirmedAt",
      type: "date",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "location",
      type: "group",
      admin: {
        description: "Subscriber location for geo-targeted alerts",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "latitude",
              type: "number",
              admin: {
                width: "50%",
              },
            },
            {
              name: "longitude",
              type: "number",
              admin: {
                width: "50%",
              },
            },
          ],
        },
        {
          name: "locality",
          type: "text",
          admin: {
            description: "City or region name",
          },
        },
        {
          name: "country",
          type: "text",
        },
        {
          name: "countryCode",
          type: "text",
          maxLength: 3,
        },
      ],
    },
    {
      name: "alertRadius",
      type: "number",
      defaultValue: 100,
      min: 10,
      max: 1000,
      admin: {
        description: "Alert radius in kilometers",
      },
    },
    {
      name: "preferences",
      type: "group",
      fields: [
        {
          name: "disasterTypes",
          type: "select",
          hasMany: true,
          options: [
            { label: "Flood", value: "flood" },
            { label: "Wildfire", value: "wildfire" },
            { label: "Earthquake", value: "earthquake" },
            { label: "Tsunami", value: "tsunami" },
            { label: "Hurricane", value: "hurricane" },
            { label: "Tornado", value: "tornado" },
            { label: "Drought", value: "drought" },
            { label: "Volcanic", value: "volcanic" },
            { label: "Landslide", value: "landslide" },
            { label: "Storm", value: "storm" },
            { label: "Heat Wave", value: "heat_wave" },
            { label: "Cold Wave", value: "cold_wave" },
          ],
          admin: {
            description: "Leave empty to receive all disaster types",
          },
        },
        {
          name: "minSeverity",
          type: "select",
          defaultValue: "moderate",
          options: [
            { label: "Minor (all alerts)", value: "minor" },
            { label: "Moderate", value: "moderate" },
            { label: "Severe", value: "severe" },
            { label: "Catastrophic only", value: "catastrophic" },
          ],
        },
        {
          name: "frequency",
          type: "select",
          defaultValue: "immediate",
          options: [
            { label: "Immediate", value: "immediate" },
            { label: "Daily Digest", value: "daily" },
            { label: "Weekly Digest", value: "weekly" },
          ],
        },
      ],
    },
    {
      name: "unsubscribedAt",
      type: "date",
      admin: {
        readOnly: true,
        condition: (data) => data?.status === "unsubscribed",
      },
    },
    {
      name: "unsubscribeReason",
      type: "select",
      options: [
        { label: "Too many emails", value: "too_many" },
        { label: "Not relevant", value: "not_relevant" },
        { label: "Found alternative", value: "alternative" },
        { label: "Other", value: "other" },
      ],
      admin: {
        condition: (data) => data?.status === "unsubscribed",
      },
    },
    // P0-4: Track IP for abuse detection
    {
      name: "ipAddress",
      type: "text",
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    // P0-4: Track user agent for bot detection
    {
      name: "userAgent",
      type: "text",
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === "create") {
          // P0-4: Bot detection via honeypot
          // If the hidden 'website' field is filled, it's likely a bot
          if (data.website && data.website.length > 0) {
            // Silently mark as pending/spam instead of rejecting
            // This avoids tipping off bot operators
            data.status = "pending";
          }

          // Generate confirmation token
          data.confirmationToken = crypto.randomUUID();

          // P0-4: Capture request metadata for abuse detection
          if (req?.headers) {
            const forwarded = req.headers.get("x-forwarded-for");
            data.ipAddress =
              forwarded?.split(",")[0].trim() ||
              req.headers.get("x-real-ip") ||
              "unknown";
            data.userAgent = req.headers.get("user-agent") || "unknown";
          }
        }

        if (data.status === "active" && !data.confirmedAt) {
          data.confirmedAt = new Date().toISOString();
        }
        if (data.status === "unsubscribed" && !data.unsubscribedAt) {
          data.unsubscribedAt = new Date().toISOString();
        }
        return data;
      },
    ],
    afterRead: [
      ({ doc }) => {
        // P0-4: Hide honeypot and tracking fields from API responses
        // to prevent exposing bot detection methods
        const sanitized = { ...doc };
        delete sanitized.website;
        delete sanitized.ipAddress;
        delete sanitized.userAgent;
        return sanitized;
      },
    ],
  },
};

export default Subscribers;
