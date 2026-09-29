"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItemPhoto } from "@/data/menu";

// Full-screen viewer for one menu item's photos — opened by tapping a menu
// card's photo. Swipe / arrows / keyboard to browse, Escape or backdrop to close.
// Portaled to <body>: the cards are transformed (hover lift, Framer entry
// animation), which would otherwise trap a position:fixed overlay inside them.
// onViewed(seen) fires once per opening — on close, or when the page is left
// with the viewer still open — with the number of distinct photos looked at.
const noopSubscribe = () => () => {};
export default function ItemPhotosLightbox({
  title,
  photos,
  open,
  startIndex = 0,
  onClose,
  onViewed,
}: {
  title: string;
  photos: ItemPhoto[];
  open: boolean;
  startIndex?: number; // photo shown first (the one the card was on)
  onClose: () => void;
  onViewed?: (seen: number) => void;
}) {
  // dir = side the new photo slides in from (1 = from the right).
  const [[index, dir], setView] = useState<[number, number]>([startIndex, 0]);
  const count = photos.length;
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);

  // Start on the card's current photo each time the viewer opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setView([Math.min(startIndex, Math.max(count - 1, 0)), 0]);
  }

  const prev = useCallback(() => setView(([i]) => [(i - 1 + count) % count, -1]), [count]);
  const next = useCallback(() => setView(([i]) => [(i + 1) % count, 1]), [count]);
  const goTo = (i: number) => setView(([cur]) => [i, i > cur ? 1 : -1]);
  const seenRef = useRef(new Set<number>());
  const reportedRef = useRef(false);
  const report = useCallback(() => {
    if (reportedRef.current || seenRef.current.size === 0) return;
    reportedRef.current = true;
    onViewed?.(seenRef.current.size);
  }, [onViewed]);
  const close = useCallback(() => { report(); onClose(); }, [report, onClose]);

  // Declared before the "seen" effect below so a new opening starts from an empty set.
  useEffect(() => {
    if (!open) return;
    seenRef.current = new Set();
    reportedRef.current = false;
    window.addEventListener("pagehide", report);
    return () => window.removeEventListener("pagehide", report);
  }, [open, report]);

  useEffect(() => {
    if (open) seenRef.current.add(index);
  }, [open, index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, prev, next]);

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {open && count > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-brand-black/95 flex flex-col items-center justify-center p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={`Photos — ${title}`}
        >
          <button onClick={close} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors" aria-label="Fermer">
            <X size={24} />
          </button>

          <p
            className="absolute top-5 left-4 right-16 text-brand-white font-serif font-bold text-lg truncate"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            {title}
          </p>

          {count > 1 && (
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors" aria-label="Photo précédente">
              <ChevronLeft size={28} />
            </button>
          )}

          <motion.div
            key={index}
            initial={{ opacity: 0, x: dir * 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative max-w-4xl w-full max-h-[70vh] aspect-[4/3] touch-pan-y"
            onClick={(e) => e.stopPropagation()}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 || info.velocity.x < -400) next();
              else if (info.offset.x > 60 || info.velocity.x > 400) prev();
            }}
          >
            <Image src={photos[index].src} alt={photos[index].alt} fill className="object-contain pointer-events-none" sizes="100vw" quality={85} priority />
          </motion.div>

          {count > 1 && (
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors" aria-label="Photo suivante">
              <ChevronRight size={28} />
            </button>
          )}

          {count > 1 && (
            <div className="mt-5 w-full max-w-4xl flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <div className="w-full overflow-x-auto">
                <div className="flex gap-2 w-max mx-auto px-1 py-1">
                  {photos.map((p, i) => (
                    <button
                      key={p.src}
                      onClick={() => goTo(i)}
                      className={cn(
                        "relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all",
                        i === index ? "ring-2 ring-brand-gold opacity-100" : "opacity-50 hover:opacity-80"
                      )}
                      aria-label={`Photo ${i + 1}`}
                      aria-current={i === index}
                    >
                      <Image src={p.src} alt="" fill className="object-cover" sizes="56px" quality={50} />
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-brand-white/40 text-xs">{index + 1} / {count}</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
