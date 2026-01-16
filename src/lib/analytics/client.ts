"use client";

export interface AnalyticsEvent {
  eventType: string;
  articleId?: string;
  productId?: string | number;
  referrer?: string;
  sessionId?: string;
  countryCode?: string;
}

const SESSION_KEY = "wuw_session";

function getSessionId(): string {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(SESSION_KEY, generated);
  return generated;
}

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  try {
    const payload = {
      ...event,
      sessionId: event.sessionId || getSessionId(),
      referrer: event.referrer ?? document.referrer,
    };

    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }

    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Ignore client-side analytics errors
  }
}
