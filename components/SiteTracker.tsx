"use client";

import { useEffect } from "react";
import { sendSiteEvent } from "@/lib/site-tracking";

// Counts one visit per page load for /admin/audience (see app/api/track).
// Module-level guard: React's dev-mode double effects and client-side
// re-renders must not count the same load twice.
let sent = false;

export default function SiteTracker() {
  useEffect(() => {
    if (sent) return;
    sent = true;
    const params = new URLSearchParams(window.location.search);
    sendSiteEvent("pageview", {
      referrer: document.referrer || undefined,
      utmSource: params.get("utm_source") ?? undefined,
      standalone:
        window.matchMedia?.("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    });
  }, []);

  return null;
}
