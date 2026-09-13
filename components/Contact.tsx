"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Phone, Clock, ExternalLink } from "lucide-react";
import { track } from "@/lib/analytics";
import { useIsOpenNow } from "@/lib/hours";
import { useOrder } from "@/context/OrderContext";

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

export default function Contact({ hours }: { hours: { days: string; time: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const isOpen = useIsOpenNow();
  const { contact } = useOrder();

  const contactInfo = [
    {
      icon: MapPin,
      label: "Adresse",
      value: `${contact.address.street}, ${contact.address.area}\n${contact.address.city} ${contact.address.postalCode}, Tunisie`,
      href: contact.address.mapsUrl,
      linkLabel: "Voir sur Maps",
    },
    {
      icon: Phone,
      label: "Téléphone",
      value: `${contact.phone.primaryFormatted}\n${contact.phone.secondaryFormatted}`,
      href: `tel:${contact.phone.primary}`,
      linkLabel: "Appeler",
    },
  ];

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
                        onClick={() =>
                          info.href.startsWith("http")
                            ? track.mapClick("contact_card")
                            : track.callClick(info.href.replace("tel:+216", ""), "contact_card")
                        }
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
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center">
                    <Clock size={18} className="text-brand-gold" />
                  </div>
                  <p className="text-brand-white font-semibold text-sm uppercase tracking-wide">
                    Horaires d&apos;ouverture
                  </p>
                </div>
                {isOpen !== null && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      isOpen
                        ? "bg-green-500/15 text-green-400"
                        : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOpen ? "bg-green-400 animate-pulse" : "bg-red-400"
                      }`}
                    />
                    {isOpen ? "Ouvert" : "Fermé"}
                  </span>
                )}
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
                href={contact.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track.socialClick("instagram")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white border border-brand-green/10 text-brand-charcoal hover:border-brand-gold/40 hover:text-brand-green transition-all duration-300 text-sm font-semibold group"
              >
                <span className="text-pink-500 group-hover:scale-110 transition-transform inline-flex"><InstagramIcon size={18} /></span>
                Instagram
              </a>
              <a
                href={contact.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track.socialClick("facebook")}
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
              src={contact.address.mapsEmbedUrl}
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
                href={`tel:${contact.phone.primary}`}
                onClick={() => track.callClick(contact.phone.primary.replace("+", ""), "contact_cta")}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-brand-gold text-brand-green font-bold text-sm hover:bg-brand-gold-light transition-colors"
              >
                <Phone size={14} />
                {contact.phone.primaryFormatted}
              </a>
              <a
                href={`tel:${contact.phone.secondary}`}
                onClick={() => track.callClick(contact.phone.secondary.replace("+", ""), "contact_cta")}
                className="flex items-center gap-2 px-6 py-3 rounded-full border border-brand-white/30 text-brand-white font-semibold text-sm hover:border-brand-gold hover:text-brand-gold transition-colors"
              >
                <Phone size={14} />
                {contact.phone.secondaryFormatted}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
