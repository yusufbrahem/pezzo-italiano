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

import { BUSINESS } from "./config";

// Re-exported for convenience; update in lib/config.ts
export const WHATSAPP_NUMBER = BUSINESS.whatsappNumber;

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
    const size = item.sizeLabel ? ` (${item.sizeLabel})` : "";
    const price = `${(item.unitPrice * item.quantity).toFixed(0)} DT`;
    lines.push(`• ${item.quantity}x ${item.name}${size} — ${price}`);
  }

  const total = getOrderTotal(form.items);
  lines.push("");
  lines.push(`*Sous-total :* ${total.toFixed(0)} DT`);

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

export function buildWhatsAppUrl(form: OrderForm): string {
  const message = buildWhatsAppMessage(form);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
