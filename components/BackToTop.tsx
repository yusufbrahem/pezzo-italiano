"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { track } from "@/lib/analytics";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    track.ctaClick("back_to_top");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={scrollToTop}
          aria-label="Retour en haut"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed z-40 bottom-24 right-4 lg:bottom-8 lg:left-8 w-11 h-11 rounded-full bg-brand-white/90 backdrop-blur-sm border border-brand-green/15 text-brand-green shadow-lg flex items-center justify-center hover:bg-brand-gold hover:text-brand-green hover:border-brand-gold active:scale-90 transition-colors duration-200"
        >
          <ArrowUp size={18} strokeWidth={2.25} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
