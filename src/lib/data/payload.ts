import "server-only";
import { cache } from "react";
import { getPayload } from "payload";
import payloadConfig from "@/payload.config";

export const getPayloadClient = cache(async () => {
  try {
    return await getPayload({ config: payloadConfig });
  } catch (error) {
    console.warn("Payload init failed:", error);
    return null;
  }
});

export async function safeFind<T>(args: {
  collection: string;
  [key: string]: unknown;
}): Promise<T[]> {
  const payload = await getPayloadClient();
  if (!payload) return [];

  try {
    const result = await payload.find(args as any);
    return result.docs as T[];
  } catch (error) {
    console.warn("Payload query failed:", error);
    return [];
  }
}
