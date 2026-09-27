"use client";

import { useEffect } from "react";
import { sendSiteEvent } from "@/lib/site-tracking";

// Anonymous behaviour measurement for /admin/audience (see app/api/track):
//  • one pageview per load, with coarse setup info (language, screen size
//    bucket, dark mode, connection type);
//  • which page sections were actually seen (once each);
//  • engaged time (visible tab + interaction in the last minute), deepest
//    scroll, and load speed — flushed whenever the page is hidden or closed.
// No cookies or storage; nothing here identifies the visitor.
// Module-level guards: React dev double-mounts effects, and a pageview or a
// section must never be counted twice for one page load.

const SECTIONS = ["hero", "histoire", "menu", "signatures", "avis", "galerie", "contact"];
const IDLE_AFTER_MS = 60_000;

let pageviewSent = false;
const seenSections = new Set<string>();

export default function SiteTracker() {
  useEffect(() => {
    // ── Pageview ──────────────────────────────────────────────────────────
    const params = new URLSearchParams(window.location.search);
    const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    if (!pageviewSent) {
      pageviewSent = true;
      sendSiteEvent("pageview", {
        referrer: document.referrer || undefined,
        utmSource: params.get("utm_source") ?? undefined,
        standalone:
          window.matchMedia?.("(display-mode: standalone)").matches ||
          (navigator as Navigator & { standalone?: boolean }).standalone === true,
        extra: {
          lang: navigator.language,
          sw: window.innerWidth,
          dark: window.matchMedia?.("(prefers-color-scheme: dark)").matches,
          net: conn?.effectiveType,
        },
      });
    }

    // ── Sections actually seen ────────────────────────────────────────────
    // "Seen" = a real chunk of it on screen: a quarter of the section, or half
    // the screen for sections taller than the screen.
    const seen = seenSections;
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              for (const e of entries) {
                const id = e.target.id;
                if (seen.has(id) || !e.isIntersecting) continue;
                const needed = Math.min(e.boundingClientRect.height * 0.25, window.innerHeight * 0.5);
                if (e.intersectionRect.height >= needed) {
                  seen.add(id);
                  sendSiteEvent("section_view", { detail: id });
                  io?.unobserve(e.target);
                }
              }
            },
            { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
          )
        : null;
    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (el) io?.observe(el);
    }

    // ── Engaged time, scroll depth, speed ─────────────────────────────────
    let lastActivity = Date.now();
    let engagedSec = 0;
    let flushedSec = 0;
    let maxScroll = 0;
    let lcp: number | undefined;
    let speedSent = false;

    const markActive = () => (lastActivity = Date.now());
    const onScroll = () => {
      markActive();
      const doc = document.documentElement;
      const depth = ((window.scrollY + window.innerHeight) / Math.max(doc.scrollHeight, 1)) * 100;
      if (depth > maxScroll) maxScroll = Math.min(100, depth);
    };
    onScroll();

    const tick = window.setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastActivity < IDLE_AFTER_MS) engagedSec += 1;
    }, 1000);

    let lcpObserver: PerformanceObserver | null = null;
    try {
      lcpObserver = new PerformanceObserver((list) => {
        const last = list.getEntries().at(-1);
        if (last) lcp = last.startTime;
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // LCP unsupported (e.g. older Safari) — load time still reported
    }

    const flush = () => {
      const delta = engagedSec - flushedSec;
      if (delta < 1 && speedSent) return;
      flushedSec = engagedSec;
      const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
      const load = nav && nav.loadEventEnd > 0 ? nav.loadEventEnd : nav?.domContentLoadedEventEnd;
      sendSiteEvent("engagement", {
        value: Math.max(0, delta),
        extra: {
          scroll: Math.round(maxScroll),
          ...(!speedSent ? { lcp: lcp !== undefined ? Math.round(lcp) : undefined, load: load ? Math.round(load) : undefined } : {}),
        },
      });
      speedSent = true;
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", markActive, { passive: true });
    window.addEventListener("keydown", markActive);
    window.addEventListener("touchstart", markActive, { passive: true });
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);

    // Lives for the whole page — the tracker is mounted once in the root layout.
    return () => {
      window.clearInterval(tick);
      io?.disconnect();
      lcpObserver?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", markActive);
      window.removeEventListener("keydown", markActive);
      window.removeEventListener("touchstart", markActive);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  return null;
}
