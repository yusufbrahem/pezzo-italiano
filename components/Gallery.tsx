"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

type GalleryType = "tout" | "thon" | "pepperoni" | "jambon-fume" | "bresola" | "poulet-pesto" | "poulet-epice" | "quattro-formaggi" | "truffe" | "restaurant";

interface GalleryImage {
  src: string;
  alt: string;
  span: string;
  type: GalleryType;
}

const galleryFilters: { id: GalleryType; label: string; icon: string }[] = [
  { id: "tout", label: "Tout", icon: "🍕" },
  { id: "bresola", label: "Bresola", icon: "🥩" },
  { id: "poulet-pesto", label: "Poulet Pesto", icon: "🌿" },
  { id: "truffe", label: "Truffe", icon: "✨" },
  { id: "pepperoni", label: "Pepperoni", icon: "🌶️" },
  { id: "thon", label: "Thon", icon: "🐟" },
  { id: "jambon-fume", label: "Jambon Fumé", icon: "🥓" },
  { id: "quattro-formaggi", label: "Quattro Formaggi", icon: "🧀" },
  { id: "poulet-epice", label: "Poulet Épicé", icon: "🔥" },
  { id: "restaurant", label: "Restaurant", icon: "🏪" },
];

const galleryImages: GalleryImage[] = [
  // Restaurant / Facade
  { src: "/images/facade/DSC01860.jpg", alt: "Façade Pezzo Italiano de nuit", span: "col-span-1 row-span-2", type: "restaurant" },
  { src: "/images/facade/DSC01863.jpg", alt: "Entrée du restaurant", span: "col-span-1 row-span-1", type: "restaurant" },
  { src: "/images/facade/DSC01865.jpg", alt: "Vue de la salle", span: "col-span-1 row-span-1", type: "restaurant" },

  // Bresola
  { src: "/images/bresaola-boeuf/DSC01942.jpg", alt: "Pizza Bresola", span: "col-span-1 row-span-1", type: "bresola" },
  { src: "/images/bresaola-boeuf/DSC01945.jpg", alt: "Pizza Bresola détail", span: "col-span-1 row-span-2", type: "bresola" },
  { src: "/images/bresaola-boeuf/DSC01947.jpg", alt: "Pizza Bresola garnie", span: "col-span-1 row-span-1", type: "bresola" },
  { src: "/images/bresaola-boeuf/DSC01948.jpg", alt: "Pizza Bresola vue rapprochée", span: "col-span-1 row-span-1", type: "bresola" },
  { src: "/images/bresaola-boeuf/DSC01951.jpg", alt: "Pizza Bresola présentation", span: "col-span-1 row-span-1", type: "bresola" },

  // Poulet Pesto Champignons
  { src: "/images/poulet-pesto-champ/DSC01901.jpg", alt: "Pizza Poulet Pesto Champignons", span: "col-span-1 row-span-1", type: "poulet-pesto" },
  { src: "/images/poulet-pesto-champ/DSC01904.jpg", alt: "Pizza Poulet Pesto détail", span: "col-span-2 row-span-1", type: "poulet-pesto" },
  { src: "/images/poulet-pesto-champ/DSC01905.jpg", alt: "Pizza Poulet Pesto garnie", span: "col-span-1 row-span-1", type: "poulet-pesto" },
  { src: "/images/poulet-pesto-champ/DSC01906.jpg", alt: "Pizza Poulet Pesto vue rapprochée", span: "col-span-1 row-span-2", type: "poulet-pesto" },
  { src: "/images/poulet-pesto-champ/DSC01914.jpg", alt: "Pizza Poulet Pesto présentation", span: "col-span-1 row-span-1", type: "poulet-pesto" },

  // Truffe
  { src: "/images/truffe-champ/DSC01932.jpg", alt: "Pizza Truffe", span: "col-span-1 row-span-1", type: "truffe" },
  { src: "/images/truffe-champ/DSC01934.jpg", alt: "Pizza Truffe détail", span: "col-span-1 row-span-2", type: "truffe" },
  { src: "/images/truffe-champ/DSC01935.jpg", alt: "Pizza Truffe champignons", span: "col-span-1 row-span-1", type: "truffe" },
  { src: "/images/truffe-champ/DSC01939.jpg", alt: "Pizza Truffe présentation", span: "col-span-1 row-span-1", type: "truffe" },

  // Pepperoni
  { src: "/images/pepperoni/DSC01891.jpg", alt: "Pizza Pepperoni", span: "col-span-1 row-span-1", type: "pepperoni" },
  { src: "/images/pepperoni/DSC01893.jpg", alt: "Pizza Pepperoni détail", span: "col-span-1 row-span-1", type: "pepperoni" },
  { src: "/images/pepperoni/DSC01894.jpg", alt: "Pizza Pepperoni garnie", span: "col-span-1 row-span-2", type: "pepperoni" },
  { src: "/images/pepperoni/DSC01895.jpg", alt: "Pizza Pepperoni vue rapprochée", span: "col-span-1 row-span-1", type: "pepperoni" },
  { src: "/images/pepperoni/DSC01900.jpg", alt: "Pizza Pepperoni présentation", span: "col-span-1 row-span-1", type: "pepperoni" },

  // Thon
  { src: "/images/thon/DSC01925.jpg", alt: "Pizza Thon", span: "col-span-1 row-span-1", type: "thon" },
  { src: "/images/thon/DSC01926.jpg", alt: "Pizza Thon détail", span: "col-span-1 row-span-1", type: "thon" },
  { src: "/images/thon/DSC01927.jpg", alt: "Pizza Thon garnie", span: "col-span-1 row-span-1", type: "thon" },
  { src: "/images/thon/DSC01930.jpg", alt: "Pizza Thon présentation", span: "col-span-1 row-span-2", type: "thon" },

  // Jambon Fumé
  { src: "/images/jombon-fume/DSC01954.jpg", alt: "Pizza Jambon Fumé", span: "col-span-1 row-span-1", type: "jambon-fume" },
  { src: "/images/jombon-fume/DSC01956.jpg", alt: "Pizza Jambon Fumé détail", span: "col-span-1 row-span-2", type: "jambon-fume" },
  { src: "/images/jombon-fume/DSC01957.jpg", alt: "Pizza Jambon Fumé garnie", span: "col-span-1 row-span-1", type: "jambon-fume" },
  { src: "/images/jombon-fume/DSC01959.jpg", alt: "Pizza Jambon Fumé champignons", span: "col-span-1 row-span-1", type: "jambon-fume" },
  { src: "/images/jombon-fume/DSC01962.jpg", alt: "Pizza Jambon Fumé présentation", span: "col-span-1 row-span-1", type: "jambon-fume" },

  // Quattro Formaggi
  { src: "/images/quatro-fromage/DSC01867.jpg", alt: "Pizza Quattro Formaggi", span: "col-span-1 row-span-1", type: "quattro-formaggi" },
  { src: "/images/quatro-fromage/DSC01868.jpg", alt: "Pizza Quattro Formaggi fondue", span: "col-span-1 row-span-1", type: "quattro-formaggi" },
  { src: "/images/quatro-fromage/DSC01871.jpg", alt: "Pizza Quattro Formaggi détail", span: "col-span-1 row-span-2", type: "quattro-formaggi" },
  { src: "/images/quatro-fromage/DSC01874.jpg", alt: "Pizza Quattro Formaggi garnie", span: "col-span-1 row-span-1", type: "quattro-formaggi" },
  { src: "/images/quatro-fromage/DSC01875.jpg", alt: "Pizza Quattro Formaggi vue", span: "col-span-1 row-span-1", type: "quattro-formaggi" },
  { src: "/images/quatro-fromage/DSC01882.jpg", alt: "Pizza Quattro Formaggi présentation", span: "col-span-1 row-span-1", type: "quattro-formaggi" },
  { src: "/images/quatro-fromage/DSC01885.jpg", alt: "Pizza Quattro Formaggi fondue 2", span: "col-span-1 row-span-1", type: "quattro-formaggi" },

  // Poulet Épicé
  { src: "/images/poulet-epice/DSC01966.jpg", alt: "Pizza Poulet Épicé", span: "col-span-1 row-span-2", type: "poulet-epice" },
  { src: "/images/poulet-epice/DSC01967.jpg", alt: "Pizza Poulet Épicé détail", span: "col-span-1 row-span-1", type: "poulet-epice" },
  { src: "/images/poulet-epice/DSC01971.jpg", alt: "Pizza Poulet Épicé piment", span: "col-span-1 row-span-1", type: "poulet-epice" },

  // Mixed
  { src: "/images/mixed-pizza/DSC01982.jpg", alt: "Assortiment pizzas al taglio", span: "col-span-2 row-span-1", type: "tout" },
  { src: "/images/mixed-pizza/DSC01984.jpg", alt: "Plateaux pizza al taglio", span: "col-span-1 row-span-1", type: "tout" },
  { src: "/images/mixed-pizza/DSC01985.jpg", alt: "Pizza al taglio variées", span: "col-span-1 row-span-1", type: "tout" },
  { src: "/images/mixed-pizza/DSC01988.jpg", alt: "Sélection du jour", span: "col-span-1 row-span-2", type: "tout" },
  { src: "/images/mixed-pizza/DSC01991.jpg", alt: "Pizzas fraîches du jour", span: "col-span-1 row-span-1", type: "tout" },
  { src: "/images/mixed-pizza/DSC01994.jpg", alt: "Assortiment garnitures", span: "col-span-1 row-span-1", type: "tout" },

  // Salmon (bonus)
  { src: "/images/salmon/DSC01918.jpg", alt: "Pizza Saumon", span: "col-span-1 row-span-1", type: "tout" },
  { src: "/images/salmon/DSC01920.jpg", alt: "Pizza Saumon détail", span: "col-span-1 row-span-2", type: "tout" },
  { src: "/images/salmon/DSC01921.jpg", alt: "Pizza Saumon garnie", span: "col-span-1 row-span-1", type: "tout" },
];

