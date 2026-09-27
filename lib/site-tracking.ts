"use client";

// Sends one anonymous event to /api/track (first-party analytics shown in
// /admin/audience). Fire-and-forget: never awaited, errors swallowed,
// `keepalive` so a click that leaves the page (tel:, wa.me…) still arrives.

export type SiteEventType =
  | "pageview"
  | "order_start"
  | "order_submit"
  | "call"
  | "whatsapp"
  | "directions"
  | "social"
  | "share";

export function sendSiteEvent(type: SiteEventType, extra?: { referrer?: string; utmSource?: string; standalone?: boolean }) {
  try {
    void fetch("/api/track", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        t: type,
        p: window.location.pathname,
        ...(extra?.referrer ? { r: extra.referrer } : {}),
        ...(extra?.utmSource ? { u: extra.utmSource } : {}),
        ...(extra?.standalone ? { s: true } : {}),
      }),
    }).catch(() => {});
  } catch {
    // ignore
  }
}
