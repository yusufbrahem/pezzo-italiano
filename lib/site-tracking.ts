"use client";

// Sends one anonymous event to /api/track (first-party analytics shown in
// /admin/audience). Fire-and-forget: never awaited, errors swallowed,
// `keepalive` so an event sent while leaving the page (tel:, wa.me, closing
// the tab) still arrives. The server whitelists every field per event type.

export type SiteEventType =
  | "pageview"
  | "order_start"
  | "order_submit"
  | "call"
  | "whatsapp"
  | "directions"
  | "social"
  | "share"
  | "section_view"
  | "engagement"
  | "cart_add"
  | "order_abandon"
  | "gallery_open"
  | "menu_tab"
  | "item_photos";

export interface SiteEventOptions {
  referrer?: string;
  utmSource?: string;
  standalone?: boolean;
  detail?: string;
  value?: number;
  extra?: {
    lang?: string;
    sw?: number;
    dark?: boolean;
    net?: string;
    scroll?: number;
    lcp?: number;
    load?: number;
    size?: string;
    items?: number;
    ot?: string;
  };
}

export function sendSiteEvent(type: SiteEventType, opts: SiteEventOptions = {}) {
  try {
    const extra = opts.extra ? Object.fromEntries(Object.entries(opts.extra).filter(([, v]) => v !== undefined)) : null;
    void fetch("/api/track", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        t: type,
        p: window.location.pathname,
        ...(opts.referrer ? { r: opts.referrer } : {}),
        ...(opts.utmSource ? { u: opts.utmSource } : {}),
        ...(opts.standalone ? { s: true } : {}),
        ...(opts.detail ? { d: opts.detail } : {}),
        ...(opts.value !== undefined && Number.isFinite(opts.value) ? { v: opts.value } : {}),
        ...(extra && Object.keys(extra).length ? { x: extra } : {}),
      }),
    }).catch(() => {});
  } catch {
    // ignore
  }
}
