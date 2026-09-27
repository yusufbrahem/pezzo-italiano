import { after } from "next/server";
import { requireSession } from "@/lib/auth/session";
import {
  getAudienceBehaviour,
  getAudienceBreakdowns,
  getDailyAudience,
  rollupOldSiteEvents,
  type BreakdownRow,
  type DailyAudience,
} from "@/lib/data/audience";
import {
  DETAIL_RETENTION_DAYS,
  daysBetween,
  parseAudienceFilters,
  resolveAudienceRange,
  shiftDay,
} from "@/lib/audience-filters";
import { formatDT } from "@/lib/orders-filters";
import { SOURCE_LABELS } from "@/lib/visitor-info";
import { BarList, Columns, Stat, card, cardSub, cardTitle, fmtBucket, nf, pct } from "../charts";
import AudienceShell from "./AudienceShell";
import BehaviourView from "./BehaviourView";

export const metadata = { title: "Audience" };

const countryNames = new Intl.DisplayNames(["fr"], { type: "region" });
const countryLabel = (code: string) => {
  if (code === "?") return "Inconnu";
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
};
const DEVICE_LABELS: Record<string, string> = { mobile: "📱 Téléphone", tablet: "Tablette", desktop: "💻 Ordinateur" };
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function sum(days: DailyAudience[], k: keyof Omit<DailyAudience, "day">) {
  return days.reduce((s, d) => s + d[k], 0);
}
function change(now: number, before: number): number | null {
  if (before === 0) return null;
  return Math.round(((now - before) / before) * 100);
}
const fmtPct = (n: number, d: number) =>
  d > 0 ? `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format((n / d) * 100)} %` : "—";

/** Group daily rows into Monday-based weeks once the period is long. */
function bucketize(days: DailyAudience[]): { unit: "day" | "week"; rows: DailyAudience[] } {
  if (days.length <= 62) return { unit: "day", rows: days };
  const weeks = new Map<string, DailyAudience>();
  for (const d of days) {
    const dow = (new Date(`${d.day}T00:00:00Z`).getUTCDay() + 6) % 7; // Mon = 0
    const key = shiftDay(d.day, -dow);
    const w = weeks.get(key) ?? { ...d, day: key, visitors: 0, pageviews: 0, orderStarters: 0, orderSubmitters: 0, calls: 0, whatsapp: 0, directions: 0, social: 0, shares: 0, orders: 0, revenue: 0 };
    for (const k of Object.keys(w) as (keyof DailyAudience)[]) {
      if (k !== "day") (w[k] as number) += d[k] as number;
    }
    weeks.set(key, w);
  }
  return { unit: "week", rows: [...weeks.values()] };
}

function breakdownBars(rows: BreakdownRow[], label: (k: string) => string, limit = 8) {
  return rows.slice(0, limit).map((r) => ({
    key: r.key,
    label: label(r.key),
    value: r.visitors,
    title: `${label(r.key)} — ${r.visitors} visiteur(s), ${r.converted} ont commandé`,
    valueText: (
      <>
        <span className="font-semibold text-brand-charcoal">{nf.format(r.visitors)}</span>
        {r.converted > 0 && (
          <span className="text-brand-charcoal/40">
            {" "}
            · {r.converted} cmd ({pct(r.converted, r.visitors)} %)
          </span>
        )}
      </>
    ),
  }));
}

