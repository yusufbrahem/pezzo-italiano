"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Phone, Clock, ExternalLink } from "lucide-react";

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const hours = [
  { days: "Lundi – Vendredi", time: "11h00 – 23h00" },
  { days: "Samedi", time: "10h30 – 23h30" },
  { days: "Dimanche", time: "11h00 – 22h30" },
];

const contactInfo = [
  {
    icon: MapPin,
    label: "Adresse",
    value: "Rue Imam Moslem, Khzema Ouest\nSousse 4051, Tunisie",
    href: "https://www.google.com/maps/place/Pezzo+Italiano+Sousse/@35.8459323,10.6016556,17z",
    linkLabel: "Voir sur Maps",
  },
  {
    icon: Phone,
    label: "Téléphone",
    value: "53 086 089\n58 057 094",
    href: "tel:+21653086089",
    linkLabel: "Appeler",
  },
];

export default function Contact() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="contact" ref={ref} className="bg-brand-cream-dark py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-brand-gold text-xs font-bold uppercase tracking-[0.25em] mb-4">
            Nous Trouver
          </span>
          <h2
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-green"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Venez nous rendre visite
          </h2>
          <p className="text-brand-charcoal/60 mt-4 max-w-xl mx-auto leading-relaxed">
            En plein cœur de Khzema Ouest, Sousse. On vous attend avec une pâte croustillante
            et un sourire chaleureux.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left — Info cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact details */}
            {contactInfo.map((info, i) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.12 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-brand-green/5 hover:border-brand-gold/30 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center flex-shrink-0 group-hover:bg-brand-green-light transition-colors">
                    <info.icon size={18} className="text-brand-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-brand-charcoal/50 text-xs uppercase tracking-widest mb-1">
                      {info.label}
                    </p>
                    <p className="text-brand-charcoal font-medium text-sm leading-relaxed whitespace-pre-line">
                      {info.value}
                    </p>
                    {info.href && (
                      <a
                        href={info.href}
                        target={info.href.startsWith("http") ? "_blank" : undefined}
                        rel={info.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center gap-1 text-brand-gold text-xs font-semibold mt-2 hover:underline"
                      >
                        {info.linkLabel}
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Hours */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="bg-brand-green rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center">
                  <Clock size={18} className="text-brand-gold" />
                </div>
                <p className="text-brand-white font-semibold text-sm uppercase tracking-wide">
                  Horaires d&apos;ouverture
                </p>
              </div>
              <div className="space-y-3">
                {hours.map((h) => (
                  <div key={h.days} className="flex items-center justify-between">
                    <span className="text-brand-white/60 text-sm">{h.days}</span>
                    <span className="text-brand-gold font-semibold text-sm">{h.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Social links */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex gap-4"
            >
              <a
                href="https://www.instagram.com/pezzo.italiano/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white border border-brand-green/10 text-brand-charcoal hover:border-brand-gold/40 hover:text-brand-green transition-all duration-300 text-sm font-semibold group"
              >
                <span className="text-pink-500 group-hover:scale-110 transition-transform inline-flex"><InstagramIcon size={18} /></span>
                Instagram
              </a>
              <a
                href="https://www.facebook.com/1123669727485255"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white border border-brand-green/10 text-brand-charcoal hover:border-brand-gold/40 hover:text-brand-green transition-all duration-300 text-sm font-semibold group"
              >
                <span className="text-blue-600 group-hover:scale-110 transition-transform inline-flex"><FacebookIcon size={18} /></span>
                Facebook
              </a>
            </motion.div>
          </div>

          {/* Right — Map */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-3 rounded-2xl overflow-hidden shadow-xl border border-brand-green/10 min-h-[400px] lg:min-h-0"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d750!2d10.6016556!3d35.8459323!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd8b8a05b14021%3A0xd0722a5defefb417!2sPezzo%20Italiano%20Sousse!5e0!3m2!1sfr!2stn!4v1748800000000!5m2!1sfr!2stn"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "450px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Pezzo Italiano — Localisation Sousse"
              className="w-full h-full"
            />
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-brand-green text-brand-white">
            <div className="text-left">
              <p className="font-serif text-xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Envie d&apos;une pizza maintenant ?
              </p>
              <p className="text-brand-white/60 text-sm mt-0.5">Appelez-nous directement pour commander</p>
            </div>
            <div className="flex gap-3">
              <a
                href="tel:+21653086089"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-brand-gold text-brand-green font-bold text-sm hover:bg-brand-gold-light transition-colors"
              >
                <Phone size={14} />
                53 086 089
              </a>
              <a
                href="tel:+21658057094"
                className="flex items-center gap-2 px-6 py-3 rounded-full border border-brand-white/30 text-brand-white font-semibold text-sm hover:border-brand-gold hover:text-brand-gold transition-colors"
              >
                <Phone size={14} />
                58 057 094
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
