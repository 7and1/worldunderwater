import { CollectionConfig } from "payload";
import { triggerRevalidation } from "@/lib/integrations/revalidate";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "categories", "status", "priority"],
    group: "Commerce",
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => user?.role === "admin",
  },
  fields: [
    // Basic Info
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          admin: { width: "70%" },
        },
        {
          name: "sku",
          type: "text",
          unique: true,
          admin: { width: "30%" },
        },
      ],
    },
    {
      name: "slug",
      type: "text",
      unique: true,
      admin: {
        description: "URL-friendly identifier",
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            }
            return value;
          },
        ],
      },
    },
    {
      name: "description",
      type: "richText",
    },
    {
      name: "shortDescription",
      type: "textarea",
      maxLength: 500,
    },

    // Affiliate Data
    {
      name: "affiliate",
      type: "group",
      fields: [
        {
          name: "url",
          type: "text",
          required: true,
          admin: {
            description: "Affiliate link URL",
          },
        },
        {
          type: "row",
          fields: [
            {
              name: "network",
              type: "select",
              options: [
                { label: "Amazon", value: "amazon" },
                { label: "ShareASale", value: "shareasale" },
                { label: "CJ Affiliate", value: "cj" },
                { label: "Impact", value: "impact" },
                { label: "Other", value: "other" },
              ],
              admin: { width: "50%" },
            },
            {
              name: "affiliateId",
              type: "text",
              admin: { width: "50%" },
            },
          ],
        },
      ],
    },

    // Media
    {
      name: "image",
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
      name: "galleryUrls",
      type: "array",
      fields: [
        {
          name: "url",
          type: "text",
          required: true,
        },
      ],
    },

    // Pricing
    {
      name: "pricing",
      type: "group",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "priceCents",
              type: "number",
              admin: {
                width: "33%",
                description: "Price in cents (e.g., 2999 = $29.99)",
              },
            },
            {
              name: "currency",
              type: "select",
              defaultValue: "USD",
              options: [
                { label: "USD", value: "USD" },
                { label: "EUR", value: "EUR" },
                { label: "GBP", value: "GBP" },
              ],
              admin: { width: "33%" },
            },
            {
              name: "priceUpdatedAt",
              type: "date",
              admin: { width: "33%" },
            },
          ],
        },
      ],
    },

    // Categorization
    {
      name: "categories",
      type: "select",
      hasMany: true,
      options: [
        { label: "Water & Filtration", value: "water" },
        { label: "Food & Nutrition", value: "food" },
        { label: "Shelter & Protection", value: "shelter" },
        { label: "First Aid & Medical", value: "first-aid" },
        { label: "Communication", value: "communication" },
        { label: "Power & Light", value: "power" },
        { label: "Tools & Equipment", value: "tools" },
        { label: "Clothing & Gear", value: "clothing" },
        { label: "Navigation", value: "navigation" },
        { label: "Safety & Security", value: "safety" },
      ],
    },
    {
      name: "tags",
      type: "text",
      hasMany: true,
    },
    {
      name: "brand",
      type: "text",
    },

    // Disaster Matching
    {
      name: "matchingDisasters",
      type: "array",
      admin: {
        description: "Link products to relevant disaster types",
      },
      fields: [
        {
          name: "disasterType",
          type: "relationship",
          relationTo: "disaster-types",
          required: true,
        },
        {
          type: "row",
          fields: [
            {
              name: "relevanceScore",
              type: "number",
              min: 1,
              max: 100,
              defaultValue: 50,
              admin: {
                width: "33%",
                description: "1-100, higher = more relevant",
              },
            },
            {
              name: "isEssential",
              type: "checkbox",
              admin: {
                width: "33%",
                description: "Must-have for this disaster",
              },
            },
            {
              name: "displayOrder",
              type: "number",
              defaultValue: 0,
              admin: { width: "33%" },
            },
          ],
        },
      ],
    },

    // Status & Priority
    {
      name: "status",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Out of Stock", value: "out_of_stock" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "priority",
      type: "number",
      defaultValue: 50,
      min: 1,
      max: 100,
      admin: {
        position: "sidebar",
        description: "1-100, higher = more prominent",
      },
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
      ],
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [
      async ({ doc }) => {
        const categories = (doc.categories || []) as string[];
        await triggerRevalidation({
          paths: [
            "/products",
            ...categories.map((category) => `/products/${category}`),
            "/sitemap.xml",
          ],
        });
      },
    ],
  },
};

export default Products;
