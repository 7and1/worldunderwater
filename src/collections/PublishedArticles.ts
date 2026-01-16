import { CollectionConfig } from "payload";
import { triggerRevalidation } from "@/lib/integrations/revalidate";
import { enqueueSocialPost } from "@/lib/integrations/social";

export const PublishedArticles: CollectionConfig = {
  slug: "published-articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "disasterType", "status", "publishedAt"],
    group: "Content",
    description: "AI-generated articles linked to raw event data",
  },
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => user?.role === "admin",
  },
  fields: [
    // Content
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "URL path for this article",
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "")
                .substring(0, 100);
            }
            return value;
          },
        ],
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      maxLength: 1000,
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    {
      name: "contentFormat",
      type: "select",
      defaultValue: "html",
      options: [
        { label: "HTML", value: "html" },
        { label: "Markdown", value: "markdown" },
        { label: "MDX", value: "mdx" },
      ],
      admin: {
        position: "sidebar",
      },
    },

    // Classification
    {
      type: "row",
      fields: [
        {
          name: "disasterType",
          type: "relationship",
          relationTo: "disaster-types",
          admin: { width: "50%" },
        },
        {
          name: "contentType",
          type: "select",
          defaultValue: "news",
          options: [
            { label: "News", value: "news" },
            { label: "Guide", value: "guide" },
            { label: "Analysis", value: "analysis" },
            { label: "Alert", value: "alert" },
            { label: "Update", value: "update" },
          ],
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "tags",
      type: "text",
      hasMany: true,
    },

    // Source Linkage (Critical for traceability)
    {
      name: "sources",
      type: "group",
      admin: {
        description: "Links to raw data sources",
      },
      fields: [
        {
          name: "primaryEvent",
          type: "relationship",
          relationTo: "raw-events",
          admin: {
            description: "Primary source event",
          },
        },
        {
          name: "rawEvents",
          type: "relationship",
          relationTo: "raw-events",
          hasMany: true,
          admin: {
            description: "All related raw events",
          },
        },
        {
          name: "attribution",
          type: "textarea",
          admin: {
            description: "Human-readable source credits",
          },
        },
      ],
    },

    // AI Generation Metadata
    {
      name: "aiMetadata",
      type: "group",
      admin: {
        description: "AI generation tracking",
        condition: (data, siblingData, { user }) => user?.role === "admin",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "model",
              type: "text",
              admin: { width: "50%" },
            },
            {
              name: "promptVersion",
              type: "text",
              admin: { width: "50%" },
            },
          ],
        },
        {
          name: "generationParams",
          type: "json",
        },
        {
          name: "humanEdited",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "editNotes",
          type: "textarea",
        },
      ],
    },

    // SEO
    {
      name: "seo",
      type: "group",
      fields: [
        {
          name: "metaTitle",
          type: "text",
          maxLength: 200,
        },
        {
          name: "metaDescription",
          type: "textarea",
          maxLength: 500,
        },
        {
          name: "ogImageUrl",
          type: "text",
        },
        {
          name: "canonicalUrl",
          type: "text",
        },
        {
          name: "keywords",
          type: "text",
          hasMany: true,
        },
      ],
    },

    // Media
    {
      name: "featuredImage",
      type: "group",
      fields: [
        {
          name: "url",
          type: "text",
        },
        {
          name: "alt",
          type: "text",
        },
      ],
    },
    {
      name: "mediaGallery",
      type: "json",
      admin: {
        description: "Array of media objects",
      },
    },

    // Location Context
    {
      name: "location",
      type: "group",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "name",
              type: "text",
              admin: { width: "50%" },
            },
            {
              name: "countryCode",
              type: "text",
              maxLength: 3,
              admin: { width: "25%" },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "latitude",
              type: "number",
              admin: { width: "50%" },
            },
            {
              name: "longitude",
              type: "number",
              admin: { width: "50%" },
            },
          ],
        },
      ],
    },

    // Product Recommendations
    {
      name: "products",
      type: "array",
      admin: {
        description: "Recommended products for this article",
      },
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
        },
        {
          name: "displayOrder",
          type: "number",
          defaultValue: 0,
        },
        {
          name: "contextNote",
          type: "text",
          admin: {
            description: "Why this product is relevant",
          },
        },
      ],
    },

    // Publishing
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "In Review", value: "review" },
        { label: "Scheduled", value: "scheduled" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "scheduledFor",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
        condition: (data) => data?.status === "scheduled",
      },
    },
    {
      name: "expiresAt",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
        description: "Auto-archive after this date",
      },
    },

    // Engagement
    {
      name: "engagement",
      type: "group",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
      fields: [
        {
          name: "viewCount",
          type: "number",
          defaultValue: 0,
        },
        {
          name: "shareCount",
          type: "number",
          defaultValue: 0,
        },
      ],
    },

    // Author
    {
      name: "author",
      type: "group",
      fields: [
        {
          name: "id",
          type: "number",
        },
        {
          name: "name",
          type: "text",
          defaultValue: "Editorial Team",
        },
      ],
    },
  ],
  // P1-3: Performance indexes for published articles
  // Note: Indexes are managed at database level for PostgreSQL
  indexes: [
    { fields: ["slug"], unique: true },
    { fields: ["status", "publishedAt"] },
    { fields: ["status", "updatedAt"] },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Auto-set publishedAt when status changes to published
        if (
          operation === "update" &&
          data.status === "published" &&
          !data.publishedAt
        ) {
          data.publishedAt = new Date().toISOString();
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation }) => {
        const wasPublished = previousDoc?.status === "published";
        const isPublished = doc?.status === "published";

        if (!isPublished) return;

        if (operation === "create" || !wasPublished) {
          await triggerRevalidation({
            paths: [
              "/",
              "/articles",
              `/article/${doc.slug}`,
              "/sitemap.xml",
              "/feed.xml",
            ],
          });

          await enqueueSocialPost(doc);
        }
      },
    ],
  },
};

export default PublishedArticles;
