import { menuCategories } from "@/data/menu";
import type { ItemStat, OrderAnalytics } from "@/lib/data/orders";
import { formatDT } from "@/lib/orders-filters";
import { PIZZA_SIZES, type PizzaSize } from "@/lib/order";

// Pure HTML/CSS charts — single-series throughout (one brand-green hue, no
// legend needed; each card's title names what's plotted). Every mark has a
// hover tooltip; exact values are always in text beside ranked bars and in
// the "Voir les données" table under the timeline.

const card = "bg-white rounded-xl border border-brand-green/10 p-5";
const cardTitle = "text-sm font-semibold text-brand-charcoal";
const cardSub = "text-xs text-brand-charcoal/45 mt-0.5";

const nf = new Intl.NumberFormat("fr-FR");
const dayFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const fmtBucket = (ymd: string, long = false) => (long ? weekdayFmt : dayFmt).format(new Date(`${ymd}T00:00:00Z`));

const CATEGORY_ORDER = ["pizza", "supplements", "boissons", "desserts", "partager"];
const categoryLabel = (id: string) => {
  const c = menuCategories.find((m) => m.id === id);
  return c ? `${c.icon} ${c.labelFr}` : "Autres";
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={card}>
      <p className="text-xs text-brand-charcoal/50">{label}</p>
      <p className="text-2xl font-semibold text-brand-charcoal mt-1">{value}</p>
      {hint && <p className="text-xs text-brand-charcoal/45 mt-1">{hint}</p>}
    </div>
  );
}