export default async function AudiencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSession();
  const filters = parseAudienceFilters(await searchParams);
  const { from, to } = resolveAudienceRange(filters);
  const length = daysBetween(from, to) + 1;
  const prevTo = shiftDay(from, -1);
  const prevFrom = shiftDay(prevTo, -(length - 1));

  // Housekeeping: fold >90-day-old detail rows into daily totals, after the response.
  after(() => rollupOldSiteEvents().catch((err) => console.error("[audience] rollup failed:", err)));

  const [days, prevDays, bd, behaviour] = await Promise.all([
    getDailyAudience(from, to),
    getDailyAudience(prevFrom, prevTo),
    getAudienceBreakdowns(from, to),
    getAudienceBehaviour(from, to),
  ]);

  const visitors = sum(days, "visitors");
  const pageviews = sum(days, "pageviews");
  const starters = sum(days, "orderStarters");
  const submitters = sum(days, "orderSubmitters");
  const orders = sum(days, "orders");
  const revenue = sum(days, "revenue");
  const calls = sum(days, "calls");
  const whatsapp = sum(days, "whatsapp");
  const directions = sum(days, "directions");
  const prevVisitors = sum(prevDays, "visitors");
  const prevOrders = sum(prevDays, "orders");
  const prevSubmitters = sum(prevDays, "orderSubmitters");

  const firstTracked = days.find((d) => d.visitors > 0)?.day ?? null;
  const { unit, rows: buckets } = bucketize(days);
  const weekday = WEEKDAYS.map((label, i) => ({
    label,
    visitors: days
      .filter((d) => (new Date(`${d.day}T00:00:00Z`).getUTCDay() + 6) % 7 === i)
      .reduce((s, d) => s + d.visitors, 0),
  }));

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-green">Audience</h1>
      <p className="text-sm text-brand-charcoal/50 mt-1 mb-5">
        Visites du site, d&apos;où elles viennent et combien se transforment en commandes. Mesuré par le site
        lui-même, sans cookies ni données personnelles — vos propres visites (connecté à l&apos;admin) ne sont pas
        comptées.
      </p>

      <AudienceShell filters={filters}>
        {visitors === 0 && orders === 0 ? (
          <div className={`${card} text-center py-12 text-sm text-brand-charcoal/50`}>
            Aucune visite enregistrée sur cette période pour l&apos;instant — les chiffres apparaissent au fil des
            visites.
          </div>
        ) : (
          <div className="space-y-5">
            {firstTracked && firstTracked > from && (
              <p className="text-xs text-brand-charcoal/50 bg-brand-gold/10 border border-brand-gold/25 rounded-lg px-3 py-2">
                Mesure des visites active depuis le {fmtBucket(firstTracked, true)} — rien n&apos;est compté avant
                cette date.
              </p>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat
                label="Visiteurs"
                value={nf.format(visitors)}
                delta={change(visitors, prevVisitors)}
                hint="Uniques par jour"
              />
              <Stat
                label="Pages vues"
                value={nf.format(pageviews)}
                hint={visitors > 0 ? `${(pageviews / visitors).toFixed(1).replace(".", ",")} par visiteur` : undefined}
              />
              <Stat
                label="Taux de commande"
                value={fmtPct(submitters, visitors)}
                hint={`${nf.format(submitters)} visiteur(s) ont envoyé une commande${
                  prevVisitors > 0 ? ` · période précédente : ${fmtPct(prevSubmitters, prevVisitors)}` : ""
                }`}
              />
              <Stat
                label="Commandes reçues"
                value={nf.format(orders)}
                delta={change(orders, prevOrders)}
                hint={revenue > 0 ? formatDT(revenue) : undefined}
              />
            </div>

            {/* Funnel */}
            <div className={card}>
              <h3 className={cardTitle}>Parcours de commande</h3>
              <p className={`${cardSub} mb-4`}>
                Combien de visiteurs avancent jusqu&apos;à la commande — le % compare chaque étape à la précédente
              </p>
              <ol className="space-y-3">
                {[
                  { label: "Ont visité le site", value: visitors, base: visitors },
                  { label: "Ont ouvert le formulaire de commande", value: starters, base: visitors },
                  { label: "Ont envoyé la commande sur WhatsApp", value: submitters, base: starters },
                ].map((s, i) => (
                  <li key={s.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
                      <span className="min-w-0 text-brand-charcoal">
                        <span className="text-brand-charcoal/35 tabular-nums mr-1.5">{i + 1}.</span>
                        {s.label}
                      </span>
                      <span className="flex-shrink-0 tabular-nums text-brand-charcoal/70">
                        <span className="font-semibold text-brand-charcoal">{nf.format(s.value)}</span>
                        {i > 0 && (
                          <span
                            className="text-brand-charcoal/40"
                            title={`${pct(s.value, s.base)} % de ceux de l'étape précédente`}
                          >
                            {" "}
                            · {pct(s.value, s.base)} %
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2.5 bg-brand-green/5 rounded-r-[4px]">
                      <div className="h-full bg-brand-green-muted rounded-r-[4px]" style={{ width: `${pct(s.value, visitors)}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-brand-charcoal/50 mt-4 pt-3 border-t border-brand-green/5">
                Contacts directs (hors formulaire) : 📞 {calls} appel(s) · 💬 {whatsapp} WhatsApp · 📍 {directions}{" "}
                itinéraire(s)
              </p>
            </div>

            {/* Timeline */}
            <div className={card}>
              <h3 className={cardTitle}>Visiteurs par {unit === "week" ? "semaine" : "jour"}</h3>
              <p className={`${cardSub} mb-5`}>Survolez une barre pour le détail</p>
              <div className="pl-6">
                <Columns
                  data={buckets.map((d) => ({ key: d.day, value: d.visitors }))}
                  tickEvery={Math.max(1, Math.ceil(buckets.length / 5))}
                  label={(i) => fmtBucket(buckets[i].day)}
                  tooltip={(i) => {
                    const d = buckets[i];
                    const when = unit === "week" ? `Semaine du ${fmtBucket(d.day)}` : fmtBucket(d.day, true);
                    return `${when} · ${d.visitors} visiteurs · ${d.pageviews} pages · ${d.orders} cmd`;
                  }}
                />
              </div>
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-brand-charcoal/45 hover:text-brand-charcoal/70">Voir les données</summary>
                <table className="mt-2 w-full max-w-lg text-left tabular-nums">
                  <thead>
                    <tr className="text-brand-charcoal/45">
                      <th className="py-1 font-semibold">{unit === "week" ? "Semaine du" : "Jour"}</th>
                      <th className="py-1 font-semibold text-right">Visiteurs</th>
                      <th className="py-1 font-semibold text-right">Pages</th>
                      <th className="py-1 font-semibold text-right">Commandes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buckets.map((d) => (
                      <tr key={d.day} className="border-t border-brand-green/5 text-brand-charcoal/70">
                        <td className="py-1">{fmtBucket(d.day, true)}</td>
                        <td className="py-1 text-right">{d.visitors}</td>
                        <td className="py-1 text-right">{d.pageviews}</td>
                        <td className="py-1 text-right">{d.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>

            {bd ? (
              <>
                {bd.clamped && (
                  <p className="text-xs text-brand-charcoal/50">
                    Le détail ci-dessous (sources, appareils, lieux, heures) couvre les {DETAIL_RETENTION_DAYS} derniers
                    jours — au-delà, seuls les totaux sont conservés.
                  </p>
                )}
                <div className="grid lg:grid-cols-2 gap-4">
                  <div className={card}>
                    <h3 className={cardTitle}>D&apos;où viennent les visiteurs</h3>
                    <p className={`${cardSub} mb-4`}>Et combien d&apos;entre eux ont commandé</p>
                    <BarList rows={breakdownBars(bd.source, (k) => SOURCE_LABELS[k] ?? k, 10)} />
                  </div>
                  <div className={card}>
                    <h3 className={cardTitle}>Appareils</h3>
                    <p className={`${cardSub} mb-4`}>Téléphone, tablette ou ordinateur</p>
                    <BarList numbered={false} rows={breakdownBars(bd.device, (k) => DEVICE_LABELS[k] ?? k)} />
                    <div className="grid sm:grid-cols-2 gap-5 mt-6">
                      <div>
                        <p className="text-xs font-semibold text-brand-charcoal/50 mb-3">Système</p>
                        <BarList numbered={false} rows={breakdownBars(bd.os, (k) => k, 5)} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-brand-charcoal/50 mb-3">Navigateur</p>
                        <BarList numbered={false} rows={breakdownBars(bd.browser, (k) => k, 5)} />
                      </div>
                    </div>
                  </div>
                  <div className={card}>
                    <h3 className={cardTitle}>Villes</h3>
                    <p className={`${cardSub} mb-4`}>Localisation approximative (fournie par le réseau)</p>
                    <BarList rows={breakdownBars(bd.city, (k) => (k === "?" ? "Inconnue" : k))} />
                  </div>
                  <div className={card}>
                    <h3 className={cardTitle}>Pays</h3>
                    <p className={`${cardSub} mb-4`}>Visiteurs par pays</p>
                    <BarList rows={breakdownBars(bd.country, countryLabel, 6)} />
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-4">
                  <div className={card}>
                    <h3 className={cardTitle}>Heures de visite</h3>
                    <p className={`${cardSub} mb-5`}>Visiteurs par heure (heure de Tunis)</p>
                    <div className="pl-6">
                      <Columns
                        height={120}
                        data={bd.hours.map((h) => ({ key: String(h.hour), value: h.visitors }))}
                        tickEvery={3}
                        label={(i) => `${bd.hours[i].hour}h`}
                        tooltip={(i) => `${bd.hours[i].hour}h–${bd.hours[i].hour + 1}h · ${bd.hours[i].visitors} visiteurs`}
                      />
                    </div>
                  </div>
                  <div className={card}>
                    <h3 className={cardTitle}>Jours de la semaine</h3>
                    <p className={`${cardSub} mb-5`}>Visiteurs cumulés par jour</p>
                    <div className="pl-6">
                      <Columns
                        height={120}
                        data={weekday.map((w) => ({ key: w.label, value: w.visitors }))}
                        tickEvery={1}
                        label={(i) => weekday[i].label}
                        tooltip={(i) => `${weekday[i].label} · ${weekday[i].visitors} visiteurs`}
                      />
                    </div>
                  </div>
                </div>

                {behaviour && <BehaviourView b={behaviour} />}
              </>
            ) : (
              <p className="text-xs text-brand-charcoal/50">
                Le détail (sources, appareils, lieux, heures) n&apos;est conservé que {DETAIL_RETENTION_DAYS} jours —
                choisissez une période plus récente pour le voir.
              </p>
            )}
          </div>
        )}
      </AudienceShell>
    </div>
  );
}
