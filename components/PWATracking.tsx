"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

function getPlatform(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

// Invisible — fires analytics events so "installs" show up in GA4.
// Mounted once, site-wide (see app/layout.tsx).
export default function PWATracking() {
  useEffect(() => {
    if (isStandalone()) {
      try {
        const key = "pi_pwa_launch_tracked";
        if (!sessionStorage.getItem(key)) {
          track.pwaStandaloneLaunch(getPlatform());
          sessionStorage.setItem(key, "1");
        }
      } catch {
        // storage unavailable (private mode, etc.) — track once anyway
        track.pwaStandaloneLaunch(getPlatform());
      }
    }

    // Real install event — fires on Android/desktop Chrome, not iOS Safari
    const onInstalled = () => track.pwaInstalled(getPlatform());
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  return null;
}