export default function Gallery() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [activeFilter, setActiveFilter] = useState<GalleryType>("tout");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = activeFilter === "tout"
    ? galleryImages
    : galleryImages.filter((img) => img.type === activeFilter || img.type === "tout");

  const openLightbox = useCallback((index: number) => setLightbox(index), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevImage = useCallback(() => setLightbox((p) => p !== null ? (p - 1 + filtered.length) % filtered.length : null), [filtered.length]);
  const nextImage = useCallback(() => setLightbox((p) => p !== null ? (p + 1) % filtered.length : null), [filtered.length]);

  return (
    <section id="galerie" ref={ref} className="bg-brand-cream py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-brand-gold text-xs font-bold uppercase tracking-[0.25em] mb-4">
            Galerie
          </span>
          <h2
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-green"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Beauté à chaque prise
          </h2>
          <p className="text-brand-charcoal/60 mt-4 max-w-xl mx-auto">
            Filtrez par type de pizza pour explorer chaque création.
          </p>
        </motion.div>

        {/* Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {galleryFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => { setActiveFilter(f.id); setLightbox(null); }}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300",
                activeFilter === f.id
                  ? "bg-brand-green text-brand-white shadow-md scale-105"
                  : "bg-white text-brand-charcoal/70 hover:bg-brand-green/10 hover:text-brand-green border border-brand-green/10"
              )}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Masonry grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[180px] gap-3"
          >
            {filtered.map((img, i) => (
              <motion.button
                key={img.src}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                onClick={() => openLightbox(i)}
                className={`relative overflow-hidden rounded-xl group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-brand-gold ${img.span}`}
                aria-label={`Voir ${img.alt}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-brand-green/0 group-hover:bg-brand-green/40 transition-all duration-300 flex items-end p-3">
                  <span className="text-brand-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {img.alt}
                  </span>
                </div>
                <div className="absolute top-0 left-0 w-0 h-0 border-t-[40px] border-l-[40px] border-t-brand-gold border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Instagram CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-14 text-center"
        >
          <p className="text-brand-charcoal/60 text-sm mb-4">Découvrez encore plus sur notre Instagram</p>
          <a
            href="https://www.instagram.com/pezzo.italiano/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-brand-green text-brand-white font-semibold text-sm hover:bg-brand-green-light transition-colors duration-300 group"
          >
            <InstagramIcon size={18} />
            @pezzo.italiano
          </a>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-black/95 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button onClick={closeLightbox} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors" aria-label="Fermer">
              <X size={24} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 z-10 p-3 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors" aria-label="Précédent">
              <ChevronLeft size={28} />
            </button>
            <motion.div
              key={lightbox}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-4xl w-full max-h-[85vh] aspect-[4/3]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={filtered[lightbox].src} alt={filtered[lightbox].alt} fill className="object-contain" sizes="100vw" priority />
            </motion.div>
            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 z-10 p-3 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors" aria-label="Suivant">
              <ChevronRight size={28} />
            </button>
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <p className="text-brand-white/60 text-sm">{filtered[lightbox].alt}</p>
              <p className="text-brand-white/30 text-xs mt-1">{lightbox + 1} / {filtered.length}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
