import { CollectionConfig } from "payload";

export const DisasterTypes: CollectionConfig = {
  slug: "disaster-types",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "code", "isActive"],
    group: "Reference Data",
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: "code",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "Unique identifier (e.g., flood, wildfire, earthquake)",
      },
      validate: (val: string | null | undefined) => {
        if (typeof val === "string" && !/^[a-z_]+$/.test(val)) {
          return "Code must be lowercase letters and underscores only";
        }
        return true;
      },
    },
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "iconUrl",
      type: "text",
      admin: {
        description: "URL to disaster type icon",
      },
    },
    {
      name: "colorHex",
      type: "text",
      admin: {
        description: "Hex color for UI display (e.g., #FF4500)",
      },
      validate: (val: string | null | undefined) => {
        if (val && !/^#[0-9A-Fa-f]{6}$/.test(val)) {
          return "Must be a valid hex color (e.g., #FF4500)";
        }
        return true;
      },
    },
    {
      name: "isActive",
      type: "checkbox",
      defaultValue: true,
      admin: {
        position: "sidebar",
      },
    },
  ],
  timestamps: true,
};

export default DisasterTypes;
