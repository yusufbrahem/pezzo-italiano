"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Phone, UtensilsCrossed } from "lucide-react";

const heroImages = [
  "/images/mixed-pizza/DSC01982.jpg",
  "/images/poulet-pesto-champ/DSC01904.jpg",
  "/images/thon/DSC01930.jpg",
  "/images/bresaola-boeuf/DSC01945.jpg",
];

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const [currentImage, setCurrentImage] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToMenu = () => {
    document.querySelector("#menu")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToNext = () => {
    document.querySelector("#histoire")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      ref={ref}
      className="relative h-screen min-h-[600px] overflow-hidden"
    >
      {/* Background slideshow */}
      {heroImages.map((src, i) => (
        <motion.div
          key={src}
          className="absolute inset-0"
          style={{ y }}
          animate={{
            opacity: i === currentImage ? 1 : 0,
            scale: i === currentImage ? 1.05 : 1,
          }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <Image
            src={src}
            alt={`Pezzo Italiano pizza ${i + 1}`}
            fill
            className="object-cover"
            priority={i === 0}
            quality={90}
            sizes="100vw"
          />
        </motion.div>
      ))}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-green via-brand-green/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-green/80 via-transparent to-transparent" />

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 flex flex-col justify-end h-full pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex items-center gap-2 mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
            Pizza al Taglio Authentique
          </span>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-brand-white leading-[0.9] mb-6"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          L&apos;Italie
          <br />
          <span className="text-brand-gold">à chaque</span>
          <br />
          tranche.
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-brand-white/70 text-base sm:text-lg max-w-md mb-8 leading-relaxed"
        >
          Fraîche · Croustillante · Cuite chaque jour —{" "}
          <span className="text-brand-gold font-medium">Sousse, Tunisie</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={scrollToMenu}
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-brand-gold text-brand-green font-bold text-sm tracking-wide hover:bg-brand-gold-light transition-all duration-300 hover:shadow-xl hover:shadow-brand-gold/30 hover:-translate-y-0.5"
          >
            <UtensilsCrossed size={16} className="group-hover:rotate-12 transition-transform" />
            Voir le Menu
          </button>
          <a
            href="tel:+21653086089"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-brand-white/40 text-brand-white font-semibold text-sm tracking-wide hover:border-brand-gold hover:text-brand-gold transition-all duration-300 backdrop-blur-sm"
          >
            <Phone size={16} />
            Commander — 53 086 089
          </a>
        </motion.div>

        {/* Slide indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex gap-2 mt-10"
        >
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`h-0.5 rounded-full transition-all duration-500 ${
                i === currentImage
                  ? "w-8 bg-brand-gold"
                  : "w-2 bg-brand-white/30"
              }`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.button
        onClick={scrollToNext}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 1.5 },
          y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
        }}
        className="absolute bottom-8 right-8 z-10 flex flex-col items-center gap-2 text-brand-white/50 hover:text-brand-gold transition-colors group"
        aria-label="Défiler vers le bas"
      >
        <span className="text-xs uppercase tracking-widest rotate-90 origin-center">
          Défiler
        </span>
        <ChevronDown size={20} />
      </motion.button>

      {/* Corner badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute top-24 right-6 sm:right-10 z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-brand-gold flex flex-col items-center justify-center text-brand-green shadow-2xl"
      >
        <span className="text-xs font-bold uppercase tracking-tight leading-none">
          Fresh
        </span>
        <span className="text-lg font-serif font-black" style={{ fontFamily: "var(--font-playfair), serif" }}>
          Daily
        </span>
        <span className="text-xs font-bold uppercase tracking-tight leading-none">
          Baked
        </span>
      </motion.div>
    </section>
  );
}
