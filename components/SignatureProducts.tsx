"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Star } from "lucide-react";
import { signatureItems } from "@/data/menu";
import { formatPrice } from "@/lib/utils";

const featuredSignatures = [
  {
    id: "pizza-bresola",
    name: "Bresola",
    description:
      "Sauce tomate, mozzarella fondante, roquette fraîche, bresola finement tranchée, tomates cerises, Grana Padana, noix croquantes et réduction balsamique. Une pizza élégante qui marie la charcuterie italienne et la fraîcheur.",
    price: "3.4 DT / 100g",
    image: "/images/bresaola-boeuf/DSC01947.jpg",
    accent: "from-green-900/80 to-green-800/40",
  },
  {
    id: "pizza-poulet-pesto",
    name: "Poulet Pesto Champignons",
    description:
      "Sauce blanche onctueuse, mozzarella généreuse, poulet tendre, champignons frais sautés et sauce pesto maison. Un équilibre parfait entre richesse et légèreté — notre best-seller.",
    price: "3.4 DT / 100g",
    image: "/images/poulet-pesto-champ/DSC01906.jpg",
    accent: "from-brand-green/80 to-brand-green/40",
  },
  {
    id: "pizza-saumon",
    name: "Saumon",
    description:
      "Notre création prestige : sauce blanche crémeuse, mozzarella fior di latte, saumon frais, câpres, aneth et crème citronnée. La pizza la plus raffinée de notre carte.",
    price: "4.4 DT / 100g",
    image: "/images/salmon/DSC01918.jpg",
    accent: "from-amber-900/80 to-amber-800/40",
  },
];

export default function SignatureProducts() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="signatures"
      ref={ref}
      className="relative bg-brand-green py-24 lg:py-32 overflow-hidden"
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #c9a84c 0%, transparent 50%), radial-gradient(circle at 80% 20%, #c9a84c 0%, transparent 40%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-brand-gold text-xs font-bold uppercase tracking-[0.25em] mb-4">
            <Star size={12} className="fill-brand-gold" />
            Nos Signatures
            <Star size={12} className="fill-brand-gold" />
          </span>
          <h2
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-white"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Créations d&apos;exception
          </h2>
          <p className="text-brand-white/50 mt-4 max-w-xl mx-auto text-base leading-relaxed">
            Nos pizzas signature sont nées de notre passion pour l&apos;innovation — inspirées par l&apos;Italie,
            créées à Sousse, inoubliables.
          </p>
        </motion.div>

        {/* Featured products */}
        <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          {featuredSignatures.map((item, i) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="group relative rounded-3xl overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-72 lg:h-80">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${item.accent} to-transparent`}
                />
              </div>

              {/* Gold accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Content overlay */}
              <div className="absolute bottom-0 inset-x-0 p-6">
                {/* Signature badge */}
                <div className="flex items-center gap-1.5 mb-3">
                  <Star size={11} className="fill-brand-gold text-brand-gold" />
                  <span className="text-brand-gold text-[10px] font-bold uppercase tracking-widest">
                    Création Signature
                  </span>
                </div>

                <h3
                  className="font-serif text-2xl font-bold text-brand-white mb-3 leading-tight"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  {item.name}
                </h3>

                <p className="text-brand-white/70 text-sm leading-relaxed mb-4 line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                  {item.description}
                </p>

                <div className="flex items-center justify-between">
                  <span
                    className="font-serif text-brand-gold text-xl font-black"
                    style={{ fontFamily: "var(--font-playfair), serif" }}
                  >
                    {typeof item.price === "number" ? `${item.price} DT` : item.price}
                  </span>
                  <a
                    href="tel:+21653086089"
                    className="px-5 py-2 rounded-full bg-brand-gold text-brand-green text-xs font-bold uppercase tracking-wide hover:bg-brand-gold-light transition-colors"
                  >
                    Commander
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Quote */}
        <motion.blockquote
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="text-center mt-20 max-w-2xl mx-auto"
        >
          <p
            className="font-serif text-2xl lg:text-3xl text-brand-white/80 italic leading-relaxed"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            &ldquo;La pizza al taglio n&apos;est pas un fast food —
            c&apos;est de la gastronomie populaire, élevée.&rdquo;
          </p>
          <span className="block mt-4 text-brand-gold text-sm uppercase tracking-widest">
            — L&apos;équipe Pezzo Italiano
          </span>
        </motion.blockquote>
      </div>
    </section>
  );
}
