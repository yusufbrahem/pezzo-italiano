"use client";

import { sendGAEvent } from "@next/third-parties/google";

function send(action: string, params?: Record<string, string>) {
  try {
    sendGAEvent("event", action, params ?? {});
  } catch {
    // GA not yet loaded — safe to ignore
  }
}

export const track = {
  ctaClick: (label: string) =>
    send("cta_click", { label }),

  callClick: (phone: string, source = "unknown") =>
    send("call_click", { phone, source }),

  whatsappClick: (source = "unknown") =>
    send("whatsapp_click", { source }),

  mapClick: (source = "contact") =>
    send("map_click", { source }),

  socialClick: (platform: string) =>
    send("social_click", { platform }),

  menuTabClick: (tab: string) =>
    send("menu_tab_click", { tab }),

  comingSoonToggle: (opened: boolean) =>
    send("coming_soon_toggle", { state: opened ? "open" : "close" }),

  reviewsCTAClick: () =>
    send("reviews_cta_click"),

  orderStart: (source = "unknown") =>
    send("order_start", { source }),

  orderSubmit: (orderType: string) =>
    send("order_submit", { order_type: orderType }),

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
    send("share_click", { source }),

  postOrderReviewClick: () =>
    send("post_order_review_click"),
};
