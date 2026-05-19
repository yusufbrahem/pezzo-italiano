"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

const galleryImages = [
  { src: "/images/DSC01860.jpg", alt: "Façade Pezzo Italiano de nuit", span: "col-span-1 row-span-2" },
  { src: "/images/DSC01920.jpg", alt: "Pizza Saumon Pistache signature", span: "col-span-1 row-span-1" },
  { src: "/images/DSC01930.jpg", alt: "Pizza Prosciutto Funghi", span: "col-span-1 row-span-1" },
  { src: "/images/DSC01939.jpg", alt: "Pizza Diavola épicée", span: "col-span-1 row-span-1" },
  { src: "/images/DSC01945.jpg", alt: "Pizza Poulet Pesto", span: "col-span-1 row-span-2" },
  { src: "/images/DSC01951.jpg", alt: "Détail pizza fraîche", span: "col-span-1 row-span-1" },
  { src: "/images/DSC01956.jpg", alt: "Pizza artisanale sur planche", span: "col-span-1 row-span-1" },
  { src: "/images/DSC01966.jpg", alt: "Panuozzo Prosciutto", span: "col-span-1 row-span-1" },
  { src: "/images/DSC01971.jpg", alt: "Panuozzo Poulet", span: "col-span-1 row-span-1" },
  { src: "/images/DSC01977.jpg", alt: "Vue sur le comptoir", span: "col-span-1 row-span-2" },
  { src: "/images/DSC01982.jpg", alt: "Assortiment de pizzas al taglio", span: "col-span-2 row-span-1" },
  { src: "/images/DSC01985.jpg", alt: "Pizza Quattro Formaggi", span: "col-span-1 row-span-1" },
  { src: "/images/DSC01991.jpg", alt: "Ambiance restaurant", span: "col-span-1 row-span-1" },
  { src: "/images/DSC01994.jpg", alt: "Pizza cuite au four", span: "col-span-1 row-span-1" },
  { src: "/images/DSC02000.jpg", alt: "Pizza préparée à la main", span: "col-span-1 row-span-1" },
  { src: "/images/DSC02003.jpg", alt: "Garnitures fraîches", span: "col-span-1 row-span-1" },
  { src: "/images/DSC02006.jpg", alt: "Pizza signature final", span: "col-span-1 row-span-1" },
];

export default function Gallery() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [lightbox, setLightbox] = useState<number | null>(null);

  const openLightbox = useCallback((index: number) => setLightbox(index), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevImage = useCallback(() => {
    setLightbox((prev) =>
      prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : null
    );
  }, []);
  const nextImage = useCallback(() => {
    setLightbox((prev) =>
      prev !== null ? (prev + 1) % galleryImages.length : null
    );
  }, []);

  return (
    <section id="galerie" ref={ref} className="bg-brand-cream py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
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
            Des couleurs vives, des textures généreuses — la pizza al taglio comme vous ne l&apos;avez jamais vue.
          </p>
        </motion.div>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[180px] gap-3">
          {galleryImages.map((img, i) => (
            <motion.button
              key={img.src}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.04 }}
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
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-brand-green/0 group-hover:bg-brand-green/40 transition-all duration-300 flex items-center justify-center">
                <span className="text-brand-white text-xs font-semibold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4 text-center">
                  {img.alt}
                </span>
              </div>
              {/* Gold corner accent */}
              <div className="absolute top-0 left-0 w-0 h-0 border-t-[40px] border-l-[40px] border-t-brand-gold border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          ))}
        </div>

        {/* Instagram CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-14 text-center"
        >
          <p className="text-brand-charcoal/60 text-sm mb-4">
            Découvrez encore plus sur notre Instagram
          </p>
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
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors"
              aria-label="Fermer"
            >
              <X size={24} />
            </button>

            {/* Prev */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 z-10 p-3 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors"
              aria-label="Précédent"
            >
              <ChevronLeft size={28} />
            </button>

            {/* Image */}
            <motion.div
              key={lightbox}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-4xl w-full max-h-[85vh] aspect-[4/3]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={galleryImages[lightbox].src}
                alt={galleryImages[lightbox].alt}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </motion.div>

            {/* Next */}
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 z-10 p-3 rounded-full bg-brand-white/10 text-brand-white hover:bg-brand-white/20 transition-colors"
              aria-label="Suivant"
            >
              <ChevronRight size={28} />
            </button>

            {/* Caption */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <p className="text-brand-white/60 text-sm">{galleryImages[lightbox].alt}</p>
              <p className="text-brand-white/30 text-xs mt-1">
                {lightbox + 1} / {galleryImages.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
