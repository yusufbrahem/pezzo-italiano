"use client";

import Image from "next/image";
import { Phone, MapPin } from "lucide-react";
import { track } from "@/lib/analytics";

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const footerLinks = [
  { label: "Accueil", href: "#hero" },
  { label: "Notre Histoire", href: "#histoire" },
  { label: "Menu", href: "#menu" },
  { label: "Signatures", href: "#signatures" },
  { label: "Galerie", href: "#galerie" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-charcoal text-brand-white">
      {/* Top bar */}
      <div className="border-b border-brand-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                {/* Gold circle monogram — green on white multiplied over gold = clean on any dark bg */}
                <div className="w-10 h-10 rounded-full bg-brand-gold flex-shrink-0 flex items-center justify-center">
                  <Image
                    src="/images/logo/monogram-green.jpeg"
                    alt=""
                    width={29}
                    height={29}
                    className="object-contain"
                    style={{ mixBlendMode: "multiply" }}
                  />
                </div>
                <div>
                  <p
                    className="font-serif font-bold text-brand-white text-base leading-none"
                    style={{ fontFamily: "var(--font-playfair), serif" }}
                  >
                    Pezzo Italiano
                  </p>
                  <span className="text-brand-gold text-[10px] uppercase tracking-widest">
                    Pizza al Taglio
                  </span>
                </div>
              </div>
              <p className="text-brand-white/50 text-sm leading-relaxed max-w-xs">
                L&apos;Italie à chaque tranche. Pâte fraîche, ingrédients authentiques,
                cuite chaque matin à Sousse.
              </p>
              <div className="flex gap-3 mt-6">
                <a
                  href="https://www.instagram.com/pezzo.italiano/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track.socialClick("instagram")}
                  className="w-9 h-9 rounded-lg bg-brand-white/10 flex items-center justify-center hover:bg-brand-gold hover:text-brand-green transition-all duration-300"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
                <a
                  href="https://www.facebook.com/1123669727485255"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track.socialClick("facebook")}
                  className="w-9 h-9 rounded-lg bg-brand-white/10 flex items-center justify-center hover:bg-brand-gold hover:text-brand-green transition-all duration-300"
                  aria-label="Facebook"
                >
                  <FacebookIcon />
                </a>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <p className="text-brand-gold text-xs font-bold uppercase tracking-[0.2em] mb-5">
                Navigation
              </p>
              <nav className="space-y-3">
                {footerLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block text-brand-white/50 hover:text-brand-gold text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Contact */}
            <div>
              <p className="text-brand-gold text-xs font-bold uppercase tracking-[0.2em] mb-5">
                Contact
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="text-brand-gold mt-0.5 flex-shrink-0" />
                  <p className="text-brand-white/50 text-sm leading-relaxed">
                    Rue Imam Moslem<br />
                    Khzema Ouest, Sousse 4051
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={14} className="text-brand-gold flex-shrink-0" />
                  <div>
                    <a href="tel:+21653086089" onClick={() => track.callClick("53086089", "footer")} className="block text-brand-white/50 hover:text-brand-gold text-sm transition-colors">
                      53 086 089
                    </a>
                    <a href="tel:+21658057094" onClick={() => track.callClick("58057094", "footer")} className="block text-brand-white/50 hover:text-brand-gold text-sm transition-colors">
                      58 057 094
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Tagline */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-brand-gold text-xs font-bold uppercase tracking-[0.2em] mb-5">
                  Notre Promesse
                </p>
                <blockquote
                  className="font-serif text-xl text-brand-white/80 italic leading-relaxed"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  &ldquo;Fraîche, croustillante,<br />cuite chaque jour.&rdquo;
                </blockquote>
              </div>
              <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/15 border border-brand-gold/30">
                <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                <span className="text-brand-gold text-xs font-semibold uppercase tracking-widest">
                  Ouvert maintenant
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-brand-white/30 text-xs">
          <p>© {year} Pezzo Italiano. Tous droits réservés.</p>
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
            Sousse, Tunisie
          </p>
        </div>
      </div>
    </footer>
  );
}
