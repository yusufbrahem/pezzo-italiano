"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Phone, UtensilsCrossed, Star } from "lucide-react";
import { track } from "@/lib/analytics";
import { useOrder } from "@/context/OrderContext";

const heroImages = [
  "/images/mixed-pizza/DSC01982.jpg",
  "/images/poulet-pesto-champ/DSC01904.jpg",
  "/images/thon/DSC01930.jpg",
  "/images/bresaola-boeuf/DSC01945.jpg",
];

interface HeroProps {
  rating?: number;
  totalRatings?: number;
}

export default function Hero({ rating, totalRatings }: HeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const { openOrder } = useOrder();

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
            quality={i === 0 ? 85 : 75}
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
        {/* Entrance animations in this block are pure CSS (globals.css
            .hero-rise / .hero-fade / .hero-pop), not Framer: a JS-driven
            fade-in keeps text invisible until hydration, which on a mid-range
            phone pushed Lighthouse's LCP (the title, then the tagline) to ~9 s. */}
        {/* Badge */}
        <div className="hero-rise flex flex-wrap items-center gap-2 mb-6" style={{ animationDelay: "0.05s" }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
            Pizza al Taglio Authentique
          </span>
          {!!rating && (
            <a
              href="#avis"
              onClick={() => track.reviewsCTAClick()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-white/10 border border-brand-white/25 text-brand-white text-xs font-semibold backdrop-blur-sm hover:border-brand-gold/50 transition-colors"
            >
              <Star size={12} className="fill-brand-gold text-brand-gold" />
              {rating.toFixed(1)}
              {!!totalRatings && (
                <span className="text-brand-white/50 font-normal">
                  · {totalRatings.toLocaleString("fr-FR")} avis
                </span>
              )}
            </a>
          )}
        </div>

        {/* Main title */}
        <h1
          className="hero-rise font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-brand-white leading-[0.9] mb-6"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          L&apos;Italie
          <br />
          <span className="text-brand-gold">à chaque</span>
          <br />
          tranche.
        </h1>

        {/* Tagline */}
        <p className="hero-rise text-brand-white/70 text-base sm:text-lg max-w-md mb-8 leading-relaxed" style={{ animationDelay: "0.25s" }}>
          Fraîche · Croustillante · Cuite chaque jour —{" "}
          <span className="text-brand-gold font-medium">Sousse, Tunisie</span>
        </p>

        {/* CTAs */}
        <div className="hero-rise flex flex-col sm:flex-row gap-4" style={{ animationDelay: "0.4s" }}>
          <button
            onClick={() => {
              openOrder();
              track.orderStart("hero");
            }}
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-brand-gold text-brand-green font-bold text-sm tracking-wide hover:bg-brand-gold-light transition-all duration-300 hover:shadow-xl hover:shadow-brand-gold/30 hover:-translate-y-0.5"
          >
            <UtensilsCrossed size={16} className="group-hover:rotate-12 transition-transform" />
            Commander maintenant
          </button>
          <button
            onClick={() => { scrollToMenu(); track.ctaClick("voir_le_menu_hero"); }}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-brand-white/40 text-brand-white font-semibold text-sm tracking-wide hover:border-brand-gold hover:text-brand-gold transition-all duration-300 backdrop-blur-sm"
          >
            <Phone size={16} />
            Voir le Menu
          </button>
        </div>

        {/* Slide indicators */}
        {/* Thin bars, but each button is a 24px-tall tap target (Lighthouse target-size). */}
        <div className="hero-fade flex -mx-1 mt-7" style={{ animationDelay: "0.8s" }}>
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className="h-6 min-w-6 px-1 flex items-center justify-center"
              aria-label={`Image ${i + 1}`}
              aria-current={i === currentImage}
            >
              <span
                className={`block h-0.5 rounded-full transition-all duration-500 ${
                  i === currentImage ? "w-8 bg-brand-gold" : "w-2 bg-brand-white/30"
                }`}
              />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToNext}
        className="hero-bob absolute bottom-8 right-8 z-10 flex flex-col items-center gap-2 text-brand-white/50 hover:text-brand-gold transition-colors group"
        aria-label="Défiler vers le bas"
      >
        <span className="text-xs uppercase tracking-widest rotate-90 origin-center">
          Défiler
        </span>
        <ChevronDown size={20} />
      </button>

      {/* Corner badge */}
      <div
        className="hero-pop absolute top-24 right-6 sm:right-10 z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-brand-gold flex flex-col items-center justify-center text-brand-green shadow-2xl"
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
      </div>
    </section>
  );
}
