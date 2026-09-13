"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { track } from "@/lib/analytics";

const DISMISS_KEY = "pi_ios_install_dismissed";

function ShareIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block align-[-2px] mx-0.5"
    >
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  );
}

// Only Safari on iOS/iPadOS exposes "Add to Home Screen" — Chrome/Firefox for
// iOS and in-app browsers (Instagram, Facebook, TikTok…) either don't have it
// or hide it, so we don't prompt there to avoid pointing at a dead end.
function isEligible(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;

  const isInAppBrowser = /FBAN|FBAV|Instagram|Line\/|Messenger|TikTok|Twitter/i.test(ua);
  const isOtherBrowserEngine = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return !isInAppBrowser && !isOtherBrowserEngine;
}

function isStandaloneAlready(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

export default function IOSInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // ignore — treat as not dismissed
    }
    if (dismissed || isStandaloneAlready() || !isEligible()) return;

    const t = setTimeout(() => {
      setVisible(true);
      track.pwaPromptShown("ios");
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setVisible(false);
    track.pwaPromptDismissed("ios");
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="fixed left-3 right-3 z-40"
          style={{ bottom: "calc(84px + env(safe-area-inset-bottom))" }}
        >
          <div className="max-w-sm mx-auto bg-brand-green rounded-2xl shadow-2xl shadow-black/30 border border-brand-gold/25 p-3.5 flex items-center gap-3">
            <Image
              src="/icon-192.png"
              alt=""
              width={42}
              height={42}
              className="rounded-xl flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-brand-white text-[12.5px] font-bold leading-tight mb-1">
                Installez Pezzo Italiano
              </p>
              <p className="text-brand-white/60 text-[11px] leading-snug">
                Appuyez sur <ShareIcon /> puis « Sur l&apos;écran d&apos;accueil »
              </p>
            </div>
            <button
              onClick={dismiss}
              aria-label="Fermer"
              className="w-7 h-7 rounded-full bg-brand-white/10 hover:bg-brand-white/20 active:bg-brand-white/30 flex items-center justify-center text-brand-white/70 flex-shrink-0 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
