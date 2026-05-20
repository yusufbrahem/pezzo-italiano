"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: "100%", label: "Pâte maison" },
  { value: "Daily", label: "Cuisson fraîche" },
  { value: "Al Taglio", label: "Tradition romaine" },
  { value: "Sousse", label: "Depuis 2026" },
];

const storyBeats = [
  {
    icon: "🌿",
    title: "Des ingrédients authentiques",
    body: "Nous sélectionnons chaque ingrédient avec soin — mozzarella fior di latte, tomates San Marzano, huiles vierges extra d'Italie.",
  },
  {
    icon: "🔥",
    title: "La cuisson parfaite",
    body: "Notre four à haute température assure une pâte croustillante à l'extérieur, moelleuse à l'intérieur — cuite chaque matin avant l'ouverture.",
  },
  {
    icon: "✂️",
    title: "Al Taglio — la découpe romaine",
    body: "Pizza al taglio signifie « à la coupe ». Vous choisissez votre portion, nous la réchauffons et la servons sur du papier kraft artisanal.",
  },
];

export default function BrandStory() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="histoire" ref={ref} className="relative overflow-hidden bg-brand-cream py-24 lg:py-32">
      {/* Decorative background element */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none"
        aria-hidden
      >
        <div className="w-full h-full bg-brand-green" style={{ clipPath: "polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-16 lg:mb-20"
        >
          <span className="inline-block text-brand-gold text-xs font-bold uppercase tracking-[0.25em] mb-4">
            Notre Histoire
          </span>
          <h2
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-green max-w-2xl leading-tight"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Nata dalla passione
            <span className="block text-brand-charcoal">per la vera pizza.</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Images */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl"
            >
              <Image
                src="/images/facade/DSC01860.jpg"
                alt="Pezzo Italiano — façade du restaurant"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-green/40 to-transparent" />
            </motion.div>

            {/* Floating secondary image */}
            <motion.div
              initial={{ opacity: 0, x: 40, y: 40 }}
              animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute -bottom-8 -right-4 lg:-right-8 w-44 lg:w-56 aspect-square rounded-xl overflow-hidden shadow-2xl ring-4 ring-brand-cream"
            >
              <Image
                src="/images/mixed-pizza/DSC01985.jpg"
                alt="Pizza signature saumon pistache"
                fill
                className="object-cover"
                sizes="224px"
              />
            </motion.div>

            {/* Stats pill */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="absolute top-6 -right-4 lg:-right-10 bg-brand-green rounded-xl p-4 shadow-2xl"
            >
              <p className="text-brand-gold font-serif text-3xl font-black leading-none" style={{ fontFamily: "var(--font-playfair), serif" }}>
                ★ 4.9
              </p>
              <p className="text-brand-white/70 text-xs mt-1">Note clients</p>
            </motion.div>
          </div>

          {/* Right — Text */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-brand-charcoal/80 text-lg leading-relaxed mb-8"
            >
              Pezzo Italiano est né d&apos;une obsession : apporter à Sousse la véritable pizza al taglio romaine —
              cette pizza rectangulaire cuite dans de grands plateaux, servie à la coupe, légère et croustillante
              comme nulle autre.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="text-brand-charcoal/70 text-base leading-relaxed mb-12"
            >
              Chaque matin, notre équipe prépare la pâte à la main, la laisse lever lentement, et la garnit
              d&apos;ingrédients soigneusement sélectionnés. Le résultat : une pizza qui se mange avec les yeux
              avant de se dévorer des papilles.
            </motion.p>

            {/* Story beats */}
            <div className="space-y-6">
              {storyBeats.map((beat, i) => (
                <motion.div
                  key={beat.title}
                  initial={{ opacity: 0, x: 30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.12 }}
                  className="flex gap-4 p-4 rounded-xl hover:bg-brand-cream-dark transition-colors"
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5">{beat.icon}</span>
                  <div>
                    <h3 className="font-semibold text-brand-green mb-1 text-sm uppercase tracking-wide">
                      {beat.title}
                    </h3>
                    <p className="text-brand-charcoal/70 text-sm leading-relaxed">{beat.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-px bg-brand-green/10 rounded-2xl overflow-hidden"
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`bg-brand-cream p-8 text-center ${
                i < stats.length - 1 ? "border-r border-brand-green/10" : ""
              }`}
            >
              <p
                className="font-serif text-3xl lg:text-4xl font-black text-brand-green mb-2"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                {stat.value}
              </p>
              <p className="text-brand-charcoal/60 text-sm uppercase tracking-widest">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
