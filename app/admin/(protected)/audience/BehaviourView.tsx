import type { AudienceBehaviour } from "@/lib/data/audience";
import { formatDT } from "@/lib/orders-filters";
import { BarList, Stat, card, cardSub, cardTitle, nf, pct } from "../charts";

const SECTION_ORDER: [string, string][] = [
  ["hero", "Haut de page (accueil)"],
  ["histoire", "Notre histoire"],
  ["menu", "Menu"],
  ["signatures", "Signatures"],
  ["avis", "Avis clients"],
  ["galerie", "Galerie photos"],
  ["contact", "Contact & plan"],
];

const STEP_LABELS: Record<string, string> = {
  opened: "Ont ouvert le formulaire, sans choisir d'article",
  items: "Ont choisi des articles, sans remplir nom/téléphone",
  details: "Ont tout rempli, sans envoyer",
  address: "Ont tout rempli, adresse comprise, sans envoyer",
};

const SCREEN_LABELS: Record<string, string> = {
  phone: "📱 Petit écran (téléphone)",
  tablet: "Tablette",
  laptop: "💻 Ordinateur portable",
  large: "🖥 Grand écran",
  "?": "Inconnu",
};
const NET_LABELS: Record<string, string> = { "4g": "4G / Wi-Fi rapide", "3g": "3G", "2g": "2G", "slow-2g": "Très lente", "?": "Non communiqué (iPhone…)" };
const DEVICE_LABELS: Record<string, string> = { mobile: "📱 Téléphone", tablet: "Tablette", desktop: "💻 Ordinateur" };
const CATEGORY_ICONS: Record<string, string> = { pizza: "🍕", desserts: "🍮", boissons: "🥤", supplements: "➕", partager: "🫱" };

const languageNames = new Intl.DisplayNames(["fr"], { type: "language" });
const languageLabel = (code: string) => {
  if (code === "?") return "Inconnue";
  try {
    const name = languageNames.of(code) ?? code;
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return code;
  }
};

