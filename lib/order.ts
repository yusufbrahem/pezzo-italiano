export type PizzaSize = "quart" | "demi" | "plateau";
export type OrderType = "livraison" | "emporter";

export interface CartItem {
  cartId: string;
  menuItemId: string;
  name: string;
  category: string;
  size: PizzaSize | null;
  sizeLabel: string | null;
  quantity: number;
  unitPrice: number;
  customNote?: string;
}

export interface OrderForm {
  orderType: OrderType;
  nom: string;
  telephone: string;
  items: CartItem[];
  notes: string;
  adresse: string;
  zone: string;
  repere: string;
}

export interface FormErrors {
  nom?: string;
  telephone?: string;
  items?: string;
  adresse?: string;
  zone?: string;
}

export const PIZZA_SIZES: Record<PizzaSize, string> = {
  quart: "¼ Plateau",
  demi: "½ Plateau",
  plateau: "Plateau",
};

export function getOrderTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function validateOrder(form: OrderForm): FormErrors {
  const errors: FormErrors = {};

  if (!form.nom.trim()) {
    errors.nom = "Veuillez entrer votre nom complet.";
  }
  if (!form.telephone.trim()) {
    errors.telephone = "Veuillez entrer votre numéro de téléphone.";
  } else if (!/^[0-9\s+\-]{8,15}$/.test(form.telephone.trim())) {
    errors.telephone = "Numéro de téléphone invalide.";
  }
  if (form.items.length === 0) {
    errors.items = "Veuillez sélectionner au moins un article.";
  }
  if (form.orderType === "livraison") {
    if (!form.adresse.trim()) errors.adresse = "Veuillez entrer votre adresse.";
    if (!form.zone.trim()) errors.zone = "Veuillez entrer votre zone / quartier.";
  }

  return errors;
}

export function buildWhatsAppMessage(form: OrderForm): string {
  const lines: string[] = [];

  lines.push("🍕 *NOUVELLE COMMANDE — PEZZO ITALIANO*");
  lines.push("");
  lines.push(`*Client :* ${form.nom}`);
  lines.push(`*Téléphone :* ${form.telephone}`);
  lines.push("");
  lines.push(
    `*Type de commande :* ${form.orderType === "livraison" ? "🛵 Livraison" : "🏃 À emporter"}`
  );
  lines.push("");
  lines.push("*Articles :*");

  for (const item of form.items) {
    if (item.unitPrice === 0 && item.customNote !== undefined) {
      lines.push(`• ${item.name} — "${item.customNote}" — 💬 *Prix à confirmer*`);
    } else {
      const size = item.sizeLabel ? ` (${item.sizeLabel})` : "";
      const price = `${(item.unitPrice * item.quantity).toFixed(0)} DT`;
      lines.push(`• ${item.quantity}x ${item.name}${size} — ${price}`);
    }
  }

  const total = getOrderTotal(form.items);
  const hasCustomItems = form.items.some((i) => i.unitPrice === 0);
  lines.push("");
  if (total > 0) {
    lines.push(
      `*Sous-total :* ${total.toFixed(0)} DT${hasCustomItems ? " _(+ plateau varié à confirmer)_" : ""}`
    );
  } else if (hasCustomItems) {
    lines.push(`*Prix :* À confirmer par retour de message`);
  }

  if (form.orderType === "livraison") {
    lines.push("");
    lines.push(`*Adresse :* ${form.adresse}`);
    lines.push(`*Zone :* ${form.zone}`);
    if (form.repere.trim()) {
      lines.push(`*Point de repère :* ${form.repere}`);
    }
  }

  if (form.notes.trim()) {
    lines.push("");
    lines.push(`*Notes :* ${form.notes}`);
  }

  lines.push("");
  lines.push("Merci 🙏");

  return lines.join("\n");
}

export function buildWhatsAppUrl(form: OrderForm, whatsappNumber: string): string {
  const message = buildWhatsAppMessage(form);
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

// ── Customer follow-up (admin /admin/clients) ──────────────────────────────

export const GOOGLE_REVIEW_URL =
  "https://www.google.com/maps/place/Pezzo+Italiano+Sousse/@35.8458983,10.6012652,141m";

/**
 * Digits-only international form usable by wa.me — "53 086 089",
 * "+216 53086089" and "0021653086089" all become "21653086089". A bare
 * 8-digit number is assumed Tunisian. Returns null if nothing usable is left.
 */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 8) digits = `216${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/**
 * A fully typed phone number: 8 local digits, whether or not the customer
 * typed the +216 / 00216 prefix. Decides when an unsent order form is worth
 * saving — never half-typed numbers.
 */
export function isCompletePhone(raw: string): boolean {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("216") && digits.length > 8) digits = digits.slice(3);
  return digits.length >= 8 && digits.length <= 12;
}

export function buildReviewRequestUrl(customerName: string, phone: string): string {
  const firstName = customerName.trim().split(/\s+/)[0] ?? "";
  const message = [
    `Bonjour ${firstName} 👋`,
    "",
    "Merci d'avoir commandé chez Pezzo Italiano ! 🍕",
    "Si vous avez apprécié, un petit avis Google nous aiderait énormément 🙏",
    "",
    GOOGLE_REVIEW_URL,
    "",
    "À très bientôt !",
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
