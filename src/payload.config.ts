import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

import {
  Users,
  DisasterTypes,
  RawEvents,
  Products,
  PublishedArticles,
  IngestionLogs,
  Subscribers,
} from "./collections";

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "fallback-secret-change-in-production",
  admin: {
    user: "users",
    meta: {
      titleSuffix: " | World Under Water",
    },
  },

  collections: [
    Users,
    DisasterTypes,
    RawEvents,
    Products,
    PublishedArticles,
    IngestionLogs,
    Subscribers,
  ],

  editor: lexicalEditor({}),

  // P1-1: Enhanced connection pooling for Payload CMS
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      max: 50,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 30000,
    },
    migrationDir: path.resolve(dirname, "../migrations"),
  }),

  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },

  graphQL: {
    schemaOutputFile: path.resolve(dirname, "generated-schema.graphql"),
  },

  cors: [process.env.PAYLOAD_PUBLIC_SITE_URL || "http://localhost:3000"].filter(
    Boolean,
  ),

  csrf: [process.env.PAYLOAD_PUBLIC_SITE_URL || "http://localhost:3000"].filter(
    Boolean,
  ),
});
