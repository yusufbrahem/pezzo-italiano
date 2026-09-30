"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence, animate, useMotionValue } from "framer-motion";
import { Leaf, Clock, Crown, Sparkles, Star, Gem, Heart, Code2, Images, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getItemPhotos,
  menuCategories,
  type MenuCategory,
  type ItemPhoto,
  type MenuItem,
} from "@/data/menu";
import { cn, formatPrice } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { useOrder } from "@/context/OrderContext";
import type { PricingTier, PricingTierIcon } from "@/lib/data/settings";
import PhotoLightbox from "@/components/PhotoLightbox";

// ── Pricing reference table (actual menu tiers) ──────────────────
// Tier data comes entirely from useOrder().pricingTiers (site_settings.
// pricing_tiers, editable from /admin/pricing) — any number of tiers, each
// picking its own visual "style"/"icon"/"badge", so adding a new tariff for
// a new item type (or a Plateau price for an existing one) needs no code
// change here.
function tierSizeRows(tier: PricingTier): [string, string][] {
  const rows: [string, string][] = [];
  if (tier.priceQuart !== null) rows.push(["¼ Plateau", `${tier.priceQuart} DT`]);
  if (tier.priceDemi !== null) rows.push(["½ Plateau", `${tier.priceDemi} DT`]);
  if (tier.pricePlateau !== null) rows.push(["Plateau", `${tier.pricePlateau} DT`]);
  return rows;
}

const TIER_ICON_COMPONENTS: Record<PricingTierIcon, typeof Star | null> = {
  none: null,
  star: Star,
  gem: Gem,
  crown: Crown,
  leaf: Leaf,
  sparkles: Sparkles,
  heart: Heart,
};

// The 4 card "looks" carried over from the original fixed design — any tier
// can now pick any of them via /admin/pricing instead of being tied to a key.
const TIER_STYLE_CLASSES: Record<
  PricingTier["style"],
  { card: string; glow: string | null; label: string; price: string; priceUnit: string; itemsLabel: string; tagline: string; divider: string; rowLabel: string; rowValue: string; badge: string }
> = {
  white: {
    card: "rounded-2xl border border-brand-green/10 bg-white p-5",
    glow: null,
    label: "text-[10px] font-black uppercase tracking-widest text-brand-green mb-1",
    price: "font-serif text-2xl font-black text-brand-charcoal mb-0.5",
    priceUnit: "text-base font-normal text-brand-charcoal/65",
    itemsLabel: "text-[10px] text-brand-charcoal/65 mb-4",
    tagline: "text-[10px] text-brand-gold-deep italic mb-4",
    divider: "space-y-1.5 border-t border-brand-green/8 pt-3",
    rowLabel: "text-xs text-brand-charcoal/65",
    rowValue: "font-serif font-black text-sm text-brand-gold-deep",
    badge: "bg-brand-gold text-brand-green",
  },
  green: {
    card: "group relative overflow-hidden rounded-2xl bg-brand-green border border-brand-gold/20 p-5 shadow-md hover:shadow-xl hover:shadow-brand-gold/10 hover:border-brand-gold/40 transition-shadow duration-300",
    glow: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.15) 0%, transparent 70%)",
    label: "text-[10px] font-black uppercase tracking-widest",
    price: "font-serif text-2xl font-black text-brand-white mb-0.5",
    priceUnit: "text-base font-normal text-brand-white/60",
    itemsLabel: "text-[10px] text-brand-white/60 mb-1",
    tagline: "text-[10px] text-brand-gold italic mb-4",
    divider: "space-y-1.5 border-t border-brand-white/10 pt-3",
    rowLabel: "text-xs text-brand-white/60",
    rowValue: "font-serif font-black text-sm text-brand-gold",
    badge: "bg-brand-gold text-brand-green",
  },
  charcoal: {
    card: "group relative overflow-hidden rounded-2xl bg-brand-charcoal border border-brand-gold/30 p-5 shadow-md hover:shadow-xl hover:shadow-brand-gold/15 hover:border-brand-gold/50 transition-shadow duration-300",
    glow: "radial-gradient(circle at 50% 0%, rgba(232,200,122,0.18) 0%, transparent 70%)",
    label: "text-[10px] font-black uppercase tracking-widest",
    price: "font-serif text-2xl font-black text-brand-white mb-0.5",
    priceUnit: "text-base font-normal text-brand-white/60",
    itemsLabel: "text-[10px] text-brand-white/60 mb-1",
    tagline: "text-[10px] text-brand-gold italic mb-4",
    divider: "space-y-1.5 border-t border-brand-white/10 pt-3",
    rowLabel: "text-xs text-brand-white/60",
    rowValue: "font-serif font-black text-sm text-brand-gold",
    badge: "bg-brand-gold text-brand-charcoal",
  },
  gold: {
    card: "relative rounded-2xl bg-gradient-to-br from-brand-gold-light via-brand-gold to-brand-gold-light border-2 border-brand-gold p-5 shadow-lg shadow-brand-gold/30",
    glow: null,
    label: "text-[10px] font-black uppercase tracking-widest text-brand-green/70 mb-1",
    price: "font-serif text-2xl font-black text-brand-green mb-0.5",
    priceUnit: "text-base font-normal text-brand-green/75",
    itemsLabel: "text-[10px] text-brand-green/80 mb-4",
    tagline: "text-[10px] text-brand-green/85 italic mb-4",
    divider: "space-y-1.5 border-t border-brand-green/15 pt-3",
    rowLabel: "text-xs text-brand-green/80",
    rowValue: "font-serif font-black text-sm text-brand-green",
    badge: "bg-brand-green text-brand-gold-light",
  },
};

