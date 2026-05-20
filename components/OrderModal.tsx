"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Minus,
  AlertCircle,
  ChevronDown,
  ArrowLeft,
  Phone,
  ChevronRight,
} from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { menuItems, type MenuItem } from "@/data/menu";
import { cn } from "@/lib/utils";
import { BUSINESS } from "@/lib/config";
import {
  type CartItem,
  type OrderForm,
  type PizzaSize,
  type FormErrors,
  PIZZA_SIZES,
  getOrderTotal,
  buildWhatsAppUrl,
  validateOrder,
} from "@/lib/order";
import { track } from "@/lib/analytics";

// ── Constants ──────────────────────────────────────────────────────────────

type ModalView = "method" | "form";

const ORDERABLE_CATS = ["pizza", "desserts", "boissons", "supplements"] as const;
type OrderableCat = (typeof ORDERABLE_CATS)[number];

const CAT_LABELS: Record<OrderableCat, string> = {
  pizza: "🍕 Pizzas",
  desserts: "🍮 Desserts",
  boissons: "🥤 Boissons",
  supplements: "➕ Suppléments",
};

const ORDERABLE_ITEMS = menuItems.filter(
  (item): item is MenuItem =>
    !item.isComingSoon && (ORDERABLE_CATS as readonly string[]).includes(item.category)
);

const EMPTY_FORM: OrderForm = {
  orderType: "emporter",
  nom: "",
  telephone: "",
  items: [],
  notes: "",
  adresse: "",
  zone: "",
  repere: "",
};

// ── Icons ──────────────────────────────────────────────────────────────────

function WhatsAppIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Root modal ─────────────────────────────────────────────────────────────

