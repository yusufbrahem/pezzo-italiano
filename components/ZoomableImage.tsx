"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import Image from "next/image";

// A photo you can zoom into, for the full-screen viewer:
//   pinch (2 fingers) · double-tap / double-click · mouse wheel · +/- via ref.
// At 1× a one-finger drag is a swipe — sideways → onSwipe(±1), downwards →
// onSwipeDown (close); once zoomed the same drag pans instead. A single tap
// (reported only once it's clear no double-tap follows) → onTap(onPhoto),
// onPhoto = whether it landed on the photo itself or on the black around it. Hand-rolled
// pointer events rather than Framer's drag, which can't tell a swipe from a
// pinch or a pan.

export interface ZoomHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

const MIN = 1;
const MAX = 4;
const STEP = 1.6; // +/- buttons and keyboard
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 280;
const SWIPE_PX = 60;
const SWIPE_DOWN_PX = 90;

type View = { s: number; x: number; y: number };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function ZoomableImage({
  src,
  alt,
  ref,
  onSwipe,
  onSwipeDown,
  onTap,
  onZoomChange,
}: {
  src: string;
  alt: string;
  ref?: Ref<ZoomHandle>;
  onSwipe?: (dir: 1 | -1) => void;
  onSwipeDown?: () => void;
  onTap?: (onPhoto: boolean) => void;
  onZoomChange?: (zoomed: boolean) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ s: 1, x: 0, y: 0 });
  const [swipe, setSwipe] = useState({ x: 0, y: 0 }); // live finger-follow at 1×
  const [animate, setAnimate] = useState(false); // smooth for taps/buttons, instant while gesturing
  const viewRef = useRef(view); // latest view for gesture math (kept in sync by set())
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<
    | { kind: "pan"; startX: number; startY: number; from: View; t: number; moved: boolean; axis?: "x" | "y" }
    | { kind: "pinch"; dist: number; mid: { x: number; y: number }; from: View }
    | null
  >(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);

  // Keep the photo covering the screen while panning. Limits come from the
  // photo's *displayed* size (object-contain), not the box — otherwise a wide
  // photo on a tall phone screen could be dragged into empty black space.
  // Photo size as displayed at 1× (object-contain inside the box).
  const photoSize = useCallback((): [number, number, number, number] => {
    const el = boxRef.current!;
    const W = el.clientWidth;
    const H = el.clientHeight;
    // Read the photo's shape straight from the <img>: an onLoad handler can miss
    // photos that were already cached (loaded before React attached it).
    const img = el.querySelector("img");
    const a = img?.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : W / H;
    const [iw, ih] = a > W / H ? [W, W / a] : [H * a, H];
    return [W, H, iw, ih];
  }, []);

  const bound = useCallback((v: View): View => {
    if (!boxRef.current || v.s <= 1) return { s: Math.max(v.s, 1), x: 0, y: 0 };
    const [W, H, iw, ih] = photoSize();
    const mx = Math.max(0, (iw * v.s - W) / 2);
    const my = Math.max(0, (ih * v.s - H) / 2);
    return { s: v.s, x: clamp(v.x, -mx, mx), y: clamp(v.y, -my, my) };
  }, [photoSize]);

  // Zoom to scale `s` keeping the photo point under (px, py) — box-centre coordinates — in place.
  const zoomAt = useCallback(
    (s: number, px: number, py: number, from: View = viewRef.current) => {
      const ns = clamp(s, MIN, MAX);
      const k = ns / from.s;
      return bound({ s: ns, x: px - (px - from.x) * k, y: py - (py - from.y) * k });
    },
    [bound]
  );

  const toLocal = (clientX: number, clientY: number) => {
    const r = boxRef.current!.getBoundingClientRect();
    return { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) };
  };

  const set = useCallback((v: View, smooth: boolean) => {
    viewRef.current = v;
    setAnimate(smooth);
    setView(v);
  }, []);

  useEffect(() => {
    onZoomChange?.(view.s > 1.01);
  }, [view.s, onZoomChange]);

  useEffect(
    () => () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
    },
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => set(zoomAt(viewRef.current.s * STEP, 0, 0), true),
      zoomOut: () => set(zoomAt(viewRef.current.s / STEP, 0, 0), true),
      reset: () => set({ s: 1, x: 0, y: 0 }, true),
    }),
    [set, zoomAt]
  );

  // Wheel needs a non-passive listener to stop the page from scrolling.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toLocal(e.clientX, e.clientY);
      set(zoomAt(viewRef.current.s * Math.exp(-e.deltaY * 0.0025), p.x, p.y), false);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [set, zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    try {
      boxRef.current?.setPointerCapture(e.pointerId); // keep receiving moves outside the box
    } catch {
      // some browsers throw for an already-released pointer; the gesture still works
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      setSwipe({ x: 0, y: 0 });
      const [a, b] = pts;
      gesture.current = {
        kind: "pinch",
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        mid: toLocal((a.x + b.x) / 2, (a.y + b.y) / 2),
        from: viewRef.current,
      };
    } else if (pts.length === 1) {
      gesture.current = { kind: "pan", startX: e.clientX, startY: e.clientY, from: viewRef.current, t: performance.now(), moved: false };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pinch") {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = toLocal((a.x + b.x) / 2, (a.y + b.y) / 2);
      // Scale around the starting midpoint, then follow the fingers' movement.
      const z = zoomAt(g.from.s * (d / g.dist), g.mid.x, g.mid.y, g.from);
      set(bound({ s: z.s, x: z.x + (mid.x - g.mid.x), y: z.y + (mid.y - g.mid.y) }), false);
      return;
    }
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (Math.hypot(dx, dy) > 8) g.moved = true;
    if (g.from.s > 1.01) {
      set(bound({ s: g.from.s, x: g.from.x + dx, y: g.from.y + dy }), false);
      return;
    }
    // At 1×: lock to one axis after a few px, then follow the finger.
    if (!g.axis && Math.hypot(dx, dy) > 10) g.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    setAnimate(false);
    if (g.axis === "x" && onSwipe) setSwipe({ x: dx, y: 0 });
    else if (g.axis === "y" && onSwipeDown) setSwipe({ x: 0, y: Math.max(0, dy) });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    const g = gesture.current;
    pointers.current.delete(e.pointerId);

    if (g?.kind === "pinch") {
      // One finger may stay down: continue as a pan from here.
      const rest = [...pointers.current.values()][0];
      gesture.current = rest
        ? { kind: "pan", startX: rest.x, startY: rest.y, from: viewRef.current, t: performance.now(), moved: true }
        : null;
      if (viewRef.current.s < 1.05) set({ s: 1, x: 0, y: 0 }, true);
      return;
    }
    if (!g || pointers.current.size > 0) return;
    gesture.current = null;

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (g.from.s <= 1.01) {
      setAnimate(true);
      setSwipe({ x: 0, y: 0 });
      if (g.axis === "x" && onSwipe && Math.abs(dx) > SWIPE_PX) {
        onSwipe(dx < 0 ? 1 : -1);
        return;
      }
      if (g.axis === "y" && onSwipeDown && dy > SWIPE_DOWN_PX) {
        onSwipeDown();
        return;
      }
    }

    // Taps: a second tap soon after → zoom in at that point (or back out);
    // a lone tap → onTap, once the double-tap window has passed.
    if (!g.moved && performance.now() - g.t < 300) {
      const now = performance.now();
      const last = lastTap.current;
      if (last && now - last.t < DOUBLE_TAP_MS + 40 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 30) {
        lastTap.current = null;
        if (tapTimer.current) clearTimeout(tapTimer.current);
        if (viewRef.current.s > 1.01) set({ s: 1, x: 0, y: 0 }, true);
        else {
          const p = toLocal(e.clientX, e.clientY);
          set(zoomAt(DOUBLE_TAP_SCALE, p.x, p.y), true);
        }
      } else {
        lastTap.current = { t: now, x: e.clientX, y: e.clientY };
        if (onTap) {
          const p = toLocal(e.clientX, e.clientY);
          const [, , iw, ih] = photoSize();
          const v = viewRef.current;
          const onPhoto = Math.abs(p.x - v.x) <= (iw * v.s) / 2 && Math.abs(p.y - v.y) <= (ih * v.s) / 2;
          if (tapTimer.current) clearTimeout(tapTimer.current);
          tapTimer.current = setTimeout(() => onTap(onPhoto), DOUBLE_TAP_MS);
        }
      }
    }
  };

  const zoomed = view.s > 1.01;
  const pull = Math.min(swipe.y, 400); // swipe-down-to-close feedback: shrink + fade

  return (
    <div
      ref={boxRef}
      className={`absolute inset-0 overflow-hidden touch-none select-none ${zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(${view.x + swipe.x}px, ${view.y + swipe.y}px, 0) scale(${view.s * (1 - pull / 2000)})`,
          opacity: 1 - pull / 800,
          transition: animate ? "transform 0.25s ease-out, opacity 0.25s ease-out" : "none",
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          draggable={false}
          className="object-contain pointer-events-none"
          // Ask for a sharper file once zoomed in (the browser upgrades from the srcset).
          sizes={zoomed ? "250vw" : "100vw"}
          quality={85}
          priority
        />
      </div>
    </div>
  );
}
