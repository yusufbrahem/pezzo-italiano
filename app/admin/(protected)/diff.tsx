import type { ReactNode } from "react";
import { getItemPhotos, menuCategories, type MenuItem } from "@/data/menu";
import type { PricingTier } from "@/lib/data/settings";
import type { HoursOverride, HoursSchedule } from "@/lib/hours-shared";

// Field-by-field comparisons shown in /admin/approvals (current vs proposed)
// and /admin/activity/v/[id] (before vs after, now vs restored).

export type DiffRow = { label: string; a: ReactNode; b: ReactNode };

const dt = (n: number | undefined | null) => (n === undefined || n === null ? "—" : `${n} DT`);

const FLAGS: [keyof MenuItem, string][] = [
  ["isSignature", "Signature"],
  ["isNew", "Nouveau"],
  ["isBestseller", "Coup de cœur"],
  ["isDevPick", "Choix du Dev"],
  ["isVegetarian", "Végétarien"],
  ["isComingSoon", "Bientôt disponible"],
  ["isCustom", "Sur mesure"],
];

const MENU_FIELDS: [string, (i: MenuItem) => string][] = [
  ["Nom", (i) => i.name],
  ["Description", (i) => i.description || "—"],
  ["Catégorie", (i) => menuCategories.find((c) => c.id === i.category)?.labelFr ?? i.category],
  ["Prix", (i) => (typeof i.price === "number" ? dt(i.price) : i.price || "—")],
  ["Prix / 100 g", (i) => dt(i.pricePer100g)],
  ["¼ plateau", (i) => dt(i.priceQuart)],
  ["½ plateau", (i) => dt(i.priceDemi)],
  ["Plateau", (i) => dt(i.pricePlateau)],
  ["Étiquettes", (i) => i.tags?.join(", ") || "—"],
  ["Badges", (i) => FLAGS.filter(([k]) => i[k]).map(([, l]) => l).join(", ") || "—"],
  ["Visible sur le site", (i) => (i.isPublished === false ? "Non" : "Oui")],
  ["Cadrage de la photo", (i) => i.imagePosition || "centre"],
];

export function Photos({ urls }: { urls: string[] }) {
  if (urls.length === 0) return <span className="text-brand-charcoal/60">Aucune photo</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {urls.map((u) => (
        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails
        <img key={u} src={u} alt="" className="w-12 h-12 rounded-md object-cover border border-brand-green/10" />
      ))}
    </span>
  );
}

/** Menu item: every differing field (all fields when one side is missing). */
export function menuRows(a: MenuItem | null | undefined, b: MenuItem | null | undefined): DiffRow[] {
  const rows: DiffRow[] = MENU_FIELDS.filter(([, f]) => !a || !b || f(a) !== f(b)).map(([label, f]) => ({
    label,
    a: a ? f(a) : "—",
    b: b ? f(b) : "—",
  }));
  const pa = a ? getItemPhotos(a).map((p) => p.src) : [];
  const pb = b ? getItemPhotos(b).map((p) => p.src) : [];
  if (pa.join("|") !== pb.join("|")) rows.push({ label: "Photos", a: <Photos urls={pa} />, b: <Photos urls={pb} /> });
  return rows;
}

const TIER_FIELDS: [string, (t: PricingTier) => string][] = [
  ["Nom", (t) => t.label],
  ["Articles", (t) => t.itemsLabel],
  ["Accroche", (t) => t.tagline || "—"],
  ["Badge", (t) => t.badge || "—"],
  ["Prix / 100 g", (t) => dt(t.pricePer100g)],
  ["¼ plateau", (t) => dt(t.priceQuart)],
  ["½ plateau", (t) => dt(t.priceDemi)],
  ["Plateau", (t) => dt(t.pricePlateau)],
  ["Style", (t) => `${t.style} · icône ${t.icon}`],
];

export function pricingRows(a: PricingTier[], b: PricingTier[]): DiffRow[] {
  const rows: DiffRow[] = [];
  const byId = new Map(a.map((t) => [t.id, t]));
  for (const t of b) {
    const old = byId.get(t.id);
    if (!old) {
      rows.push({ label: "Tarif ajouté", a: "—", b: `${t.label} — ${t.itemsLabel}` });
      continue;
    }
    for (const [label, f] of TIER_FIELDS) if (f(old) !== f(t)) rows.push({ label: `${old.label} · ${label}`, a: f(old), b: f(t) });
  }
  for (const t of a) if (!b.some((x) => x.id === t.id)) rows.push({ label: "Tarif retiré", a: t.label, b: "—" });
  const order = (l: PricingTier[]) => l.map((t) => t.label).join(" · ");
  if (rows.length === 0 && order(a) !== order(b)) rows.push({ label: "Ordre", a: order(a), b: order(b) });
  return rows;
}