export default function OrderModal() {
  const { isOpen, closeOrder } = useOrder();
  const [view, setView] = useState<ModalView>("method");
  const [form, setForm] = useState<OrderForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeCategory, setActiveCategory] = useState<OrderableCat>("pizza");
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Reset after close animation
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setView("method");
        setForm(EMPTY_FORM);
        setErrors({});
        setActiveCategory("pizza");
        setSummaryOpen(false);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // ── Cart ─────────────────────────────────────────────────────────────────

  const addItem = useCallback((menuItem: MenuItem, size: PizzaSize | null, note?: string) => {
    const cartId = `${menuItem.id}:${size ?? "fixed"}`;

    let unitPrice = 0;
    if (menuItem.category === "pizza" && size) {
      unitPrice =
        size === "quart"
          ? (menuItem.priceQuart ?? 0)
          : size === "demi"
          ? (menuItem.priceDemi ?? 0)
          : (menuItem.pricePlateau ?? 0);
    } else if (typeof menuItem.price === "number") {
      unitPrice = menuItem.price;
    }

    setForm((f) => {
      const existing = f.items.find((i) => i.cartId === cartId);
      return {
        ...f,
        items: existing
          ? f.items.map((i) => i.cartId === cartId ? { ...i, quantity: i.quantity + 1 } : i)
          : [
              ...f.items,
              {
                cartId,
                menuItemId: menuItem.id,
                name: menuItem.name,
                category: menuItem.category,
                size,
                sizeLabel: size ? PIZZA_SIZES[size] : null,
                quantity: 1,
                unitPrice,
                customNote: note,
              },
            ],
      };
    });
    setErrors((e) => ({ ...e, items: undefined }));
  }, []);

  const removeItem = useCallback((cartId: string) => {
    setForm((f) => {
      const item = f.items.find((i) => i.cartId === cartId);
      if (!item) return f;
      if (item.quantity > 1) {
        return { ...f, items: f.items.map((i) => i.cartId === cartId ? { ...i, quantity: i.quantity - 1 } : i) };
      }
      return { ...f, items: f.items.filter((i) => i.cartId !== cartId) };
    });
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleCall = () => {
    track.callClick(BUSINESS.phone.primary.replace("+", ""), "order_method");
    window.location.href = `tel:${BUSINESS.phone.primary}`;
    closeOrder();
  };

  const handleWhatsAppMethod = () => {
    setView("form");
    track.orderStart("method_chooser");
  };

  const handleSubmit = () => {
    const errs = validateOrder(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      document.getElementById("order-scroll-body")?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    track.orderSubmit(form.orderType);
    const url = buildWhatsAppUrl(form);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    closeOrder();
  };

  const total = getOrderTotal(form.items);
  const hasCustomItems = form.items.some((i) => i.unitPrice === 0);
  const hasItems = form.items.length > 0;
  const totalQty = form.items.reduce((s, i) => s + i.quantity, 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-[3px]"
            onClick={closeOrder}
          />

          {/* Bottom sheet / centered modal */}
          <div className="fixed bottom-0 left-0 right-0 sm:inset-0 z-[101] sm:flex sm:items-center sm:justify-center sm:p-6">
            <motion.div
              key="sheet"
              layout
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 32, stiffness: 290, mass: 0.85 }}
              className="relative w-full sm:max-w-[480px] bg-[#f7f3ea] rounded-t-[2rem] sm:rounded-[2rem] shadow-[0_-20px_80px_rgba(0,0,0,0.3)] sm:shadow-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: "95svh" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile drag pill */}
              <div className="sm:hidden absolute top-0 inset-x-0 flex justify-center pt-2.5 z-10 pointer-events-none">
                <div className="w-9 h-1 rounded-full bg-brand-white/25" />
              </div>

              {/* ── Header ──────────────────────────────────── */}
              <div className="bg-brand-green pt-7 sm:pt-5 pb-4 px-5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  {view === "form" && (
                    <motion.button
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setView("method")}
                      className="w-8 h-8 rounded-full bg-brand-white/10 hover:bg-brand-white/20 active:bg-brand-white/30 flex items-center justify-center text-brand-white transition-colors"
                      aria-label="Retour"
                    >
                      <ArrowLeft size={15} strokeWidth={2.5} />
                    </motion.button>
                  )}
                  <div>
                    <p className="text-brand-gold/55 text-[10px] uppercase tracking-[0.18em] font-bold leading-none mb-0.5">
                      Pezzo Italiano
                    </p>
                    <h2
                      className="font-serif text-[17px] font-bold text-brand-white leading-none"
                      style={{ fontFamily: "var(--font-playfair), serif" }}
                    >
                      {view === "method" ? "Commander" : "Votre commande"}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {view === "form" && hasItems && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-gold/20 border border-brand-gold/25"
                    >
                      <span className="text-brand-gold text-[11px] font-black">{totalQty}</span>
                      <span className="text-brand-gold/60 text-[10px] font-medium">
                        {totalQty > 1 ? "articles" : "article"}
                      </span>
                    </motion.div>
                  )}
                  <button
                    onClick={closeOrder}
                    className="w-8 h-8 rounded-full bg-brand-white/10 hover:bg-brand-white/20 active:bg-brand-white/30 flex items-center justify-center text-brand-white transition-colors"
                    aria-label="Fermer"
                  >
                    <X size={15} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* ── Body ───────────────────────────────────────── */}
              <div id={view === "form" ? "order-scroll-body" : undefined} className={cn("flex-1", view === "form" && "overflow-y-auto overscroll-contain")}>
                <AnimatePresence mode="wait" initial={false}>
                  {view === "method" ? (
                    <MethodView
                      key="method"
                      onWhatsApp={handleWhatsAppMethod}
                      onCall={handleCall}
                    />
                  ) : (
                    <FormBody
                      key="form"
                      form={form}
                      setForm={setForm}
                      errors={errors}
                      setErrors={setErrors}
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                      addItem={addItem}
                      removeItem={removeItem}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* ── Sticky footer (form view only) ──────────── */}
              {view === "form" && (
                <div
                  className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-t border-brand-green/8 shadow-[0_-8px_32px_rgba(0,0,0,0.08)]"
                  style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
                >
                  {/* Expandable order summary */}
                  {hasItems && (
                    <div className="px-5 pt-4 pb-0">
                      <button
                        onClick={() => setSummaryOpen((v) => !v)}
                        className="w-full flex items-center justify-between gap-3 mb-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal/40">
                            Résumé commande
                          </span>
                          <ChevronDown
                            size={13}
                            className={cn(
                              "text-brand-charcoal/35 transition-transform duration-200",
                              summaryOpen && "rotate-180"
                            )}
                          />
                        </div>
                        <span
                          className="font-serif font-black text-xl text-brand-gold"
                          style={{ fontFamily: "var(--font-playfair), serif" }}
                        >
                          {total > 0
                            ? `${total.toFixed(0)} DT${hasCustomItems ? " + ?" : ""}`
                            : hasCustomItems
                            ? "À confirmer"
                            : "0 DT"}
                        </span>
                      </button>

                      <AnimatePresence>
                        {summaryOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: "hidden" }}
                          >
                            <div className="space-y-2 pt-1 pb-4 border-t border-brand-green/8">
                              {form.items.map((item) => (
                                <div
                                  key={item.cartId}
                                  className="flex items-center justify-between gap-2 text-[12px]"
                                >
                                  <span className="text-brand-charcoal/60 truncate flex-1">
                                    {item.unitPrice > 0 && (
                                      <span className="font-semibold text-brand-charcoal">{item.quantity}×</span>
                                    )}{" "}
                                    {item.name}
                                    {item.sizeLabel ? ` (${item.sizeLabel})` : ""}
                                    {item.customNote ? ` — "${item.customNote.slice(0, 28)}${item.customNote.length > 28 ? "…" : ""}"` : ""}
                                  </span>
                                  <span className="font-semibold text-brand-green flex-shrink-0">
                                    {item.unitPrice > 0
                                      ? `${(item.unitPrice * item.quantity).toFixed(0)} DT`
                                      : "À conf."}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* CTA button */}
                  <div className="px-5 pt-3">
                    <button
                      onClick={handleSubmit}
                      disabled={!hasItems}
                      className={cn(
                        "w-full flex items-center justify-center gap-2.5 py-4 rounded-[18px] font-bold text-[13px] tracking-wide transition-all duration-200",
                        hasItems
                          ? "bg-[#25D366] text-white shadow-lg shadow-[#25D366]/25 hover:bg-[#1fb855] active:scale-[0.98] active:shadow-none"
                          : "bg-brand-charcoal/8 text-brand-charcoal/30 cursor-not-allowed"
                      )}
                    >
                      <WhatsAppIcon size={17} />
                      {hasItems
                        ? total > 0
                          ? `Commander via WhatsApp — ${total.toFixed(0)} DT${hasCustomItems ? " + à conf." : ""}`
                          : "Commander via WhatsApp — Prix à confirmer"
                        : "Sélectionnez vos articles"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Method chooser ─────────────────────────────────────────────────────────

function MethodView({
  onWhatsApp,
  onCall,
}: {
  onWhatsApp: () => void;
  onCall: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="px-5 py-7"
    >
      <p
        className="text-center font-serif text-[18px] font-bold text-brand-charcoal mb-1.5"
        style={{ fontFamily: "var(--font-playfair), serif" }}
      >
        Comment commander ?
      </p>
      <p className="text-center text-brand-charcoal/45 text-[13px] mb-7">
        Choisissez votre méthode préférée
      </p>

      {/* WhatsApp — primary */}
      <button
        onClick={onWhatsApp}
        className="w-full flex items-center gap-4 p-5 rounded-[20px] bg-brand-green border-2 border-brand-gold/30 hover:border-brand-gold active:scale-[0.98] transition-all duration-150 shadow-lg shadow-brand-green/25 mb-3 text-left"
      >
        <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#25D366]/30">
          <WhatsAppIcon size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-[15px] text-brand-white">Commander via WhatsApp</span>
          </div>
          <p className="text-brand-white/50 text-[12px] leading-relaxed">
            Choisissez vos articles, envoyez en 1 tap
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="px-2 py-0.5 rounded-full bg-brand-gold text-brand-green text-[9px] font-black uppercase tracking-wider">
            Recommandé
          </span>
          <ChevronRight size={15} className="text-brand-white/35" />
        </div>
      </button>

      {/* Phone — secondary */}
      <button
        onClick={onCall}
        className="w-full flex items-center gap-4 p-5 rounded-[20px] bg-white border border-brand-green/12 hover:border-brand-green/30 active:scale-[0.98] transition-all duration-150 text-left"
      >
        <div className="w-12 h-12 rounded-full bg-brand-green/8 flex items-center justify-center flex-shrink-0">
          <Phone size={20} className="text-brand-green" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-[15px] text-brand-charcoal block mb-0.5">
            Appeler directement
          </span>
          <span className="text-brand-charcoal/45 text-[13px] font-medium">
            {BUSINESS.phone.primaryFormatted}
          </span>
        </div>
        <ChevronRight size={15} className="text-brand-charcoal/25 flex-shrink-0" />
      </button>

      {/* Bottom note */}
      <p className="text-center text-brand-charcoal/35 text-[11px] mt-5">
        Service disponible tous les jours · 11h – 23h
      </p>
    </motion.div>
  );
}

// ── Form body ──────────────────────────────────────────────────────────────

function FormBody({
  form,
  setForm,
  errors,
  setErrors,
  activeCategory,
  setActiveCategory,
  addItem,
  removeItem,
}: {
  form: OrderForm;
  setForm: React.Dispatch<React.SetStateAction<OrderForm>>;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  activeCategory: OrderableCat;
  setActiveCategory: (c: OrderableCat) => void;
  addItem: (item: MenuItem, size: PizzaSize | null, note?: string) => void;
  removeItem: (cartId: string) => void;
}) {
  const categoryItems = ORDERABLE_ITEMS.filter((i) => i.category === activeCategory);
  const deliverySection = form.orderType === "livraison" ? "04" : null;
  const notesSection = deliverySection ? "05" : "04";

  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 18 }}
      transition={{ duration: 0.22 }}
      id="order-form-top"
      className="px-5 py-6 space-y-8"
    >
      {/* ── 01 Type de commande ────────────────────── */}
      <FormSection number="01" label="Type de commande">
        <div className="flex gap-2 p-1.5 bg-brand-green/8 rounded-2xl">
          {(
            [
              { value: "emporter", label: "À emporter", icon: "🏃", sub: "Au comptoir" },
              { value: "livraison", label: "Livraison", icon: "🛵", sub: "À domicile" },
            ] as const
          ).map(({ value, label, icon, sub }) => (
            <button
              key={value}
              onClick={() => setForm((f) => ({ ...f, orderType: value }))}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-3.5 rounded-xl text-[13px] font-bold transition-all duration-200",
                form.orderType === value
                  ? "bg-brand-green text-brand-white shadow-md shadow-brand-green/30"
                  : "text-brand-charcoal/50 hover:text-brand-charcoal/70"
              )}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className={form.orderType === value ? "text-brand-white" : "text-brand-charcoal/70"}>
                {label}
              </span>
              <span
                className={cn(
                  "text-[10px] font-normal",
                  form.orderType === value ? "text-brand-white/55" : "text-brand-charcoal/35"
                )}
              >
                {sub}
              </span>
            </button>
          ))}
        </div>

        {/* À emporter note */}
        <AnimatePresence>
          {form.orderType === "emporter" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mt-3 flex items-start gap-2.5 p-3.5 rounded-xl bg-brand-green/6 border border-brand-green/10">
                <span className="text-[16px] leading-none mt-0.5">📍</span>
                <div>
                  <p className="text-[12px] font-semibold text-brand-green mb-0.5">
                    Rue Imam Moslem, Khzema Ouest — Sousse
                  </p>
                  <p className="text-[11px] text-brand-charcoal/45">
                    Votre commande sera prête à l'arrivée
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </FormSection>

      {/* ── 02 Vos informations ────────────────────── */}
      <FormSection number="02" label="Vos informations">
        <div className="space-y-3">
          <InputField
            label="Nom complet"
            placeholder="Ex : Ahmed Ben Salah"
            value={form.nom}
            onChange={(v) => {
              setForm((f) => ({ ...f, nom: v }));
              if (errors.nom) setErrors((e) => ({ ...e, nom: undefined }));
            }}
            error={errors.nom}
            autoComplete="name"
          />
          <InputField
            label="Numéro de téléphone"
            placeholder="Ex : 53 086 089"
            value={form.telephone}
            onChange={(v) => {
              setForm((f) => ({ ...f, telephone: v }));
              if (errors.telephone) setErrors((e) => ({ ...e, telephone: undefined }));
            }}
            error={errors.telephone}
            type="tel"
            autoComplete="tel"
          />
        </div>
      </FormSection>

      {/* ── 03 Articles ────────────────────────────── */}
      <FormSection
        number="03"
        label={
          <span className="flex items-center gap-2">
            <span>Vos articles</span>
            {form.items.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-brand-gold text-brand-green text-[10px] font-black">
                {form.items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </span>
        }
      >
        <AnimatePresence>
          {errors.items && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 flex items-center gap-1.5 text-red-500 text-[11px]"
            >
              <AlertCircle size={11} />
              {errors.items}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Category tabs — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none mb-4">
          {ORDERABLE_CATS.map((cat) => {
            const catQty = form.items
              .filter((i) => i.category === cat)
              .reduce((s, i) => s + i.quantity, 0);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all duration-200 whitespace-nowrap",
                  activeCategory === cat
                    ? "bg-brand-green text-white shadow-sm"
                    : "bg-white text-brand-charcoal/55 border border-brand-green/10 hover:border-brand-green/25"
                )}
              >
                {CAT_LABELS[cat]}
                {catQty > 0 && (
                  <span className="w-4 h-4 rounded-full bg-brand-gold text-brand-green text-[9px] font-black flex items-center justify-center flex-shrink-0">
                    {catQty}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Item list */}
        <div className="space-y-2.5">
          {categoryItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              cartItems={form.items}
              onAdd={addItem}
              onRemove={removeItem}
            />
          ))}
        </div>
      </FormSection>

      {/* ── 04 Livraison ───────────────────────────── */}
      <AnimatePresence>
        {form.orderType === "livraison" && (
          <motion.div
            key="delivery"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <FormSection number={deliverySection!} label="Adresse de livraison">
              <div className="space-y-3">
                <InputField
                  label="Adresse"
                  placeholder="Ex : 14 Rue Ibn Khaldoun"
                  value={form.adresse}
                  onChange={(v) => {
                    setForm((f) => ({ ...f, adresse: v }));
                    if (errors.adresse) setErrors((e) => ({ ...e, adresse: undefined }));
                  }}
                  error={errors.adresse}
                  autoComplete="street-address"
                />
                <InputField
                  label="Zone / Quartier"
                  placeholder="Ex : Khzema Ouest, Sahloul..."
                  value={form.zone}
                  onChange={(v) => {
                    setForm((f) => ({ ...f, zone: v }));
                    if (errors.zone) setErrors((e) => ({ ...e, zone: undefined }));
                  }}
                  error={errors.zone}
                />
                <InputField
                  label="Point de repère (optionnel)"
                  placeholder="Ex : En face de la pharmacie"
                  value={form.repere}
                  onChange={(v) => setForm((f) => ({ ...f, repere: v }))}
                />
              </div>
            </FormSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notes ──────────────────────────────────── */}
      <FormSection number={notesSection} label="Notes (optionnel)">
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Ex : sans piment, bien cuit, sonnez deux fois..."
          rows={3}
          className="w-full px-4 py-3.5 rounded-xl bg-white border border-brand-green/12 text-[13px] text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none focus:border-brand-green/35 focus:ring-2 focus:ring-brand-green/8 resize-none transition-all"
        />
      </FormSection>

      <div className="h-2" />
    </motion.div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FormSection({
  number,
  label,
  children,
}: {
  number: string;
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-[11px] font-black text-brand-gold tracking-[0.15em] leading-none tabular-nums">
          {number}
        </span>
        <span className="text-[11px] font-black text-brand-charcoal/40 uppercase tracking-[0.1em] leading-none">
          {label}
        </span>
        <div className="flex-1 h-px bg-brand-green/8" />
      </div>
      {children}
    </section>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-brand-charcoal/45 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(
          "w-full px-4 py-3.5 rounded-xl bg-white border text-[14px] text-brand-charcoal placeholder:text-brand-charcoal/22 focus:outline-none focus:ring-2 transition-all",
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-100/60"
            : "border-brand-green/12 focus:border-brand-green/40 focus:ring-brand-green/8"
        )}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 flex items-center gap-1 text-red-500 text-[11px]"
          >
            <AlertCircle size={10} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItemCard({
  item,
  cartItems,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  cartItems: CartItem[];
  onAdd: (item: MenuItem, size: PizzaSize | null, note?: string) => void;
  onRemove: (cartId: string) => void;
}) {
  const [customNote, setCustomNote] = useState("");
  const isPizza = item.category === "pizza";
  const totalQty = cartItems
    .filter((ci) => ci.menuItemId === item.id)
    .reduce((s, ci) => s + ci.quantity, 0);

  // ── Custom order card (Plateau Varié) ─────────────────────────────
  if (item.isCustom) {
    const existing = cartItems.find((ci) => ci.menuItemId === item.id);
    return (
      <div
        className={cn(
          "rounded-2xl border overflow-hidden transition-all duration-200",
          existing
            ? "border-brand-gold/30 shadow-md shadow-brand-gold/10"
            : "border-dashed border-brand-gold/35 bg-brand-gold/5"
        )}
      >
        <div className="flex items-start gap-2 px-4 pt-3.5 pb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-bold text-[14px] text-brand-charcoal">{item.name}</span>
              <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold">
                Sur mesure
              </span>
            </div>
            <p className="text-[11px] text-brand-charcoal/40 leading-relaxed">{item.description}</p>
          </div>
        </div>

        {existing ? (
          <div className="px-3 pb-3 space-y-2">
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-brand-green/6 border border-brand-green/12">
              <p className="flex-1 text-[11px] text-brand-charcoal/60 italic leading-relaxed">
                &ldquo;{existing.customNote}&rdquo;
              </p>
              <button
                onClick={() => onRemove(existing.cartId)}
                className="w-6 h-6 rounded-full bg-brand-green/10 hover:bg-brand-green/20 flex items-center justify-center text-brand-green flex-shrink-0 transition-colors"
                aria-label="Retirer"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </div>
            <p className="text-center text-[10px] text-brand-gold font-semibold">
              💬 Prix à confirmer par retour de message
            </p>
          </div>
        ) : (
          <div className="px-3 pb-3 space-y-2">
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ex : 4 tranches Bresaola, 3 tranches Thon, 2 tranches Saumon..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white border border-brand-gold/20 text-[12px] text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none focus:border-brand-gold/40 resize-none transition-all"
            />
            <button
              onClick={() => {
                if (customNote.trim()) {
                  onAdd(item, null, customNote.trim());
                  setCustomNote("");
                }
              }}
              disabled={!customNote.trim()}
              className={cn(
                "w-full py-2.5 rounded-xl text-[12px] font-bold transition-all duration-150",
                customNote.trim()
                  ? "bg-brand-gold text-brand-green hover:bg-brand-gold-light active:scale-[0.98]"
                  : "bg-brand-green/8 text-brand-charcoal/25 cursor-not-allowed"
              )}
            >
              Ajouter — Prix à confirmer
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isPizza) {
    return (
      <div
        className={cn(
          "rounded-2xl border overflow-hidden transition-all duration-200",
          totalQty > 0
            ? "border-brand-green/25 shadow-md shadow-brand-green/8"
            : "border-brand-green/8 bg-white"
        )}
      >
        {/* Pizza info row */}
        <div
          className={cn(
            "flex items-start justify-between gap-2 px-4 pt-3.5 pb-3",
            totalQty > 0 ? "bg-brand-green/[0.04]" : "bg-white"
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className="font-bold text-[14px] text-brand-charcoal">{item.name}</span>
              {item.isSignature && (
                <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold">
                  Signature
                </span>
              )}
              {item.tags?.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-cream text-brand-charcoal/45"
                >
                  {tag}
                </span>
              ))}
              {item.isVegetarian && (
                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                  Végé
                </span>
              )}
            </div>
            <p className="text-[11px] text-brand-charcoal/35 line-clamp-1 leading-relaxed">
              {item.description}
            </p>
          </div>
          {totalQty > 0 && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-gold text-brand-green text-[10px] font-black flex items-center justify-center mt-0.5">
              {totalQty}
            </span>
          )}
        </div>

        {/* Size rows — mobile-optimized, full-width touch targets */}
        <div
          className={cn(
            "px-3 pb-3 space-y-1.5",
            totalQty > 0 ? "bg-brand-green/[0.04]" : "bg-white"
          )}
        >
          {(
            [
              { size: "quart" as PizzaSize, price: item.priceQuart },
              { size: "demi" as PizzaSize, price: item.priceDemi },
              { size: "plateau" as PizzaSize, price: item.pricePlateau },
            ] as const
          ).map(({ size, price }) => {
            if (!price) return null;
            const cartId = `${item.id}:${size}`;
            const ci = cartItems.find((c) => c.cartId === cartId);
            const qty = ci?.quantity ?? 0;
            const active = qty > 0;

            return (
              <div
                key={size}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-150 min-h-[52px]",
                  active
                    ? "bg-brand-green shadow-sm shadow-brand-green/20"
                    : "bg-[#f0ece3] hover:bg-[#e8e4db] active:bg-[#e0dcd3]"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      "text-[12px] font-semibold leading-none",
                      active ? "text-brand-white/70" : "text-brand-charcoal/55"
                    )}
                  >
                    {PIZZA_SIZES[size]}
                  </span>
                  <span
                    className="font-serif font-black text-[16px] leading-none text-brand-gold"
                    style={{ fontFamily: "var(--font-playfair), serif" }}
                  >
                    {price} DT
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {active ? (
                    <>
                      <button
                        onClick={() => onRemove(cartId)}
                        className="w-7 h-7 rounded-full bg-brand-white/15 hover:bg-brand-white/25 active:bg-brand-white/30 flex items-center justify-center text-white transition-colors"
                        aria-label="Retirer"
                      >
                        <Minus size={11} strokeWidth={2.5} />
                      </button>
                      <span className="text-[14px] font-bold text-white min-w-[20px] text-center">
                        {qty}
                      </span>
                      <button
                        onClick={() => onAdd(item, size)}
                        className="w-7 h-7 rounded-full bg-brand-gold hover:bg-brand-gold-light active:bg-brand-gold flex items-center justify-center text-brand-green transition-colors"
                        aria-label="Ajouter"
                      >
                        <Plus size={11} strokeWidth={2.5} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onAdd(item, size)}
                      className="w-8 h-8 rounded-full bg-brand-green hover:bg-brand-green-light active:bg-brand-green flex items-center justify-center text-white transition-colors shadow-sm"
                      aria-label={`Ajouter ${PIZZA_SIZES[size]}`}
                    >
                      <Plus size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Non-pizza: desserts, boissons, supplements
  const cartId = `${item.id}:fixed`;
  const ci = cartItems.find((c) => c.cartId === cartId);
  const qty = ci?.quantity ?? 0;
  const fixedPrice = typeof item.price === "number" ? item.price : null;

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all duration-200 min-h-[68px]",
        qty > 0
          ? "bg-brand-green/[0.04] border-brand-green/20 shadow-sm"
          : "bg-white border-brand-green/8 hover:border-brand-green/15"
      )}
    >
      <div className="flex-1 min-w-0">
        <span className="font-bold text-[14px] text-brand-charcoal block leading-tight">
          {item.name}
        </span>
        <span className="text-[11px] text-brand-charcoal/38 block mt-0.5 line-clamp-1">
          {item.description}
        </span>
        {fixedPrice !== null && (
          <span
            className="font-serif font-black text-[14px] text-brand-gold mt-1 block"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            {fixedPrice} DT
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        {qty > 0 ? (
          <>
            <button
              onClick={() => onRemove(cartId)}
              className="w-9 h-9 rounded-full bg-brand-green/10 hover:bg-brand-green/18 active:bg-brand-green/25 text-brand-green flex items-center justify-center transition-colors"
              aria-label="Retirer"
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <span className="font-bold text-[15px] text-brand-green min-w-[22px] text-center">
              {qty}
            </span>
            <button
              onClick={() => onAdd(item, null)}
              className="w-9 h-9 rounded-full bg-brand-green hover:bg-brand-green-light active:bg-brand-green text-white flex items-center justify-center transition-colors"
              aria-label="Ajouter"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </>
        ) : (
          <button
            onClick={() => onAdd(item, null)}
            className="w-10 h-10 rounded-full bg-brand-green hover:bg-brand-green-light active:bg-brand-green text-white flex items-center justify-center transition-colors shadow-sm"
            aria-label={`Ajouter ${item.name}`}
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
