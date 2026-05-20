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

const pricingTiers = [
  {
    label: "Classique",
    per100g: "3.0 DT",
    quart: "17 DT",
    demi: "33 DT",
    plateau: "66 DT",
    pizzas: ["Thon", "Pepperoni", "Jambon Fumé"],
    color: "bg-white border-brand-green/10",
    labelColor: "text-brand-green",
    valueColor: "text-brand-gold",
    subtextColor: "text-brand-charcoal/50",
  },
  {
    label: "Premium",
    per100g: "3.4 DT",
    quart: "19 DT",
    demi: "38 DT",
    plateau: "72 DT",
    pizzas: ["Bresola", "Truffe", "Poulet Épicé", "Poulet Pesto", "4 Formaggi"],
    color: "bg-brand-green border-brand-gold/30",
    labelColor: "text-brand-gold",
    valueColor: "text-brand-gold",
    subtextColor: "text-brand-white/50",
    dark: true,
  },
  {
    label: "Prestige",
    per100g: "4.4 DT",
    quart: "24 DT",
    demi: "48 DT",
    plateau: "91 DT",
    pizzas: ["Saumon"],
    color: "bg-brand-cream border-brand-gold/20",
    labelColor: "text-brand-charcoal",
    valueColor: "text-brand-green",
    subtextColor: "text-brand-charcoal/50",
  },
];

function PricingTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12 max-w-4xl mx-auto"
    >
      <p className="text-center text-brand-charcoal/50 text-xs uppercase tracking-widest mb-5">
        Tarifs au poids — choisissez votre portion
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {pricingTiers.map((tier) => (
          <div
            key={tier.label}
            className={cn("rounded-2xl p-5 border", tier.color)}
          >
            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", tier.labelColor)}>
              {tier.label}
            </p>
            <p className={cn("font-serif text-2xl font-black mb-4", tier.dark ? "text-brand-white" : "text-brand-charcoal")} style={{ fontFamily: "var(--font-playfair), serif" }}>
              {tier.per100g}
              <span className={cn("text-xs font-normal ml-1", tier.subtextColor)}>/100g</span>
            </p>
            <div className="space-y-2 border-t border-current/10 pt-4">
              {[
                { label: "¼ Plateau", value: tier.quart },
                { label: "½ Plateau", value: tier.demi },
                { label: "Plateau", value: tier.plateau },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className={cn("text-xs", tier.subtextColor)}>{row.label}</span>
                  <span className={cn("font-serif font-black text-sm", tier.valueColor)} style={{ fontFamily: "var(--font-playfair), serif" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function MenuCard({ item, index }: { item: MenuItem; index: number }) {
  const [hovered, setHovered] = useState(false);
  const isPremium = item.pricePer100g && item.pricePer100g >= 4.0;

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
      {/* Image */}
      {item.image ? (
        <div className="relative h-48 overflow-hidden bg-brand-green/5">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className={cn(
              "object-cover transition-transform duration-700",
              hovered ? "scale-110" : "scale-100"
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-green/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {isPremium && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-brand-gold text-brand-green text-[10px] font-black uppercase tracking-wider">
              Prestige
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-brand-green/5 to-brand-gold/10 flex items-center justify-center">
          <span className="text-5xl opacity-40">🍕</span>
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {item.isSignature && (
            <span className="inline-block px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold text-[10px] font-bold uppercase tracking-wider">
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
            <span
              key={tag}
              className="inline-block px-2 py-0.5 rounded-full bg-brand-cream text-brand-charcoal/60 text-[10px] font-medium uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className="font-serif font-bold text-brand-green text-base leading-snug mb-1"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              {item.name}
            </h3>
            <p className="text-brand-charcoal/60 text-xs leading-relaxed line-clamp-2">
              {item.description}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span
              className="font-serif font-black text-brand-gold text-lg block"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              {item.pricePer100g ? `${item.pricePer100g.toFixed(1)} DT` : formatPrice(item.price)}
            </span>
            {item.pricePer100g && (
              <span className="text-brand-charcoal/40 text-[10px]">/100g</span>
            )}
          </div>
        </div>

        {/* Portion mini-prices */}
        {item.priceQuart && (
          <div className="mt-3 pt-3 border-t border-brand-green/5 flex justify-between text-[10px] text-brand-charcoal/40">
            <span>¼ <strong className="text-brand-charcoal/60">{item.priceQuart} DT</strong></span>
            <span>½ <strong className="text-brand-charcoal/60">{item.priceDemi} DT</strong></span>
            <span>Plateau <strong className="text-brand-charcoal/60">{item.pricePlateau} DT</strong></span>
          </div>
        )}
      </div>
    </motion.article>
  );
}

function ComingSoonCard({ item, index }: { item: MenuItem; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative bg-white/50 rounded-2xl overflow-hidden border border-brand-green/10 border-dashed"
    >
      <div className="h-48 bg-gradient-to-br from-brand-green/5 to-brand-gold/5 flex flex-col items-center justify-center gap-3">
        <span className="text-4xl opacity-20">🍕</span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold uppercase tracking-wider">
          <Clock size={10} />
          Bientôt disponible
        </span>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {item.isVegetarian && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600/60 text-[10px] font-bold uppercase tracking-wider">
              <Leaf size={9} />
              Végé
            </span>
          )}
          {item.tags?.map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-0.5 rounded-full bg-brand-cream text-brand-charcoal/40 text-[10px] font-medium uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className="font-serif font-bold text-brand-green/50 text-base leading-snug mb-1"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              {item.name}
            </h3>
            <p className="text-brand-charcoal/40 text-xs leading-relaxed line-clamp-2">
              {item.description}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span
              className="font-serif font-black text-brand-charcoal/30 text-lg block"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              {item.pricePer100g ? `${item.pricePer100g.toFixed(1)} DT` : "—"}
            </span>
            {item.pricePer100g && (
              <span className="text-brand-charcoal/25 text-[10px]">/100g</span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function MenuShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("pizza");

  const availableItems = menuItems.filter(
    (item) => item.category === activeCategory && !item.isComingSoon
  );
  const comingSoonItems = menuItems.filter(
    (item) => item.category === activeCategory && item.isComingSoon
  );
  const activeCategoryInfo = menuCategories.find((c) => c.id === activeCategory)!;

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
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-12"
        >
          {menuCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300",
                activeCategory === cat.id
                  ? "bg-brand-green text-brand-white shadow-lg shadow-brand-green/20 scale-105"
                  : "bg-white text-brand-charcoal/70 hover:bg-brand-green/10 hover:text-brand-green border border-brand-green/10"
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
            transition={{ duration: 0.3 }}
            className="text-center text-brand-charcoal/50 text-sm mb-10 italic"
          >
            {activeCategoryInfo.description}
          </motion.p>
        </AnimatePresence>

        {/* Pricing table — pizza tab only */}
        <AnimatePresence mode="wait">
          {activeCategory === "pizza" && <PricingTable key="pricing" />}
        </AnimatePresence>

        {/* Available items grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + "-available"}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {availableItems.map((item, i) => (
              <MenuCard key={item.id} item={item} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Coming soon section — pizza tab only */}
        {activeCategory === "pizza" && comingSoonItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-16"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-brand-green/10" />
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-brand-green/20 bg-white">
                <Clock size={13} className="text-brand-green/50" />
                <span className="text-brand-green/60 text-xs font-bold uppercase tracking-widest">
                  Bientôt disponible
                </span>
              </div>
              <div className="flex-1 h-px bg-brand-green/10" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {comingSoonItems.map((item, i) => (
                <ComingSoonCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center text-brand-charcoal/40 text-xs mt-12 tracking-wide"
        >
          * Carte susceptible de changer selon la disponibilité des ingrédients
        </motion.p>
      </div>
    </section>
  );
}
