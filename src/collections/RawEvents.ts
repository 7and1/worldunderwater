import { CollectionConfig } from "payload";

export const RawEvents: CollectionConfig = {
  slug: "raw-events",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "source", "eventType", "occurredAt", "status"],
    group: "Raw Data",
    description: "Immutable raw event data from external APIs",
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
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
          admin: {
            width: "33%",
          },
        },
        {
          name: "sourceId",
          type: "text",
          required: true,
          admin: {
            width: "33%",
            description: "Original ID from source API",
          },
        },
        {
          name: "sourceUrl",
          type: "text",
          admin: {
            width: "33%",
          },
        },
      ],
    },

    // Raw Payload (immutable)
    {
      name: "rawPayload",
      type: "json",
      required: true,
      admin: {
        description: "Complete API response - DO NOT MODIFY",
        condition: (data, siblingData, { user }) => user?.role === "admin",
      },
    },
    {
      name: "payloadHash",
      type: "text",
      required: true,
      admin: {
        description: "SHA256 hash for change detection",
        readOnly: true,
      },
    },

    // Normalized Fields
    {
      type: "row",
      fields: [
        {
          name: "eventType",
          type: "text",
          admin: {
            width: "50%",
          },
        },
        {
          name: "disasterType",
          type: "relationship",
          relationTo: "disaster-types",
          admin: {
            width: "50%",
          },
        },
      ],
    },
    {
      name: "title",
      type: "text",
      admin: {
        description: "Extracted event title",
      },
    },
    {
      name: "description",
      type: "textarea",
    },

    // Geospatial
    {
      name: "location",
      type: "group",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "latitude",
              type: "number",
              admin: { width: "25%" },
            },
            {
              name: "longitude",
              type: "number",
              admin: { width: "25%" },
            },
            {
              name: "name",
              type: "text",
              admin: { width: "25%" },
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
          name: "coordinatesRaw",
          type: "json",
          admin: {
            description: "Original coordinates (polygons, etc.)",
          },
        },
      ],
    },

    // Temporal
    {
      type: "row",
      fields: [
        {
          name: "occurredAt",
          type: "date",
          admin: {
            width: "50%",
            date: {
              pickerAppearance: "dayAndTime",
            },
          },
        },
        {
          name: "reportedAt",
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

    // Metrics
    {
      name: "metrics",
      type: "group",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "magnitude",
              type: "number",
              admin: { width: "33%" },
            },
            {
              name: "severity",
              type: "select",
              options: [
                { label: "Minor", value: "minor" },
                { label: "Moderate", value: "moderate" },
                { label: "Severe", value: "severe" },
                { label: "Catastrophic", value: "catastrophic" },
              ],
              admin: { width: "33%" },
            },
            {
              name: "affectedAreaKm2",
              type: "number",
              admin: { width: "33%" },
            },
          ],
        },
      ],
    },

    // Processing State
    {
      name: "status",
      type: "select",
      defaultValue: "new",
      options: [
        { label: "New", value: "new" },
        { label: "Processing", value: "processing" },
        { label: "Processed", value: "processed" },
        { label: "Archived", value: "archived" },
        { label: "Error", value: "error" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "articleGenerated",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "processingErrors",
      type: "json",
      admin: {
        position: "sidebar",
        condition: (data) => data?.status === "error",
      },
    },
    {
      name: "ingestedAt",
      type: "date",
      admin: {
        position: "sidebar",
        readOnly: true,
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
  ],
  // P1-3: Performance indexes for query optimization
  // Note: Complex indexes are managed at database level for PostgreSQL
  indexes: [
    { fields: ["source", "sourceId"], unique: true },
    { fields: ["status"] },
    { fields: ["disasterType"] },
    { fields: ["occurredAt"] },
  ],
  timestamps: true,
};

export default RawEvents;
