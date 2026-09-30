import { ChevronDown } from "lucide-react";
import { FAQ } from "@/data/faq";

// Server component with native <details>: the answers are in the HTML from
// the first byte (crawlable, no hydration, never hidden at opacity 0).
export default function FAQSection() {
  return (
    <section id="faq" className="bg-white py-24 lg:py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-brand-gold-deep text-xs font-bold uppercase tracking-[0.25em] mb-4">
            Questions fréquentes
          </span>
          <h2
            className="font-serif text-4xl sm:text-5xl font-bold text-brand-green"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            La pizza al taglio à Sousse
          </h2>
        </div>

        <div className="divide-y divide-brand-green/10 border-y border-brand-green/10">
          {FAQ.map((entry) => (
            <details key={entry.question} lang={entry.lang} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-brand-green [&::-webkit-details-marker]:hidden">
                {entry.question}
                <ChevronDown
                  size={20}
                  aria-hidden
                  className="shrink-0 text-brand-gold-deep transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 leading-relaxed text-brand-charcoal/70">{entry.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
