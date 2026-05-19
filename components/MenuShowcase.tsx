"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Leaf } from "lucide-react";
import {
  menuItems,
  menuCategories,
  menuPricing,
  type MenuCategory,
  type MenuItem,
} from "@/data/menu";
import { cn, formatPrice } from "@/lib/utils";

function MenuCard({ item, index }: { item: MenuItem; index: number }) {
  const [hovered, setHovered] = useState(false);
  const isTruffe = item.price === "Menu Truffe";

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
          {isTruffe && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-brand-gold text-brand-green text-[10px] font-black uppercase tracking-wider">
              Menu Truffe
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
        {/* Tags */}
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
          {item.tags?.filter((t) => t !== "Signature").map((tag) => (
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
            <h3 className="font-serif font-bold text-brand-green text-base leading-snug mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {item.name}
            </h3>
            <p className="text-brand-charcoal/60 text-xs leading-relaxed line-clamp-2">
              {item.description}
            </p>
          </div>
          <span className={cn(
            "flex-shrink-0 font-serif font-black text-base whitespace-nowrap",
            isTruffe ? "text-brand-green text-sm" : "text-brand-gold text-lg"
          )} style={{ fontFamily: "var(--font-playfair), serif" }}>
            {formatPrice(item.price)}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

function PricingTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10 grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto"
    >
      {menuPricing.map((tier) => (
        <div
          key={tier.label}
          className={cn(
            "rounded-2xl p-5 border",
            tier.label === "Menu Truffe"
              ? "bg-brand-green border-brand-gold/30 text-brand-white"
              : "bg-white border-brand-green/10 text-brand-charcoal"
          )}
        >
          <p className={cn(
            "text-xs font-bold uppercase tracking-widest mb-4",
            tier.label === "Menu Truffe" ? "text-brand-gold" : "text-brand-green"
          )}>
            {tier.label}
          </p>
          <div className="space-y-2">
            {[
              { label: "Plateau", value: tier.plateau },
              { label: "½ Plateau", value: tier.demiPlateau },
              { label: "¼ Plateau", value: tier.quartPlateau },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className={cn(
                  "text-sm",
                  tier.label === "Menu Truffe" ? "text-brand-white/70" : "text-brand-charcoal/60"
                )}>
                  {row.label}
                </span>
                <span className={cn(
                  "font-serif font-black text-lg",
                  tier.label === "Menu Truffe" ? "text-brand-gold" : "text-brand-green"
                )} style={{ fontFamily: "var(--font-playfair), serif" }}>
                  {row.value} DT
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

export default function MenuShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("pizza");

  const filtered = menuItems.filter((item) => item.category === activeCategory);
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

        {/* Menu grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((item, i) => (
              <MenuCard key={item.id} item={item} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

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
