"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { track } from "@/lib/analytics";

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  source: string;
  className?: string;
  iconSize?: number;
  label?: string;
}

export default function ShareButton({
  title,
  text,
  url,
  source,
  className,
  iconSize = 14,
  label,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    track.shareClick(source);

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User cancelled the native share sheet — nothing to do
      }
      return;
    }

    // No Web Share API (most desktop browsers) — fall back to copy link
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — silently no-op
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? "Lien copié" : "Partager"}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-brand-charcoal/40 hover:text-brand-gold active:scale-90 transition-all duration-150"
      }
    >
      {copied ? <Check size={iconSize} /> : <Share2 size={iconSize} />}
      {label && <span>{copied ? "Copié !" : label}</span>}
    </button>
  );
}