function duration(sec: number) {
  if (sec < 60) return `${sec} s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}
const seconds = (ms: number | null) =>
  ms === null ? "—" : `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(ms / 1000)} s`;

function simpleBars(rows: { key: string; value: number }[], total: number, label: (k: string) => string, limit = 6) {
  return rows.slice(0, limit).map((r) => ({
    key: r.key,
    label: label(r.key),
    value: r.value,
    valueText: (
      <>
        <span className="font-semibold text-brand-charcoal">{nf.format(r.value)}</span>
        {total > 0 && <span className="text-brand-charcoal/40"> · {pct(r.value, total)} %</span>}
      </>
    ),
  }));
}

export default function BehaviourView({ b }: { b: AudienceBehaviour }) {
  const e = b.engagement;
  const abandoned = b.abandon.steps.reduce((s, x) => s + x.count, 0);
  const dishes = b.dishes.filter((d) => d.adds > 0 || d.orderedQty > 0).slice(0, 12);

  return (
    <div className="space-y-5">
      <h2 className="font-serif text-xl font-bold text-brand-green pt-4">Comportement sur le site</h2>

      {/* Engagement */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat
          label="Temps actif médian"
          value={e.measured > 0 ? duration(e.medianSec) : "—"}
          hint="Onglet visible et visiteur actif (la moitié reste plus longtemps)"
        />
        <Stat
          label="Défilement moyen"
          value={e.measured > 0 ? `${e.avgScroll} %` : "—"}
          hint="Jusqu'où les visiteurs descendent dans la page"
        />
        <Stat
          label="Départs rapides"
          value={e.measured > 0 ? `${pct(e.quickExits, e.measured)} %` : "—"}
          hint="Visiteurs restés moins de 10 s actifs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 [&>*]:min-w-0">
        <div className={card}>
          <h3 className={cardTitle}>Sections vues</h3>
          <p className={`${cardSub} mb-4`}>Part des visiteurs qui ont réellement vu chaque partie, dans l&apos;ordre de la page</p>
          <BarList
            numbered={false}
            rows={SECTION_ORDER.map(([id, label]) => {
              const v = b.sections.find((s) => s.id === id)?.visitors ?? 0;
              return {
                key: id,
                label,
                value: v,
                valueText: (
                  <>
                    <span className="font-semibold text-brand-charcoal">{pct(v, b.visitors)} %</span>
                    <span className="text-brand-charcoal/40"> · {nf.format(v)}</span>
                  </>
                ),
              };
            })}
          />
        </div>

        <div className={card}>
          <h3 className={cardTitle}>Abandons du formulaire de commande</h3>
          <p className={`${cardSub} mb-4`}>Visiteurs ayant ouvert le formulaire puis l&apos;ayant quitté sans envoyer</p>
          {abandoned === 0 ? (
            <p className="text-sm text-brand-charcoal/45">Aucun abandon enregistré sur cette période.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-5 text-center">
                <div>
                  <p className="text-lg sm:text-2xl font-semibold text-brand-charcoal">{nf.format(abandoned)}</p>
                  <p className="text-[11px] text-brand-charcoal/45">abandons</p>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-semibold text-brand-charcoal">{pct(b.abandon.submits, b.abandon.submits + abandoned)} %</p>
                  <p className="text-[11px] text-brand-charcoal/45">vont jusqu&apos;à l&apos;envoi</p>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-semibold text-brand-charcoal break-words">{formatDT(Math.round(b.abandon.totalCartValue))}</p>
                  <p className="text-[11px] text-brand-charcoal/45">laissés dans des paniers</p>
                </div>
              </div>
              <BarList
                numbered={false}
                rows={b.abandon.steps.map((s) => ({
                  key: s.step,
                  label: STEP_LABELS[s.step] ?? s.step,
                  value: s.count,
                  valueText: (
                    <>
                      <span className="font-semibold text-brand-charcoal">{nf.format(s.count)}</span>
                      {s.avgCart > 0 && <span className="text-brand-charcoal/40"> · panier moy. {formatDT(Math.round(s.avgCart))}</span>}
                    </>
                  ),
                }))}
              />
            </>
          )}
        </div>
      </div>

      {/* Dish interest */}
      <div className={card}>
        <h3 className={cardTitle}>Intérêt pour les plats</h3>
        <p className={`${cardSub} mb-4`}>
          Unités ajoutées au panier sur le site, comparées aux unités réellement commandées. Un plat souvent ajouté mais
          peu commandé mérite un œil (prix, photo, description…).
        </p>
        {dishes.length === 0 ? (
          <p className="text-sm text-brand-charcoal/45">Pas encore d&apos;ajout au panier sur cette période.</p>
        ) : (
          <div>
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-brand-charcoal/45 border-b border-brand-green/10">
                  <th className="py-2 font-semibold">Plat</th>
                  <th className="py-2 pl-2 font-semibold text-right">Ajoutés</th>
                  <th className="py-2 pl-2 font-semibold text-right">Commandés</th>
                  <th className="py-2 pl-2 font-semibold text-right">Taux</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map((d) => {
                  const rate = d.adds > 0 ? pct(d.orderedQty, d.adds) : null;
                  const weak = rate !== null && d.adds >= 5 && rate < 40;
                  return (
                    <tr key={d.id} className="border-b border-brand-green/5 last:border-0">
                      <td className="py-2 pr-3">
                        <span className="mr-1.5" aria-hidden>
                          {CATEGORY_ICONS[d.category ?? ""] ?? "•"}
                        </span>
                        {d.name}
                      </td>
                      <td className="py-2 pl-2 text-right tabular-nums whitespace-nowrap">
                        {nf.format(d.adds)}
                        <span className="hidden sm:inline text-brand-charcoal/35 text-xs"> ({d.addVisitors} pers.)</span>
                      </td>
                      <td className="py-2 pl-2 text-right tabular-nums">{nf.format(d.orderedQty)}</td>
                      <td className={`py-2 pl-2 text-right tabular-nums font-semibold whitespace-nowrap ${weak ? "text-amber-700" : "text-brand-charcoal/70"}`}>
                        {rate === null ? "—" : `${Math.min(rate, 999)} %`}
                        {weak && <span title="Souvent ajouté, peu commandé"> ⚠</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Menu photo viewer */}
      <div className={card}>
        <h3 className={cardTitle}>Photos des pizzas regardées</h3>
        <p className={`${cardSub} mb-4`}>
          Quand un visiteur fait défiler les photos d&apos;un plat dans le menu (en glissant sur la carte ou en l&apos;ouvrant
          en grand) : combien de fois, et combien de ses photos il a regardées.
        </p>
        {b.itemPhotos.length === 0 ? (
          <p className="text-sm text-brand-charcoal/45">Aucune photo de plat ouverte sur cette période.</p>
        ) : (
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-brand-charcoal/45 border-b border-brand-green/10">
                <th className="py-2 font-semibold">Plat</th>
                <th className="py-2 pl-2 font-semibold text-right">Consultations</th>
                <th className="py-2 pl-2 font-semibold text-right">Photos vues</th>
                <th className="py-2 pl-2 font-semibold text-right">
                  <span className="hidden sm:inline">Toutes vues</span>
                  <span className="sm:hidden">Toutes</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {b.itemPhotos.slice(0, 15).map((p, i) => (
                <tr key={p.id} className="border-b border-brand-green/5 last:border-0">
                  <td className="py-2 pr-3">
                    <span className="text-brand-charcoal/35 tabular-nums mr-1.5">{i + 1}.</span>
                    {p.name}
                  </td>
                  <td className="py-2 pl-2 text-right tabular-nums whitespace-nowrap">
                    <span className="font-semibold">{nf.format(p.opens)}</span>
                    <span className="hidden sm:inline text-brand-charcoal/35 text-xs"> ({p.visitors} pers.)</span>
                  </td>
                  <td className="py-2 pl-2 text-right tabular-nums whitespace-nowrap">
                    {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(p.avgSeen)}
                    <span className="text-brand-charcoal/40"> / {p.total}</span>
                  </td>
                  <td className="py-2 pl-2 text-right tabular-nums text-brand-charcoal/70">{pct(p.sawAll, p.opens)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 [&>*]:min-w-0">
        <div className={card}>
          <h3 className={cardTitle}>Photos de la galerie ouvertes</h3>
          <p className={`${cardSub} mb-4`}>Quelles photos donnent envie d&apos;en voir plus</p>
          {b.gallery.length === 0 ? (
            <p className="text-sm text-brand-charcoal/45">Aucune photo ouverte sur cette période.</p>
          ) : (
            <BarList
              rows={b.gallery.slice(0, 8).map((g) => ({
                key: g.key,
                label: g.key === "tout" ? "Photos variées" : g.key.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()),
                value: g.opens,
                valueText: <span className="font-semibold text-brand-charcoal">{nf.format(g.opens)}</span>,
              }))}
            />
          )}
        </div>
        <div className={card}>
          <h3 className={cardTitle}>Onglets du menu consultés</h3>
          <p className={`${cardSub} mb-4`}>Clics sur les catégories du menu (la 1re est affichée d&apos;office)</p>
          {b.menuTabs.length === 0 ? (
            <p className="text-sm text-brand-charcoal/45">Aucun clic sur les onglets sur cette période.</p>
          ) : (
            <BarList
              rows={b.menuTabs.slice(0, 8).map((m) => ({
                key: m.key,
                label: `${CATEGORY_ICONS[m.key] ?? ""} ${m.key.charAt(0).toUpperCase()}${m.key.slice(1)}`.trim(),
                value: m.views,
                valueText: <span className="font-semibold text-brand-charcoal">{nf.format(m.views)}</span>,
              }))}
            />
          )}
        </div>
      </div>

      {/* Setup & speed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 [&>*]:min-w-0">
        <div className={card}>
          <h3 className={cardTitle}>Langue et écran</h3>
          <p className={`${cardSub} mb-4`}>Réglages des navigateurs des visiteurs</p>
          <p className="text-xs font-semibold text-brand-charcoal/50 mb-3">Langue du téléphone / navigateur</p>
          <BarList numbered={false} rows={simpleBars(b.setup.lang.map((l) => ({ key: l.key, value: l.visitors })), b.visitors, languageLabel, 5)} />
          <p className="text-xs font-semibold text-brand-charcoal/50 mt-6 mb-3">Taille d&apos;écran</p>
          <BarList numbered={false} rows={simpleBars(b.setup.screen.map((l) => ({ key: l.key, value: l.visitors })), b.visitors, (k) => SCREEN_LABELS[k] ?? k)} />
          {b.setup.darkKnown > 0 && (
            <p className="text-xs text-brand-charcoal/55 mt-5">
              🌙 {pct(b.setup.darkVisitors, b.setup.darkKnown)} % utilisent le mode sombre sur leur appareil.
            </p>
          )}
        </div>

        <div className={card}>
          <h3 className={cardTitle}>Vitesse du site</h3>
          <p className={`${cardSub} mb-4`}>
            Temps médian de chargement vécu par les visiteurs. Affichage principal : sous 2,5 s = bon, au-delà de 4 s =
            lent.
          </p>
          {b.speed.length === 0 ? (
            <p className="text-sm text-brand-charcoal/45">Pas encore de mesure sur cette période.</p>
          ) : (
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-brand-charcoal/45 border-b border-brand-green/10">
                  <th className="py-2 font-semibold">Appareil</th>
                  <th className="py-2 font-semibold text-right">Affichage principal</th>
                  <th className="py-2 font-semibold text-right">Page complète</th>
                </tr>
              </thead>
              <tbody>
                {b.speed.map((s) => {
                  const lcpClass =
                    s.medianLcp === null ? "" : s.medianLcp <= 2500 ? "text-green-700" : s.medianLcp <= 4000 ? "text-amber-700" : "text-red-600";
                  return (
                    <tr key={s.device} className="border-b border-brand-green/5 last:border-0">
                      <td className="py-2">
                        {DEVICE_LABELS[s.device] ?? s.device}
                        <span className="text-brand-charcoal/35 text-xs"> ({s.samples})</span>
                      </td>
                      <td className={`py-2 text-right tabular-nums font-semibold ${lcpClass}`}>{seconds(s.medianLcp)}</td>
                      <td className="py-2 text-right tabular-nums text-brand-charcoal/70">{seconds(s.medianLoad)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <p className="text-xs font-semibold text-brand-charcoal/50 mb-3">Connexion</p>
          <BarList numbered={false} rows={simpleBars(b.setup.net.map((l) => ({ key: l.key, value: l.visitors })), b.visitors, (k) => NET_LABELS[k] ?? k, 5)} />
        </div>
      </div>
    </div>
  );
}