function RankedBars({ rows, unit = "vendus" }: { rows: ItemStat[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.quantity));
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.name} className="group">
          <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
            <span className="min-w-0 truncate text-brand-charcoal">
              <span className="text-brand-charcoal/35 tabular-nums mr-1.5">{i + 1}.</span>
              {r.name}
            </span>
            <span className="flex-shrink-0 tabular-nums text-brand-charcoal/70">
              <span className="font-semibold text-brand-charcoal">{nf.format(r.quantity)}</span> {unit}
              {r.revenue > 0 && <span className="text-brand-charcoal/40"> · {formatDT(r.revenue)}</span>}
            </span>
          </div>
          <div className="h-2 bg-brand-green/5 rounded-r-[4px]" title={`${r.name} — ${r.quantity} ${unit}, ${r.orders} commande(s)`}>
            <div
              className="h-full bg-brand-green-muted group-hover:bg-brand-green rounded-r-[4px] transition-colors"
              style={{ width: `${(r.quantity / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Columns({
  data,
  height = 160,
  tooltip,
  label,
  tickEvery,
}: {
  data: { key: string; value: number }[];
  height?: number;
  tooltip: (i: number) => string;
  label: (i: number) => string;
  tickEvery: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const niceMax = max <= 5 ? max : Math.ceil(max / 5) * 5;
  return (
    <div>
      <div className="relative" style={{ height }}>
        {/* recessive gridlines: 0, half, max */}
        {[0, 0.5, 1].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-brand-green/8" style={{ bottom: `${f * 100}%` }}>
            <span className="absolute -top-2 left-0 -translate-x-full pr-2 text-[10px] text-brand-charcoal/35 tabular-nums">
              {Math.round(niceMax * f)}
            </span>
          </div>
        ))}
        <div className="absolute inset-0 flex items-end gap-[2px] ml-1">
          {data.map((d, i) => (
            <div key={d.key} className="group relative flex-1 h-full flex items-end justify-center">
              {/* hit target is the whole column slot, bigger than the mark */}
              <div
                className="w-full max-w-6 rounded-t-[4px] bg-brand-green-muted group-hover:bg-brand-green transition-colors"
                style={{ height: `${(d.value / niceMax) * 100}%`, minHeight: d.value > 0 ? 3 : 0 }}
              />
              <div className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-brand-charcoal px-2 py-1 text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {tooltip(i)}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Ticks every `tickEvery` columns, counted back from the last one so the
          most recent bucket is always labelled and never collides with a
          neighbouring tick. */}
      <div className="flex gap-[2px] ml-1 mt-1.5">
        {data.map((d, i) => (
          <div key={d.key} className="relative flex-1 h-4">
            {(data.length - 1 - i) % tickEvery === 0 && (
              <span className="absolute left-1/2 -translate-x-1/2 text-[10px] text-brand-charcoal/40 tabular-nums whitespace-nowrap">
                {label(i)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsView({ a, limitedTo30Days }: { a: OrderAnalytics; limitedTo30Days: boolean }) {
  const k = a.kpis;

  if (k.orders === 0) {
    return (
      <div className={`${card} text-center py-12 text-sm text-brand-charcoal/50`}>
        Aucune commande sur cette période — les statistiques apparaîtront dès les premières commandes.
      </div>
    );
  }

  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
  const byCategory = CATEGORY_ORDER.concat(
    [...new Set(a.items.map((i) => i.category))].filter((c) => !CATEGORY_ORDER.includes(c))
  )
    .map((cat) => ({ cat, rows: a.items.filter((i) => i.category === cat).slice(0, 8) }))
    .filter((g) => g.rows.length > 0);

  const sizeTotal = a.pizzaSizes.reduce((s, r) => s + r.quantity, 0);
  const sizeRows = (["quart", "demi", "plateau"] as PizzaSize[])
    .map((s) => ({ size: s, quantity: a.pizzaSizes.find((r) => r.size === s)?.quantity ?? 0 }))
    .filter((r) => r.quantity > 0);

  const peakHour = a.hours.reduce((best, h) => (h.orders > best.orders ? h : best), a.hours[0]);
  const openHours = a.hours.filter((h) => h.hour >= 10); // service is ~11h–23h; keeps late-night/early outliers in the table only
  const outsideHours = a.hours.filter((h) => h.hour < 10).reduce((s, h) => s + h.orders, 0);

  // ~5 date labels: readable on a phone, still enough on desktop.
  const timelineTick = Math.max(1, Math.ceil(a.timeline.length / 5));
  const timelineTotal = a.timeline.reduce((s, t) => s + t.orders, 0);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2 rounded-xl p-5 bg-brand-green">
          <p className="text-xs text-brand-white/60">Chiffre d&apos;affaires — commandes confirmées</p>
          <p className="text-5xl font-semibold text-brand-white mt-2">{formatDT(k.confirmedRevenue)}</p>
          <p className="text-xs text-brand-white/55 mt-2">
            {formatDT(k.revenue)} en incluant les {nf.format(k.orders - k.confirmedOrders)} commande(s) non confirmée(s)
            {k.customPriceOrders > 0 && ` · hors ${k.customPriceOrders} plateau(x) varié(s) à prix à confirmer`}
          </p>
        </div>
        <Stat
          label="Commandes"
          value={nf.format(k.orders)}
          hint={`${nf.format(k.confirmedOrders)} confirmées (${pct(k.confirmedOrders, k.orders)} %)`}
        />
        <Stat label="Panier moyen" value={formatDT(Math.round(k.avgBasket * 100) / 100)} hint="Par commande avec prix connu" />
        <Stat
          label="Clients"
          value={nf.format(k.customers)}
          hint={`${nf.format(k.returningCustomers)} fidèles (2+ commandes)`}
        />
        <div className={card}>
          <p className="text-xs text-brand-charcoal/50">Livraison / À emporter</p>
          <div className="flex h-2.5 mt-3 gap-[2px]" title={`Livraison ${k.delivery} · À emporter ${k.pickup}`}>
            {k.delivery > 0 && <div className="bg-brand-green rounded-l-[4px]" style={{ width: `${pct(k.delivery, k.orders)}%` }} />}
            {k.pickup > 0 && <div className="bg-brand-gold rounded-r-[4px]" style={{ width: `${pct(k.pickup, k.orders)}%` }} />}
          </div>
          <div className="flex justify-between text-xs mt-2 text-brand-charcoal/60">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-green" /> Livraison {pct(k.delivery, k.orders)} %
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-gold" /> Emporter {pct(k.pickup, k.orders)} %
            </span>
          </div>
        </div>
        <Stat
          label="Avis Google demandés"
          value={nf.format(k.reviewsRequested)}
          hint={`${pct(k.reviewsRequested, k.confirmedOrders)} % des commandes confirmées`}
        />
        <Stat
          label="Heure de pointe"
          value={peakHour.orders > 0 ? `${peakHour.hour}h – ${peakHour.hour + 1}h` : "—"}
          hint={peakHour.orders > 0 ? `${peakHour.orders} commande(s) sur ce créneau` : undefined}
        />
      </div>

      {/* Timeline */}
      <div className={card}>
        <div className="flex items-baseline justify-between gap-3 mb-5">
          <div>
            <h3 className={cardTitle}>Commandes par {a.timelineUnit === "week" ? "semaine" : "jour"}</h3>
            <p className={cardSub}>
              {limitedTo30Days ? "30 derniers jours · " : ""}
              {nf.format(timelineTotal)} commandes · survolez une barre pour le détail
            </p>
          </div>
        </div>
        <div className="pl-6">
          <Columns
            data={a.timeline.map((t) => ({ key: t.bucket, value: t.orders }))}
            tickEvery={timelineTick}
            label={(i) => fmtBucket(a.timeline[i].bucket)}
            tooltip={(i) => {
              const t = a.timeline[i];
              const when = a.timelineUnit === "week" ? `Semaine du ${fmtBucket(t.bucket)}` : fmtBucket(t.bucket, true);
              return `${when} · ${t.orders} cmd · ${formatDT(t.revenue)}`;
            }}
          />
        </div>
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-brand-charcoal/45 hover:text-brand-charcoal/70">Voir les données</summary>
          <table className="mt-2 w-full max-w-md text-left tabular-nums">
            <thead>
              <tr className="text-brand-charcoal/45">
                <th className="py-1 font-semibold">{a.timelineUnit === "week" ? "Semaine du" : "Jour"}</th>
                <th className="py-1 font-semibold text-right">Commandes</th>
                <th className="py-1 font-semibold text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {a.timeline.map((t) => (
                <tr key={t.bucket} className="border-t border-brand-green/5 text-brand-charcoal/70">
                  <td className="py-1">{fmtBucket(t.bucket, true)}</td>
                  <td className="py-1 text-right">{t.orders}</td>
                  <td className="py-1 text-right">{formatDT(t.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>

      {/* Best sellers per category */}
      <div className="grid lg:grid-cols-2 gap-4">
        {byCategory.map(({ cat, rows }) => (
          <div key={cat} className={card}>
            <h3 className={`${cardTitle} mb-1`}>Top {categoryLabel(cat)}</h3>
            <p className={`${cardSub} mb-4`}>Par quantité vendue</p>
            <RankedBars rows={rows} unit={cat === "pizza" ? "parts" : "vendus"} />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Pizza sizes */}
        {sizeRows.length > 0 && (
          <div className={card}>
            <h3 className={`${cardTitle} mb-1`}>Formats de pizza</h3>
            <p className={`${cardSub} mb-4`}>Répartition des tailles commandées</p>
            <ul className="space-y-3">
              {sizeRows.map((r) => (
                <li key={r.size}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-brand-charcoal">{PIZZA_SIZES[r.size]}</span>
                    <span className="tabular-nums text-brand-charcoal/70">
                      <span className="font-semibold text-brand-charcoal">{r.quantity}</span> · {pct(r.quantity, sizeTotal)} %
                    </span>
                  </div>
                  <div className="h-2 bg-brand-green/5 rounded-r-[4px]">
                    <div className="h-full bg-brand-green-muted rounded-r-[4px]" style={{ width: `${pct(r.quantity, sizeTotal)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Peak hours */}
        <div className={`${card} lg:col-span-2`}>
          <h3 className={cardTitle}>Heures de commande</h3>
          <p className={`${cardSub} mb-5`}>
            Nombre de commandes par heure (heure de Tunis)
            {outsideHours > 0 && ` · ${outsideHours} avant 10h non affichée(s)`}
          </p>
          <div className="pl-6">
            <Columns
              height={120}
              data={openHours.map((h) => ({ key: String(h.hour), value: h.orders }))}
              tickEvery={2}
              label={(i) => `${openHours[i].hour}h`}
              tooltip={(i) => `${openHours[i].hour}h–${openHours[i].hour + 1}h · ${openHours[i].orders} cmd`}
            />
          </div>
        </div>
      </div>

      {/* Delivery zones */}
      {a.zones.length > 0 && (
        <div className={card}>
          <h3 className={`${cardTitle} mb-1`}>Zones de livraison</h3>
          <p className={`${cardSub} mb-4`}>Quartiers les plus livrés</p>
          <RankedBars
            unit="livraisons"
            rows={a.zones.map((z) => ({ name: z.zone, category: "", quantity: z.orders, revenue: 0, orders: z.orders }))}
          />
        </div>
      )}
    </div>
  );
}
