"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Leaf, Clock } from "lucide-react";
import {
  menuItems,
  menuCategories,
  type MenuCategory,
  type MenuItem,
} from "@/data/menu";
import { cn, formatPrice } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { useOrder } from "@/context/OrderContext";

// ── Pricing reference table (actual menu tiers) ──────────────────
function PizzaPricingTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12 max-w-3xl mx-auto"
    >
      <p className="text-center text-brand-charcoal/40 text-[10px] uppercase tracking-widest mb-5">
        Tarifs — choisissez votre portion
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Classique tier */}
        <div className="rounded-2xl border border-brand-green/10 bg-white p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-green mb-1">Classique</p>
          <p className="font-serif text-2xl font-black text-brand-charcoal mb-0.5" style={{ fontFamily: "var(--font-playfair), serif" }}>
            3.0 <span className="text-base font-normal text-brand-charcoal/40">DT / 100g</span>
          </p>
          <p className="text-[10px] text-brand-charcoal/40 mb-4">Thon · Pepperoni · Jambon</p>
          <div className="space-y-1.5 border-t border-brand-green/8 pt-3">
            {[["¼ Plateau", "17 DT"], ["½ Plateau", "33 DT"], ["Plateau", "66 DT"]].map(([l, v]) => (
              <div key={l} className="flex justify-between items-center">
                <span className="text-xs text-brand-charcoal/50">{l}</span>
                <span className="font-serif font-black text-sm text-brand-gold" style={{ fontFamily: "var(--font-playfair), serif" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Premium tier */}
        <div className="rounded-2xl bg-brand-green border border-brand-gold/20 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1">Premium</p>
          <p className="font-serif text-2xl font-black text-brand-white mb-0.5" style={{ fontFamily: "var(--font-playfair), serif" }}>
            3.6 <span className="text-base font-normal text-brand-white/40">DT / 100g</span>
          </p>
          <p className="text-[10px] text-brand-white/40 mb-4">Bresaola · Truffe · Poulet · 4 Fromages</p>
          <div className="space-y-1.5 border-t border-brand-white/10 pt-3">
            {[["¼ Plateau", "19 DT"], ["½ Plateau", "38 DT"], ["Plateau", "75 DT"]].map(([l, v]) => (
              <div key={l} className="flex justify-between items-center">
                <span className="text-xs text-brand-white/50">{l}</span>
                <span className="font-serif font-black text-sm text-brand-gold" style={{ fontFamily: "var(--font-playfair), serif" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Saumon — standalone */}
        <div className="rounded-2xl border border-brand-gold/25 bg-brand-cream p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal/60 mb-1">Saumon</p>
          <p className="font-serif text-2xl font-black text-brand-charcoal mb-0.5" style={{ fontFamily: "var(--font-playfair), serif" }}>
            4.4 <span className="text-base font-normal text-brand-charcoal/40">DT / 100g</span>
          </p>
          <p className="text-[10px] text-brand-charcoal/40 mb-4">Saumon frais · Crème citronnée</p>
          <div className="space-y-1.5 border-t border-brand-charcoal/8 pt-3">
            {[["¼ Plateau", "24 DT"], ["½ Plateau", "48 DT"], ["Plateau", "91 DT"]].map(([l, v]) => (
              <div key={l} className="flex justify-between items-center">
                <span className="text-xs text-brand-charcoal/50">{l}</span>
                <span className="font-serif font-black text-sm text-brand-green" style={{ fontFamily: "var(--font-playfair), serif" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Available pizza card ─────────────────────────────────────────
function MenuCard({ item, index, onOrder }: { item: MenuItem; index: number; onOrder: () => void }) {
  const [hovered, setHovered] = useState(false);

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
          <Image
            src={item.image}
            alt={item.name}
            fill
            className={cn(
              "object-cover transition-transform duration-700",
              hovered ? "scale-110" : "scale-100"
            )}
            style={{ objectPosition: item.imagePosition ?? "center" }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-green/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-brand-green/5 to-brand-gold/10 flex items-center justify-center">
          <span className="text-5xl opacity-30">🍕</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {item.isSignature && (
            <span className="px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold text-[10px] font-bold uppercase tracking-wider">
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
            <span key={tag} className="px-2 py-0.5 rounded-full bg-brand-cream text-brand-charcoal/60 text-[10px] font-medium uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-bold text-brand-green text-base leading-snug mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {item.name}
            </h3>
            <p className="text-brand-charcoal/60 text-xs leading-relaxed line-clamp-2">{item.description}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className="font-serif font-black text-brand-gold text-lg block" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {item.pricePer100g ? `${item.pricePer100g.toFixed(1)} DT` : formatPrice(item.price)}
            </span>
            {item.pricePer100g && <span className="text-brand-charcoal/35 text-[10px]">/100g</span>}
          </div>
        </div>

        {(item.priceQuart !== undefined || item.isCustom) && (
          <div className="mt-3 pt-3 border-t border-brand-green/5 flex items-center justify-between gap-2">
            {item.priceQuart !== undefined ? (
              <div className="flex gap-3 text-[10px] text-brand-charcoal/40">
                <span>¼ <strong className="text-brand-charcoal/55">{item.priceQuart} DT</strong></span>
                <span>½ <strong className="text-brand-charcoal/55">{item.priceDemi} DT</strong></span>
                <span>Plateau <strong className="text-brand-charcoal/55">{item.pricePlateau} DT</strong></span>
              </div>
            ) : (
              <span className="text-[10px] text-brand-charcoal/40 italic">Prix selon composition</span>
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
              <span className="px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold text-[10px] font-bold uppercase tracking-wider">
                Signature
              </span>
            )}
          </div>
          <h3 className="font-serif font-bold text-brand-green text-base mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
            {item.name}
          </h3>
          <p className="text-brand-charcoal/55 text-sm leading-relaxed">{item.description}</p>
        </div>
        <span className="font-serif font-black text-brand-gold text-xl flex-shrink-0" style={{ fontFamily: "var(--font-playfair), serif" }}>
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
      <p className="text-brand-charcoal/40 text-sm text-center max-w-xs">
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
  const { openOrder } = useOrder();

  const availableItems = menuItems.filter(
    (item) => item.category === activeCategory && !item.isComingSoon
  );
  const comingSoonItems = menuItems.filter(
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
          <span className="inline-block text-brand-gold text-xs font-bold uppercase tracking-[0.25em] mb-4">
            Carte
          </span>
          <h2
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-green"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Notre Menu
          </h2>
          <p className="text-brand-charcoal/60 mt-4 max-w-xl mx-auto leading-relaxed">
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
            className="text-center text-brand-charcoal/45 text-sm mb-10 italic"
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
          {isPartagerTab && availableItems.length === 0 && comingSoonItems.length === 0 && (
            <ComingSoonCategory key="partager-empty" label="À Partager" />
          )}
          {false && isPartagerTab && comingSoonItems.length > 0 && (
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
        {false && isPizzaTab && comingSoonItems.length > 0 && (
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
          className="text-center text-brand-charcoal/35 text-xs mt-14 tracking-wide"
        >
          * Carte susceptible de changer selon la disponibilité des ingrédients
        </motion.p>
      </div>
    </section>
  );
}
