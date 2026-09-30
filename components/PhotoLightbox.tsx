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
// mouse wheel or the +/- buttons to zoom (ZoomableImage). The photo fills all
// the space between a slim top bar and the thumbnails; a single tap on the
// photo hides both for a true full-screen view. Close: tap outside the photo
// (the black around it, or an empty spot of the bars), ✕, Escape, swipe down. Portaled to <body>: the menu cards are transformed (hover lift,
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
  const [uiHidden, setUiHidden] = useState(false);
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);

  // Start on the card's current photo each time the viewer opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setView([Math.min(startIndex, Math.max(count - 1, 0)), 0]);
      setUiHidden(false);
    }
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

  const hint = (
    <>
      <span className="hidden sm:inline">Double-clic ou molette pour zoomer</span>
      <span className="sm:hidden">Pincez ou touchez deux fois pour zoomer · glissez vers le bas pour fermer</span>
    </>
  );

  return createPortal(
    <AnimatePresence>
      {open && count > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-brand-black flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={`Photos — ${title}`}
        >
          {/* Top bar — hidden with the rest of the UI on a single tap; its empty space closes */}
          <div
            onClick={(e) => e.target === e.currentTarget && close()}
            className={cn(
              "relative z-10 flex items-center gap-2 px-3 sm:px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] transition-opacity duration-200",
              uiHidden && "opacity-0 pointer-events-none"
            )}
          >
            <p
              className="flex-1 min-w-0 text-brand-white font-serif font-bold text-lg truncate"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              {title}
              {count > 1 && <span className="ml-2 font-sans font-normal text-sm text-brand-white/60">{index + 1} / {count}</span>}
            </p>
            <button onClick={() => zoomRef.current?.zoomOut()} disabled={!zoomed} className="p-2 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors disabled:opacity-30" aria-label="Dézoomer">
              <ZoomOut size={22} />
            </button>
            <button onClick={() => zoomRef.current?.zoomIn()} className="p-2 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors" aria-label="Zoomer">
              <ZoomIn size={22} />
            </button>
            <button onClick={close} className="p-2 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors" aria-label="Fermer">
              <X size={24} />
            </button>
          </div>

          {/* Photo — takes all the remaining space, edge to edge */}
          <div className="relative flex-1 min-h-0">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: dir * 80 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-0"
            >
              {/* key={index} remounts this → every photo starts un-zoomed */}
              <ZoomableImage
                ref={zoomRef}
                src={photos[index].src}
                alt={photos[index].alt}
                onSwipe={count > 1 ? (d) => (d === 1 ? next() : prev()) : undefined}
                onSwipeDown={close}
                onTap={(onPhoto) => (onPhoto ? setUiHidden((h) => !h) : close())}
                onZoomChange={setZoomed}
              />
            </motion.div>

            {/* Arrows: computers only (phones swipe), hidden while zoomed or with the UI */}
            {count > 1 && !zoomed && !uiHidden && (
              <>
                <button onClick={prev} className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors" aria-label="Photo précédente">
                  <ChevronLeft size={28} />
                </button>
                <button onClick={next} className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors" aria-label="Photo suivante">
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </div>

          {/* Bottom: caption, thumbnails, hint — hidden on a single tap, and on short (landscape phone) screens */}
          <div
            onClick={(e) => e.target === e.currentTarget && close()}
            className={cn(
              "relative z-10 flex flex-col items-center gap-2 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-opacity duration-200 [@media(max-height:500px)]:hidden",
              uiHidden && "opacity-0 pointer-events-none"
            )}
          >
            {showCaptions && <p className="text-brand-white/70 text-sm text-center">{photos[index].alt}</p>}
            {count > 1 && (
              <div className="w-full max-w-4xl overflow-x-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]">
                <div className="flex gap-2 w-max mx-auto px-1 py-1">
                  {photos.map((p, i) => (
                    <button
                      key={p.src}
                      onClick={() => goTo(i)}
                      className={cn(
                        "relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden transition-all",
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
            )}
            <p className="text-brand-white/60 text-xs text-center">{hint}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
