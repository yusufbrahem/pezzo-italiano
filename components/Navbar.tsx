"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Accueil", href: "#hero" },
  { label: "Notre Histoire", href: "#histoire" },
  { label: "Menu", href: "#menu" },
  { label: "Galerie", href: "#galerie" },
  { label: "Contact", href: "#contact" },
];

function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-brand-gold overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/logo/monogram-green.jpeg"
        alt=""
        width={size}
        height={size}
        className="w-full h-full object-cover"
        style={{ mixBlendMode: "multiply" }}
        priority
      />
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-brand-green/95 backdrop-blur-md shadow-lg shadow-brand-green/20"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo */}
            <button
              onClick={() => handleNavClick("#hero")}
              className="flex items-center gap-3 group"
              aria-label="Pezzo Italiano — Accueil"
            >
              <LogoMark size={36} />
              <div className="hidden sm:block">
                <p
                  className="font-serif font-bold text-brand-white text-base lg:text-lg leading-none tracking-wide"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  Pezzo Italiano
                </p>
                <span className="text-brand-gold text-[10px] uppercase tracking-[0.2em]">
                  Pizza al Taglio
                </span>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-brand-white/80 hover:text-brand-gold text-sm font-medium tracking-wide transition-colors duration-200 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-brand-gold group-hover:w-full transition-all duration-300" />
                </button>
              ))}
            </nav>

            {/* CTA + Mobile Toggle */}
            <div className="flex items-center gap-3">
              <a
                href="tel:+21653086089"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-green text-sm font-semibold transition-all duration-300"
              >
                <Phone size={14} />
                Commander
              </a>
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden p-2 text-brand-white hover:text-brand-gold transition-colors"
                aria-label="Menu"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-brand-green flex flex-col items-center justify-center gap-8 lg:hidden"
          >
            {/* Mobile logo */}
            <div className="flex flex-col items-center gap-3 mb-2">
              <LogoMark size={56} />
              <p
                className="font-serif font-bold text-brand-white text-2xl leading-none"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                Pezzo Italiano
              </p>
              <span className="text-brand-gold text-[10px] uppercase tracking-[0.25em]">
                Pizza al Taglio — Sousse
              </span>
            </div>

            {navLinks.map((link, i) => (
              <motion.button
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => handleNavClick(link.href)}
                className="font-serif text-2xl text-brand-white/90 hover:text-brand-gold transition-colors"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                {link.label}
              </motion.button>
            ))}

            <a
              href="tel:+21653086089"
              className="mt-4 flex items-center gap-2 px-6 py-3 rounded-full bg-brand-gold text-brand-green font-bold text-sm"
            >
              <Phone size={16} />
              53 086 089
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
