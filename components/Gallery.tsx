"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { useOrder } from "@/context/OrderContext";
import { galleryFilters, galleryImages, type GalleryType } from "@/data/gallery";

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export default function Gallery() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [activeFilter, setActiveFilter] = useState<GalleryType>("tout");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const { contact } = useOrder();

  const filtered = activeFilter === "tout"
    ? galleryImages
    : galleryImages.filter((img) => img.type === activeFilter || img.type === "tout");

  const openLightbox = useCallback((index: number, type: string) => {
    setLightbox(index);
    track.ctaClick("gallery_lightbox_" + type);
    track.galleryOpen(type);
  }, []);
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
              onClick={() => { setActiveFilter(f.id); setLightbox(null); track.ctaClick("gallery_filter_" + f.id); }}
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
                onClick={() => openLightbox(i, img.type)}
                className={`relative overflow-hidden rounded-xl group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-brand-gold ${img.span}`}
                aria-label={`Voir ${img.alt}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  quality={70}
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
            href={contact.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track.socialClick("instagram_gallery")}
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
              className="relative max-w-4xl w-full max-h-[85vh] aspect-[4/3] touch-pan-y"
              onClick={(e) => e.stopPropagation()}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60 || info.velocity.x < -400) nextImage();
                else if (info.offset.x > 60 || info.velocity.x > 400) prevImage();
              }}
            >
              <Image src={filtered[lightbox].src} alt={filtered[lightbox].alt} fill className="object-contain pointer-events-none" sizes="100vw" quality={85} priority />
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
