import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const MAX_EVENT_TYPE_LENGTH = 50;
const MAX_REFERRER_LENGTH = 1000;
const MAX_USER_AGENT_LENGTH = 500;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const eventTypeRaw =
      typeof body.eventType === "string"
        ? body.eventType
        : typeof body.event_type === "string"
          ? body.event_type
          : "";

    const eventType = eventTypeRaw.trim().slice(0, MAX_EVENT_TYPE_LENGTH);
    if (!eventType) {
      return NextResponse.json(
        { ok: false, error: "eventType is required" },
        { status: 400 },
      );
    }

    const articleId = body.articleId ? String(body.articleId) : null;
    const productId = Number.isFinite(Number(body.productId))
      ? Number(body.productId)
      : null;
    const sessionId = body.sessionId ? String(body.sessionId) : null;

    const headerReferrer = request.headers.get("referer");
    const referrerSource = body.referrer || headerReferrer || null;
    const referrer = referrerSource
      ? String(referrerSource).slice(0, MAX_REFERRER_LENGTH)
      : null;

    const userAgent = request.headers
      .get("user-agent")
      ?.slice(0, MAX_USER_AGENT_LENGTH);

    const countryCode =
      request.headers.get("cf-ipcountry") ||
      request.headers.get("x-vercel-ip-country") ||
      (body.countryCode ? String(body.countryCode) : null);

    await query(
      `
      INSERT INTO analytics_events (
        article_id,
        event_type,
        product_id,
        referrer,
        user_agent,
        country_code,
        session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        articleId,
        eventType,
        productId,
        referrer,
        userAgent || null,
        countryCode,
        sessionId,
      ],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