function PricingTierCard({ tier }: { tier: PricingTier }) {
  const s = TIER_STYLE_CLASSES[tier.style];
  const Icon = TIER_ICON_COMPONENTS[tier.icon];
  const sizeRows = tierSizeRows(tier);
  const fontFamily = { fontFamily: "var(--font-playfair), serif" };

  const body = (
    <>
      {tier.badge && (
        <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-2", s.badge)}>
          {Icon && <Icon size={10} />}
          {tier.badge}
        </div>
      )}
      <div className={cn(!tier.badge && Icon ? "inline-flex items-center gap-1 mb-1" : "", tier.style === "green" || tier.style === "charcoal" ? "text-brand-gold" : "")}>
        {!tier.badge && Icon && <Icon size={11} className={tier.style === "green" ? "fill-brand-gold" : ""} />}
        <p className={s.label}>{tier.label}</p>
      </div>
      {tier.pricePer100g !== null && (
        <p className={s.price} style={fontFamily}>
          {tier.pricePer100g.toFixed(1)} <span className={s.priceUnit}>DT / 100g</span>
        </p>
      )}
      <p className={s.itemsLabel}>{tier.itemsLabel}</p>
      {tier.tagline && <p className={s.tagline}>{tier.tagline}</p>}
      {sizeRows.length > 0 && (
        <div className={s.divider}>
          {sizeRows.map(([l, v]) => (
            <div key={l} className="flex justify-between items-center">
              <span className={s.rowLabel}>{l}</span>
              <span className={s.rowValue} style={fontFamily}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (s.glow) {
    return (
      <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25 }} className={s.card}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: s.glow }} />
        {body}
      </motion.div>
    );
  }
  return <div className={s.card}>{body}</div>;
}

function PizzaPricingTable() {
  const { pricingTiers } = useOrder();
  if (pricingTiers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12 max-w-5xl mx-auto"
    >
      <p className="text-center text-brand-charcoal/65 text-[10px] uppercase tracking-widest mb-5">
        Tarifs — choisissez votre portion
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {pricingTiers.map((tier) => (
          <PricingTierCard key={tier.id} tier={tier} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Swipeable photo strip on a menu card ─────────────────────────
// Swipe (or drag / hover arrows on desktop) to browse; a tap without a swipe
// opens the full-screen viewer on the current photo. Photos browsed here are
// reported as one item_photos event when the page is hidden/left.
function CardPhotoCarousel({
  item,
  photos,
  hovered,
  onOpen,
}: {
  item: MenuItem;
  photos: ItemPhoto[];
  hovered: boolean;
  onOpen: (index: number) => void;
}) {
  const count = photos.length;
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const draggedRef = useRef(false);
  const seenRef = useRef(new Set([0]));

  const go = useCallback(
    (i: number) => {
      const n = Math.max(0, Math.min(count - 1, i));
      indexRef.current = n;
      setIndex(n);
      seenRef.current.add(n);
      animate(x, -n * (boxRef.current?.offsetWidth ?? 0), { type: "spring", stiffness: 320, damping: 34 });
    },
    [count, x]
  );

  // Stay aligned on the current photo when the card is resized.
  useEffect(() => {
    const el = boxRef.current;
    if (!el || count < 2) return;
    const ro = new ResizeObserver(() => x.set(-indexRef.current * el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [count, x]);

  useEffect(() => {
    if (count < 2) return;
    const flush = () => {
      if (document.visibilityState !== "hidden" || seenRef.current.size < 2) return;
      track.itemPhotos(item.id, seenRef.current.size, count);
      seenRef.current = new Set([indexRef.current]);
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [item.id, count]);

  const arrow =
    "absolute top-1/2 -translate-y-1/2 z-10 hidden sm:flex w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm text-white items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/55 transition-opacity";

  return (
    <div
      ref={boxRef}
      role="button"
      tabIndex={0}
      // Must contain the visible badge text ("2/5" / "Voir la photo") — label-content-name-mismatch.
      aria-label={count > 1 ? `Voir les photos — ${item.name} (${index + 1}/${count})` : `Voir la photo — ${item.name}`}
      onPointerDown={() => {
        draggedRef.current = false;
      }}
      onClick={() => {
        if (draggedRef.current) return;
        onOpen(indexRef.current);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(indexRef.current);
        } else if (e.key === "ArrowRight") go(indexRef.current + 1);
        else if (e.key === "ArrowLeft") go(indexRef.current - 1);
      }}
      className="absolute inset-0 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-gold"
    >
      <motion.div
        className="flex h-full"
        style={{ x, width: `${count * 100}%` }}
        drag={count > 1 ? "x" : false}
        dragConstraints={boxRef}
        dragElastic={0.25}
        dragMomentum={false}
        onDragStart={() => {
          draggedRef.current = true;
        }}
        onDragEnd={(_, info) => {
          const w = boxRef.current?.offsetWidth ?? 1;
          if (info.offset.x < -w * 0.2 || info.velocity.x < -400) go(indexRef.current + 1);
          else if (info.offset.x > w * 0.2 || info.velocity.x > 400) go(indexRef.current - 1);
          else go(indexRef.current);
        }}
      >
        {photos.map((p, i) => (
          <div key={p.src} className="relative h-full flex-shrink-0 overflow-hidden" style={{ width: `${100 / count}%` }}>
            <Image
              src={p.src}
              alt={p.alt}
              fill
              draggable={false}
              className={cn(
                "object-cover transition-transform duration-700 pointer-events-none select-none",
                hovered ? "scale-110" : "scale-100"
              )}
              style={{ objectPosition: i === 0 ? (item.imagePosition ?? "center") : "center" }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ))}
      </motion.div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-green/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {count > 1 && (
        <>
          {index > 0 && (
            <button type="button" tabIndex={-1} onClick={(e) => { e.stopPropagation(); go(index - 1); }} className={cn(arrow, "left-2")} aria-label="Photo précédente">
              <ChevronLeft size={18} />
            </button>
          )}
          {index < count - 1 && (
            <button type="button" tabIndex={-1} onClick={(e) => { e.stopPropagation(); go(index + 1); }} className={cn(arrow, "right-2")} aria-label="Photo suivante">
              <ChevronRight size={18} />
            </button>
          )}
          <div aria-hidden className="pointer-events-none absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
            {photos.map((p, i) => (
              <span
                key={p.src}
                className={cn("h-1.5 rounded-full bg-white shadow transition-all duration-300", i === index ? "w-4 opacity-100" : "w-1.5 opacity-60")}
              />
            ))}
          </div>
        </>
      )}

      <span className="pointer-events-none absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-[10px] font-semibold">
        <Images size={11} />
        {count > 1 ? `${index + 1}/${count}` : "Voir la photo"}
      </span>
    </div>
  );
}

// ── Available pizza card ─────────────────────────────────────────
function MenuCard({ item, index, onOrder }: { item: MenuItem; index: number; onOrder: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [devNoteOpen, setDevNoteOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [photoStart, setPhotoStart] = useState(0);
  const photos = getItemPhotos(item);
  const closePhotos = useCallback(() => setPhotosOpen(false), []);
  const onPhotosViewed = useCallback((seen: number) => track.itemPhotos(item.id, seen, photos.length), [item.id, photos.length]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-400 border border-brand-green/5 hover:border-brand-gold/30 hover:-translate-y-1"
    >
      {item.image ? (
        <div className={cn("relative overflow-hidden bg-brand-green/5", item.isCustom ? "h-64" : "h-48")}>
          <CardPhotoCarousel
            item={item}
            photos={photos}
            hovered={hovered}
            onOpen={(i) => {
              setPhotoStart(i);
              setPhotosOpen(true);
            }}
          />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-brand-green/5 to-brand-gold/10 flex items-center justify-center">
          <span className="text-5xl opacity-30">🍕</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {item.isNew && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-gold text-brand-green text-[10px] font-black uppercase tracking-wider">
              <Sparkles size={9} className="animate-pulse" />
              Nouveau
            </span>
          )}
          {item.isDevPick && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDevNoteOpen((v) => !v); }}
              aria-expanded={devNoteOpen}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-transform"
            >
              <Code2 size={9} />
              Choix du Dev
            </button>
          )}
          {item.isBestseller && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider">
              <Heart size={9} className="fill-red-600" />
              Coup de cœur
            </span>
          )}
          {item.isSignature && (
            <span className="px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold-deep text-[10px] font-bold uppercase tracking-wider">
              Signature
            </span>
          )}
          {item.isVegetarian && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider">
              <Leaf size={9} />
              Végé
            </span>
          )}
          {item.tags?.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-brand-cream text-brand-charcoal/75 text-[10px] font-medium uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>

        <AnimatePresence>
          {item.isDevPick && devNoteOpen && (
            <motion.p
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 10 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25 }}
              className="text-[11px] text-indigo-600/80 italic leading-relaxed overflow-hidden"
            >
              💬 &ldquo;Mon petit coup de cœur perso sur toute la carte.&rdquo; — le développeur du site
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-bold text-brand-green text-base leading-snug mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {item.name}
            </h3>
            <p className="text-brand-charcoal/70 text-xs leading-relaxed line-clamp-2">{item.description}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className="font-serif font-black text-brand-gold-deep text-lg block" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {item.pricePer100g ? `${item.pricePer100g.toFixed(1)} DT` : formatPrice(item.price)}
            </span>
            {item.pricePer100g && <span className="text-brand-charcoal/65 text-[10px]">/100g</span>}
          </div>
        </div>

        {(item.priceQuart !== undefined || item.isCustom) && (
          <div className="mt-3 pt-3 border-t border-brand-green/5 flex items-center justify-between gap-2">
            {item.priceQuart !== undefined ? (
              <div className="flex gap-3 text-[10px] text-brand-charcoal/65">
                <span>¼ <strong className="text-brand-charcoal/80">{item.priceQuart} DT</strong></span>
                <span>½ <strong className="text-brand-charcoal/80">{item.priceDemi} DT</strong></span>
                {item.pricePlateau !== undefined && (
                  <span>Plateau <strong className="text-brand-charcoal/80">{item.pricePlateau} DT</strong></span>
                )}
              </div>
            ) : (
              <span className="text-[10px] text-brand-charcoal/65 italic">Prix selon composition</span>
            )}
            <button
              onClick={onOrder}
              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-brand-gold text-brand-green text-[10px] font-black uppercase tracking-wide hover:bg-brand-gold-light active:scale-95 transition-all"
            >
              Commander
            </button>
          </div>
        )}
      </div>

      <PhotoLightbox title={item.name} photos={photos} open={photosOpen} startIndex={photoStart} onClose={closePhotos} onViewed={onPhotosViewed} />
    </motion.article>
  );
}

// ── Non-pizza item card (supplements, drinks, desserts) ──────────
function SimpleCard({ item, index }: { item: MenuItem; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="bg-white rounded-2xl p-5 border border-brand-green/8 shadow-sm hover:shadow-md hover:border-brand-gold/25 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {item.isSignature && (
              <span className="px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold-deep text-[10px] font-bold uppercase tracking-wider">
                Signature
              </span>
            )}
          </div>
          <h3 className="font-serif font-bold text-brand-green text-base mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
            {item.name}
          </h3>
          <p className="text-brand-charcoal/70 text-sm leading-relaxed">{item.description}</p>
        </div>
        <span className="font-serif font-black text-brand-gold-deep text-xl flex-shrink-0" style={{ fontFamily: "var(--font-playfair), serif" }}>
          {formatPrice(item.price)}
        </span>
      </div>
    </motion.article>
  );
}

// ── Coming soon card (pizzas) ────────────────────────────────────
function ComingSoonCard({ item, index }: { item: MenuItem; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative bg-white/50 rounded-2xl overflow-hidden border border-dashed border-brand-green/15"
    >
      <div className="h-48 bg-gradient-to-br from-brand-green/4 to-brand-gold/5 flex flex-col items-center justify-center gap-3">
        <span className="text-4xl opacity-15">🍕</span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-green/8 text-brand-green/60 text-[10px] font-bold uppercase tracking-wider">
          <Clock size={10} />
          Bientôt disponible
        </span>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {item.isVegetarian && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600/50 text-[10px] font-bold uppercase tracking-wider">
              <Leaf size={9} />
              Végé
            </span>
          )}
          {item.tags?.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-brand-cream text-brand-charcoal/35 text-[10px] uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif font-bold text-brand-green/45 text-base mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {item.name}
            </h3>
            <p className="text-brand-charcoal/35 text-xs leading-relaxed line-clamp-2">{item.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="font-serif font-black text-brand-charcoal/25 text-lg" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {item.pricePer100g ? `${item.pricePer100g.toFixed(1)} DT` : "—"}
            </span>
            {item.pricePer100g && <span className="block text-brand-charcoal/20 text-[10px]">/100g</span>}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ── Coming soon placeholder for empty categories ──────────────────
function ComingSoonCategory({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-20 flex flex-col items-center gap-4"
    >
      <div className="w-16 h-16 rounded-full bg-brand-green/8 flex items-center justify-center">
        <Clock size={24} className="text-brand-green/30" />
      </div>
      <p className="font-serif text-xl text-brand-green/40 italic" style={{ fontFamily: "var(--font-playfair), serif" }}>
        {label} — bientôt disponible
      </p>
      <p className="text-brand-charcoal/65 text-sm text-center max-w-xs">
        Nous travaillons sur cette section. Revenez bientôt.
      </p>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function MenuShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("pizza");
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const { openOrder, items, showComingSoon } = useOrder();

  const availableItems = items.filter(
    (item) => item.category === activeCategory && !item.isComingSoon
  );
  const comingSoonItems = items.filter(
    (item) => item.category === activeCategory && item.isComingSoon
  );
  const activeCategoryInfo = menuCategories.find((c) => c.id === activeCategory)!;
  const isPizzaTab = activeCategory === "pizza";
  const isPartagerTab = activeCategory === "partager";

  return (
    <section id="menu" ref={ref} className="bg-brand-cream-dark py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-brand-gold-deep text-xs font-bold uppercase tracking-[0.25em] mb-4">
            Carte
          </span>
          <h2
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-green"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Notre Menu
          </h2>
          <p className="text-brand-charcoal/70 mt-4 max-w-xl mx-auto leading-relaxed">
            Chaque pièce est préparée avec des ingrédients sélectionnés et cuite
            à la perfection — fraîche, chaque jour.
          </p>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10"
        >
          {menuCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); track.menuTabClick(cat.id); }}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300",
                activeCategory === cat.id
                  ? "bg-brand-green text-brand-white shadow-lg shadow-brand-green/20 scale-105"
                  : "bg-white text-brand-charcoal/70 hover:bg-brand-green/8 hover:text-brand-green border border-brand-green/10"
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Category description */}
        <AnimatePresence mode="wait">
          <motion.p
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="text-center text-brand-charcoal/70 text-sm mb-10 italic"
          >
            {activeCategoryInfo.description}
          </motion.p>
        </AnimatePresence>

        {/* Pizza pricing table */}
        <AnimatePresence mode="wait">
          {isPizzaTab && <PizzaPricingTable key="pricing" />}
        </AnimatePresence>

        {/* À Partager — all coming soon */}
        <AnimatePresence mode="wait">
          {isPartagerTab && availableItems.length === 0 && (!showComingSoon || comingSoonItems.length === 0) && (
            <ComingSoonCategory key="partager-empty" label="À Partager" />
          )}
          {showComingSoon && isPartagerTab && comingSoonItems.length > 0 && (
            <motion.div key="partager-items" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {comingSoonItems.map((item, i) => (
                <ComingSoonCard key={item.id} item={item} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Available items */}
        <AnimatePresence mode="wait">
          {!isPartagerTab && (
            <motion.div
              key={activeCategory + "-available"}
              className={cn(
                isPizzaTab
                  ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto"
              )}
            >
              {availableItems.map((item, i) =>
                isPizzaTab
                  ? <MenuCard key={item.id} item={item} index={i} onOrder={() => { openOrder(); track.orderStart("menu_card"); }} />
                  : <SimpleCard key={item.id} item={item} index={i} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coming soon pizzas — accordion */}
        {showComingSoon && isPizzaTab && comingSoonItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-16"
          >
            {/* Toggle button */}
            <button
              onClick={() => { const next = !comingSoonOpen; setComingSoonOpen(next); track.comingSoonToggle(next); }}
              className="w-full flex items-center gap-4 group"
            >
              <div className="flex-1 h-px bg-brand-green/10 group-hover:bg-brand-green/20 transition-colors" />
              <div className="flex items-center gap-2.5 px-5 py-2 rounded-full border border-brand-green/15 bg-white group-hover:border-brand-gold/40 group-hover:bg-brand-cream transition-all duration-300">
                <Clock size={12} className="text-brand-green/45" />
                <span className="text-brand-green/60 text-[10px] font-bold uppercase tracking-widest">
                  Bientôt disponible — {comingSoonItems.length} pizzas
                </span>
                <motion.span
                  animate={{ rotate: comingSoonOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-brand-green/40 group-hover:text-brand-gold transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </motion.span>
              </div>
              <div className="flex-1 h-px bg-brand-green/10 group-hover:bg-brand-green/20 transition-colors" />
            </button>

            {/* Collapsible content */}
            <AnimatePresence>
              {comingSoonOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
                    {comingSoonItems.map((item, i) => (
                      <ComingSoonCard key={item.id} item={item} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center text-brand-charcoal/65 text-xs mt-14 tracking-wide"
        >
          * Carte susceptible de changer selon la disponibilité des ingrédients
        </motion.p>
      </div>
    </section>
  );
}
