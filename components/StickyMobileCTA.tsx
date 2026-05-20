"use client";

import { useState, useEffect } from "react";
import { Phone, UtensilsCrossed, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { track } from "@/lib/analytics";
import { useOrder } from "@/context/OrderContext";
import { BUSINESS } from "@/lib/config";

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const MAPS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=35.8459323%2C10.6016556";

export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);
  const { openOrder } = useOrder();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToMenu = () => {
    document.querySelector("#menu")?.scrollIntoView({ behavior: "smooth" });
    track.ctaClick("sticky_menu");
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* ── Mobile sticky bottom bar ───────────────────────────── */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
          >
            <div
              className="bg-brand-green/96 backdrop-blur-md border-t border-brand-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.3)] flex"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {/* Appeler */}
              <a
                href={`tel:${BUSINESS.phone.primary}`}
                onClick={() => track.callClick(BUSINESS.phone.primary.replace("+", ""), "sticky")}
                aria-label="Appeler Pezzo Italiano"
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3.5 text-brand-white/65 hover:text-brand-gold active:bg-brand-white/5 active:scale-95 transition-all duration-150"
              >
                <Phone size={19} strokeWidth={1.75} />
                <span className="text-[10px] font-semibold tracking-wide">Appeler</span>
              </a>

              <div className="w-px bg-brand-white/10 my-2.5" />

              {/* Commander — opens order modal */}
              <button
                onClick={() => { openOrder(); track.orderStart("sticky"); }}
                aria-label="Commander via WhatsApp"
                className="flex-[1.5] flex flex-col items-center justify-center gap-1 py-3.5 bg-brand-gold text-brand-green active:opacity-90 active:scale-95 transition-all duration-150"
              >
                <WhatsAppIcon size={19} />
                <span className="text-[10px] font-black tracking-widest uppercase">Commander</span>
              </button>

              <div className="w-px bg-brand-white/10 my-2.5" />

              {/* Voir le menu */}
              <button
                onClick={scrollToMenu}
                aria-label="Voir le menu"
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3.5 text-brand-white/65 hover:text-brand-gold active:bg-brand-white/5 active:scale-95 transition-all duration-150"
              >
                <UtensilsCrossed size={19} strokeWidth={1.75} />
                <span className="text-[10px] font-semibold tracking-wide">Menu</span>
              </button>

              <div className="w-px bg-brand-white/10 my-2.5" />

              {/* Itinéraire */}
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track.mapClick("sticky")}
                aria-label="Obtenir l'itinéraire"
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3.5 text-brand-white/65 hover:text-brand-gold active:bg-brand-white/5 active:scale-95 transition-all duration-150"
              >
                <MapPin size={19} strokeWidth={1.75} />
                <span className="text-[10px] font-semibold tracking-wide">Itinéraire</span>
              </a>
            </div>
          </motion.div>

          {/* ── Desktop floating pill ─────────────────────────────── */}
          <motion.button
            onClick={() => { openOrder(); track.orderStart("floating_desktop"); }}
            aria-label="Commander via WhatsApp"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="hidden lg:flex fixed bottom-8 right-8 z-50 items-center gap-3 pl-4 pr-5 py-3.5 rounded-full bg-brand-green text-brand-white shadow-2xl shadow-brand-green/40 hover:shadow-brand-gold/25 hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <span className="relative flex-shrink-0">
              <span className="absolute -inset-1 rounded-full bg-brand-gold/25 animate-ping group-hover:bg-transparent" />
              <WhatsAppIcon size={20} />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-brand-white/50 uppercase tracking-widest mb-0.5">
                Commander
              </span>
              <span className="font-bold text-sm tracking-wide group-hover:text-brand-gold transition-colors">
                WhatsApp
              </span>
            </div>
          </motion.button>
        </>
      )}
    </AnimatePresence>
  );
}
