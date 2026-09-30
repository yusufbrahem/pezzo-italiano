"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItemPhoto } from "@/data/menu";
import ZoomableImage, { type ZoomHandle } from "@/components/ZoomableImage";

// Full-screen photo viewer — a menu item's photos (tap on a menu card) and the
// Gallery section. Swipe / arrows / keyboard to browse; pinch, double-tap,
// mouse wheel or the +/- buttons to zoom (ZoomableImage); Escape or backdrop
// to close. Portaled to <body>: the menu cards are transformed (hover lift,
// Framer entry animation), which would otherwise trap a position:fixed overlay.
// onViewed(seen) fires once per opening — on close, or when the page is left
// with the viewer still open — with the number of distinct photos looked at.
const noopSubscribe = () => () => {};
export default function PhotoLightbox({
  title,
  photos,
  open,
  startIndex = 0,
  showCaptions = false,
  onClose,
  onViewed,
}: {
  title: string;
  photos: ItemPhoto[];
  open: boolean;
  startIndex?: number; // photo shown first (the one the card was on)
  showCaptions?: boolean; // show each photo's alt text under it (Gallery)
  onClose: () => void;
  onViewed?: (seen: number) => void;
}) {
  // dir = side the new photo slides in from (1 = from the right).
  const [[index, dir], setView] = useState<[number, number]>([startIndex, 0]);
  const count = photos.length;
  const zoomRef = useRef<ZoomHandle>(null);
  const [zoomed, setZoomed] = useState(false);
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
      else if (e.key === "+" || e.key === "=") zoomRef.current?.zoomIn();
      else if (e.key === "-") zoomRef.current?.zoomOut();
      else if (e.key === "0") zoomRef.current?.reset();
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

          <div className="absolute top-4 right-16 z-10 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => zoomRef.current?.zoomOut()} disabled={!zoomed} className="p-2 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors disabled:opacity-30" aria-label="Dézoomer">
              <ZoomOut size={22} />
            </button>
            <button onClick={() => zoomRef.current?.zoomIn()} className="p-2 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors" aria-label="Zoomer">
              <ZoomIn size={22} />
            </button>
          </div>

          <p
            className="absolute top-5 left-4 right-40 text-brand-white font-serif font-bold text-lg truncate"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            {title}
          </p>

          {count > 1 && !zoomed && (
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors" aria-label="Photo précédente">
              <ChevronLeft size={28} />
            </button>
          )}

          <motion.div
            key={index}
            initial={{ opacity: 0, x: dir * 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative max-w-4xl w-full max-h-[70vh] aspect-[4/3]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* key={index} on the parent remounts this → every photo starts un-zoomed */}
            <ZoomableImage
              ref={zoomRef}
              src={photos[index].src}
              alt={photos[index].alt}
              onSwipe={count > 1 ? (d) => (d === 1 ? next() : prev()) : undefined}
              onZoomChange={setZoomed}
            />
          </motion.div>

          {count > 1 && !zoomed && (
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors" aria-label="Photo suivante">
              <ChevronRight size={28} />
            </button>
          )}

          {showCaptions && (
            <p className="mt-4 text-brand-white/70 text-sm text-center px-4">{photos[index].alt}</p>
          )}

          {count === 1 && (
            <p className="mt-5 text-brand-white/60 text-xs">
              <span className="hidden sm:inline">Double-clic ou molette pour zoomer</span>
              <span className="sm:hidden">Touchez deux fois ou pincez pour zoomer</span>
            </p>
          )}

          {count > 1 && (
            <div className="mt-5 w-full max-w-4xl flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <div className="w-full overflow-x-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]">
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
              <p className="text-brand-white/60 text-xs">
                {index + 1} / {count}
                <span className="hidden sm:inline"> · double-clic ou molette pour zoomer</span>
                <span className="sm:hidden"> · touchez deux fois ou pincez pour zoomer</span>
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
