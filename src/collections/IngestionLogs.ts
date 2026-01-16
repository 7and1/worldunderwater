import { CollectionConfig } from "payload";

export const IngestionLogs: CollectionConfig = {
  slug: "ingestion-logs",
  admin: {
    useAsTitle: "id",
    defaultColumns: [
      "source",
      "status",
      "eventsFound",
      "eventsNew",
      "startedAt",
    ],
    group: "System",
    description: "API ingestion tracking and monitoring",
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => user?.role === "admin",
    delete: ({ req: { user } }) => user?.role === "admin",
  },
  fields: [
    // Source Identification
    {
      type: "row",
      fields: [
        {
          name: "source",
          type: "select",
          required: true,
          options: [
            { label: "NASA EONET", value: "nasa_eonet" },
            { label: "USGS Earthquake", value: "usgs_earthquake" },
            { label: "ReliefWeb", value: "reliefweb" },
          ],
          admin: { width: "33%" },
        },
        {
          name: "jobId",
          type: "text",
          admin: {
            width: "33%",
            description: "UUID to group related operations",
          },
        },
        {
          name: "status",
          type: "select",
          required: true,
          options: [
            { label: "Started", value: "started" },
            { label: "Success", value: "success" },
            { label: "Partial", value: "partial" },
            { label: "Error", value: "error" },
            { label: "Rate Limited", value: "rate_limited" },
          ],
          admin: { width: "33%" },
        },
      ],
    },

    // Request Details
    {
      name: "request",
      type: "group",
      fields: [
        {
          name: "endpointUrl",
          type: "text",
        },
        {
          name: "params",
          type: "json",
        },
      ],
    },

    // Results
    {
      name: "results",
      type: "group",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "eventsFound",
              type: "number",
              defaultValue: 0,
              admin: {
                width: "25%",
                description: "Total from API",
              },
            },
            {
              name: "eventsNew",
              type: "number",
              defaultValue: 0,
              admin: {
                width: "25%",
                description: "Actually inserted",
              },
            },
            {
              name: "eventsUpdated",
              type: "number",
              defaultValue: 0,
              admin: { width: "25%" },
            },
            {
              name: "eventsSkipped",
              type: "number",
              defaultValue: 0,
              admin: {
                width: "25%",
                description: "Duplicates/unchanged",
              },
            },
          ],
        },
      ],
    },

    // Timing
    {
      name: "timing",
      type: "group",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "startedAt",
              type: "date",
              admin: {
                width: "33%",
                date: {
                  pickerAppearance: "dayAndTime",
                },
              },
            },
            {
              name: "completedAt",
              type: "date",
              admin: {
                width: "33%",
                date: {
                  pickerAppearance: "dayAndTime",
                },
              },
            },
            {
              name: "durationMs",
              type: "number",
              admin: {
                width: "33%",
                description: "Duration in milliseconds",
              },
            },
          ],
        },
      ],
    },

    // Error Tracking
    {
      name: "error",
      type: "group",
      admin: {
        condition: (data) =>
          data?.status === "error" || data?.status === "partial",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "code",
              type: "text",
              admin: { width: "30%" },
            },
            {
              name: "retryCount",
              type: "number",
              defaultValue: 0,
              admin: { width: "20%" },
            },
          ],
        },
        {
          name: "message",
          type: "textarea",
        },
        {
          name: "details",
          type: "json",
        },
      ],
    },

    // Rate Limiting
    {
      name: "rateLimit",
      type: "group",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "remaining",
              type: "number",
              admin: { width: "50%" },
            },
            {
              name: "resetAt",
              type: "date",
              admin: {
                width: "50%",
                date: {
                  pickerAppearance: "dayAndTime",
                },
              },
            },
          ],
        },
      ],
    },

    // Response Metadata
    {
      name: "response",
      type: "group",
      admin: {
        condition: (data, siblingData, { user }) => user?.role === "admin",
      },
      fields: [
        {
          name: "sizeBytes",
          type: "number",
        },
        {
          name: "headers",
          type: "json",
        },
      ],
    },
  ],
  timestamps: true,
};

export default IngestionLogs;
