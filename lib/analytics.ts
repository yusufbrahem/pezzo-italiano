"use client";

import { sendSiteEvent, type SiteEventType } from "@/lib/site-tracking";

/** GA4 event, plus — for key actions — our own first-party event (/admin/audience). */
function send(action: string, params?: Record<string, string>, siteEvent?: SiteEventType) {
  try {
    // window.gtag is defined early by components/Analytics.tsx's init snippet;
    // gtag.js itself loads lazily and flushes whatever was queued before it.
    (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.("event", action, params ?? {});
  } catch {
    // GA not yet loaded — safe to ignore
  }
  if (siteEvent) sendSiteEvent(siteEvent);
}

export const track = {
  ctaClick: (label: string) =>
    send("cta_click", { label }),

  callClick: (phone: string, source = "unknown") =>
    send("call_click", { phone, source }, "call"),

  whatsappClick: (source = "unknown") =>
    send("whatsapp_click", { source }, "whatsapp"),

  mapClick: (source = "contact") =>
    send("map_click", { source }, "directions"),

  socialClick: (platform: string) =>
    send("social_click", { platform }, "social"),

  menuTabClick: (tab: string) => {
    send("menu_tab_click", { tab });
    sendSiteEvent("menu_tab", { detail: tab });
  },

  comingSoonToggle: (opened: boolean) =>
    send("coming_soon_toggle", { state: opened ? "open" : "close" }),

  reviewsCTAClick: () =>
    send("reviews_cta_click"),

  orderStart: (source = "unknown") =>
    send("order_start", { source }, "order_start"),

  orderSubmit: (orderType: string) =>
    send("order_submit", { order_type: orderType }, "order_submit"),

  // PWA — iOS has no real "install" event, only a way to detect the app is
  // *currently running* installed (display-mode: standalone). We track that
  // as a proxy. Android/desktop Chrome fire a real `appinstalled` event.
  pwaPromptShown: (platform: string) =>
    send("pwa_prompt_shown", { platform }),

  pwaPromptDismissed: (platform: string) =>
    send("pwa_prompt_dismissed", { platform }),

  pwaInstalled: (platform: string) =>
    send("pwa_installed", { platform }),

  pwaStandaloneLaunch: (platform: string) =>
    send("pwa_standalone_launch", { platform }),

  shareClick: (source: string) =>
    send("share_click", { source }, "share"),

  postOrderReviewClick: () =>
    send("post_order_review_click"),

  // First-party only (/admin/audience) — anonymous dish interest & form drop-off.
  galleryOpen: (photoType: string) =>
    sendSiteEvent("gallery_open", { detail: photoType }),

  /** Menu card photo viewer closed: which dish, how many distinct photos were seen, out of how many. */
  itemPhotos: (menuItemId: string, seen: number, total: number) =>
    sendSiteEvent("item_photos", { detail: menuItemId, value: seen, extra: { items: total } }),

  cartAdd: (menuItemId: string, size: string | null) =>
    sendSiteEvent("cart_add", { detail: menuItemId, extra: size ? { size } : undefined }),

  /** Order form closed or page left without sending: how far they got and what was in the cart. */
  orderAbandon: (step: "opened" | "items" | "details" | "address", cartTotal: number, itemCount: number, orderType: string) =>
    sendSiteEvent("order_abandon", { detail: step, value: cartTotal, extra: { items: itemCount, ot: orderType } }),
};