const DAYS: [keyof HoursSchedule, string][] = [
  ["Mon", "Lundi"],
  ["Tue", "Mardi"],
  ["Wed", "Mercredi"],
  ["Thu", "Jeudi"],
  ["Fri", "Vendredi"],
  ["Sat", "Samedi"],
  ["Sun", "Dimanche"],
];

export function hoursRows(a: HoursSchedule | null, b: HoursSchedule | null): DiffRow[] {
  const show = (s: HoursSchedule | null, d: keyof HoursSchedule) => {
    const x = s?.[d];
    return !x ? "—" : x.closed ? "Fermé" : `${x.opens} – ${x.closes}`;
  };
  return DAYS.filter(([d]) => show(a, d) !== show(b, d)).map(([d, label]) => ({ label, a: show(a, d), b: show(b, d) }));
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Tunis", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function overrideRows(a: HoursOverride | null, b: HoursOverride | null): DiffRow[] {
  const f: [string, (o: HoursOverride | null) => string][] = [
    ["Dérogation", (o) => (!o?.active ? "Désactivée" : o.mode === "open" ? "Ouvert exceptionnellement" : "Fermé exceptionnellement")],
    ["Motif", (o) => o?.reason || "—"],
    ["Jusqu'au", (o) => (o?.expiresAt ? dateFmt.format(new Date(o.expiresAt)) : "—")],
  ];
  return f.filter(([, g]) => g(a) !== g(b)).map(([label, g]) => ({ label, a: g(a), b: g(b) }));
}

export const CONTACT_FIELDS: Record<string, string> = {
  "address.street": "Rue",
  "address.area": "Quartier",
  "address.city": "Ville",
  "address.postalCode": "Code postal",
  "address.country": "Pays",
  "address.lat": "Latitude",
  "address.lng": "Longitude",
  "address.mapsUrl": "Lien Google Maps",
  "address.mapsEmbedUrl": "Carte intégrée",
  "phone.primary": "Téléphone principal",
  "phone.secondary": "Téléphone secondaire",
  "phone.primaryFormatted": "Téléphone principal (affiché)",
  "phone.secondaryFormatted": "Téléphone secondaire (affiché)",
  whatsappNumber: "Numéro WhatsApp",
  "social.instagram": "Instagram",
  "social.facebook": "Facebook",
  "social.tiktok": "TikTok",
};

function flat(o: unknown, p = ""): Record<string, string> {
  return Object.entries((o ?? {}) as Record<string, unknown>).reduce<Record<string, string>>((acc, [k, v]) => {
    if (v && typeof v === "object") Object.assign(acc, flat(v, `${p}${k}.`));
    else acc[`${p}${k}`] = v === null || v === undefined ? "" : String(v);
    return acc;
  }, {});
}

export function contactRows(a: unknown, b: unknown): DiffRow[] {
  const fa = flat(a);
  const fb = flat(b);
  return [...new Set([...Object.keys(fa), ...Object.keys(fb)])]
    .filter((k) => (fa[k] ?? "") !== (fb[k] ?? ""))
    .map((k) => ({ label: CONTACT_FIELDS[k] ?? k, a: fa[k] || "—", b: fb[k] || "—" }));
}

export function DiffTable({
  rows,
  aLabel = "Actuellement",
  bLabel = "Proposé",
  empty = "Aucune différence avec la version en ligne.",
}: {
  rows: DiffRow[];
  aLabel?: string;
  bLabel?: string;
  empty?: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-brand-charcoal/60">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[11px] uppercase tracking-wide text-brand-charcoal/60 border-b border-brand-green/10">
          <th className="py-1.5 pr-3 font-semibold w-1/5">Champ</th>
          <th className="py-1.5 pr-3 font-semibold">{aLabel}</th>
          <th className="py-1.5 font-semibold">{bLabel}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.label}-${i}`} className="border-b border-brand-green/5 last:border-0 align-top">
            <td className="py-2 pr-3 text-brand-charcoal/70">{r.label}</td>
            <td className="py-2 pr-3 text-brand-charcoal/60 line-through decoration-red-300 break-words">{r.a}</td>
            <td className="py-2 font-medium text-brand-green break-words">{r.b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Two numbered lists side by side (menu order). */
export function OrderLists({ a, b, aLabel, bLabel }: { a: string[]; b: string[]; aLabel: string; bLabel: string }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-brand-charcoal/60 font-semibold mb-1">{aLabel}</p>
        <ol className="list-decimal list-inside text-brand-charcoal/70">{a.map((n, i) => <li key={i}>{n}</li>)}</ol>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-brand-charcoal/60 font-semibold mb-1">{bLabel}</p>
        <ol className="list-decimal list-inside font-medium text-brand-green">{b.map((n, i) => <li key={i}>{n}</li>)}</ol>
      </div>
    </div>
  );
}
