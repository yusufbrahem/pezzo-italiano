import Link from "next/link";
import { after } from "next/server";
import { ROLE_LABELS, type Role } from "@/lib/auth/roles";
import { ACTIVITY_ACTIONS, ACTIVITY_GROUPS, isActivityAction, type ActivityGroup } from "@/lib/activity-actions";
import {
  ACTIVITY_PAGE_SIZE,
  ACTIVITY_PERIODS,
  getMembersActivity,
  listActivity,
  purgeOldActivity,
  type ActivityFilters,
  type ActivityPeriod,
  type ActivityRow,
} from "@/lib/data/activity";
import { purgeOldVersions } from "@/lib/data/versions";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Tunis",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const fmt = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "—");

const DEVICE: Record<string, string> = { mobile: "📱 Téléphone", tablet: "Tablette", desktop: "💻 Ordinateur" };

// Readable names for pages and contact fields in the history.
const PAGE_NAMES: [string, string][] = [
  ["/admin/menu/new", "Menu — ajout d'un article"],
  ["/admin/menu/", "Menu — modification d'un article"],
  ["/admin/menu", "Menu"],
  ["/admin/pricing", "Tarifs"],
  ["/admin/clients", "Clients"],
  ["/admin/audience", "Audience"],
  ["/admin/contact", "Contact"],
  ["/admin/hours", "Horaires"],
  ["/admin/reviews", "Avis Google"],
  ["/admin/approvals", "Validations"],
  ["/admin/staff", "Équipe"],
  ["/admin/activity", "Historique"],
  ["/admin", "Tableau de bord"],
];
const pageName = (p: string) => PAGE_NAMES.find(([prefix]) => p === prefix || p.startsWith(prefix))?.[1] ?? p;

const CONTACT_FIELDS: Record<string, string> = {
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

function parseFilters(sp: Record<string, string | undefined>): ActivityFilters {
  const group = sp.group && sp.group in ACTIVITY_GROUPS ? (sp.group as ActivityGroup) : null;
  const period = sp.period && sp.period in ACTIVITY_PERIODS ? (sp.period as ActivityPeriod) : "7d";
  const userId = sp.user && /^[0-9a-f-]{36}$/i.test(sp.user) ? sp.user : null;
  return { userId, group, period, pages: sp.pages === "1", page: Math.max(1, Number(sp.page) || 1) };
}

function href(f: ActivityFilters, patch: Partial<ActivityFilters>) {
  const n = { ...f, page: 1, ...patch };
  const q = new URLSearchParams();
  if (n.userId) q.set("user", n.userId);
  if (n.group) q.set("group", n.group);
  if (n.period !== "7d") q.set("period", n.period);
  if (n.pages) q.set("pages", "1");
  if (n.page > 1) q.set("page", String(n.page));
  const s = q.toString();
  return `/admin/activity${s ? `?${s}` : ""}`;
}

function Chip({ active, to, children }: { active: boolean; to: string; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
        active
          ? "bg-brand-green text-brand-white border-brand-green"
          : "bg-white text-brand-charcoal/75 border-brand-green/15 hover:border-brand-gold/50"
      }`}
    >
      {children}
    </Link>
  );
}

/** One line of extra detail under the action — built only from known, server-written fields. */
function Details({ row }: { row: ActivityRow }) {
  const d = (row.details ?? {}) as Record<string, unknown>;
  const parts: React.ReactNode[] = [];
  if (row.action === "page_view" && row.target) parts.push(pageName(row.target));
  else if (row.target) parts.push(<strong key="t" className="font-medium text-brand-charcoal">{row.target}</strong>);
  if (row.identifier) parts.push(`identifiant saisi : « ${row.identifier} »`);
  if (typeof d.reason === "string" && row.action.startsWith("login")) parts.push(d.reason);
  if (typeof d.attempts === "number") parts.push(`${d.attempts} essai${d.attempts > 1 ? "s" : ""}`);
  if (Array.isArray(d.changed) && d.changed.length) {
    const names = (d.changed as string[]).map((c) => (row.action === "contact_update" ? CONTACT_FIELDS[c] ?? c : c));
    parts.push(`modifié : ${names.join(", ")}`);
  }
  if (row.action === "staff_role" && typeof d.from === "string" && typeof d.to === "string") {
    parts.push(`${ROLE_LABELS[d.from as Role] ?? d.from} → ${ROLE_LABELS[d.to as Role] ?? d.to}`);
  }
  if (row.action === "staff_create" && typeof d.role === "string") parts.push(`rôle ${ROLE_LABELS[d.role as Role] ?? d.role}`);
  if (row.action === "hours_override" && typeof d.reason === "string" && d.reason) parts.push(`motif : ${d.reason}`);
  if (typeof d.until === "string") parts.push(`jusqu'au ${fmt(d.until)}`);
  if (typeof d.note === "string" && d.note) parts.push(`note : « ${d.note} »`);
  if (typeof d.rows === "number") parts.push(`${d.rows} commande${d.rows > 1 ? "s" : ""}`);
  return (
    <span className="text-brand-charcoal/70">
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && " · "}
          {p}
        </span>
      ))}
      {d.pending === true && (
        <span className="ml-1.5 inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
          envoyé pour validation
        </span>
      )}
      {typeof d.version === "number" && (
        <Link href={`/admin/activity/v/${d.version}`} className="ml-2 font-semibold text-brand-green hover:text-brand-gold-deep whitespace-nowrap">
          Voir ce qui a changé →
        </Link>
      )}
    </span>
  );
}

const ACTION_TONE: Partial<Record<string, string>> = {
  login_failed: "text-red-700",
  login_locked: "text-red-700 font-semibold",
  order_delete: "text-red-700",
  menu_delete: "text-red-700",
  staff_deactivate: "text-red-700",
  change_approve: "text-green-800",
  login: "text-brand-green",
};

/** The history itself — the owner-only check lives in page.tsx. */
export default async function ActivityView({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const f = parseFilters(searchParams);
  const [members, { rows, total }] = await Promise.all([getMembersActivity(), listActivity(f)]);
  after(() => purgeOldActivity().catch((err) => console.error("[activity] purge failed:", err)));
  after(() => purgeOldVersions().catch((err) => console.error("[versions] purge failed:", err)));
  const pages = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE));

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-2">Historique de l&apos;équipe</h1>
      <p className="text-sm text-brand-charcoal/60 mb-6 max-w-2xl">
        Connexions, déconnexions et tout ce que chaque membre fait dans l&apos;administration. Visible uniquement par
        vous. Conservé 1 an.
      </p>

      {/* Per-member summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {members.map((m) => (
          <Link
            key={m.id}
            href={href(f, { userId: f.userId === m.id ? null : m.id })}
            className={`block bg-white rounded-xl border p-4 transition-colors ${
              f.userId === m.id ? "border-brand-gold ring-1 ring-brand-gold" : "border-brand-green/10 hover:border-brand-gold/40"
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-brand-charcoal">{m.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-semibold uppercase">
                {ROLE_LABELS[m.role]}
              </span>
              {!m.isActive && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold uppercase">Désactivé</span>
              )}
            </div>
            <dl className="mt-2 text-xs text-brand-charcoal/70 space-y-0.5">
              <div>
                <dt className="inline">Dernière connexion : </dt>
                <dd className="inline font-medium text-brand-charcoal">{fmt(m.lastLogin)}</dd>
              </div>
              <div>
                <dt className="inline">Dernière activité : </dt>
                <dd className="inline font-medium text-brand-charcoal">{fmt(m.lastSeen)}</dd>
              </div>
              <div>
                <dt className="inline">Actions (7 jours) : </dt>
                <dd className="inline font-medium text-brand-charcoal">{m.actions7d}</dd>
                {m.failed7d > 0 && <span className="ml-2 text-red-700 font-semibold">⚠ {m.failed7d} échec{m.failed7d > 1 ? "s" : ""} de connexion</span>}
              </div>
            </dl>
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-2.5 mb-5">
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          <Chip active={!f.group} to={href(f, { group: null })}>Tout</Chip>
          {(Object.keys(ACTIVITY_GROUPS) as ActivityGroup[]).map((g) => (
            <Chip key={g} active={f.group === g} to={href(f, { group: g })}>
              {ACTIVITY_GROUPS[g]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(ACTIVITY_PERIODS) as ActivityPeriod[]).map((p) => (
            <Chip key={p} active={f.period === p} to={href(f, { period: p })}>
              {ACTIVITY_PERIODS[p]}
            </Chip>
          ))}
          {f.group !== "navigation" && (
            <Link href={href(f, { pages: !f.pages })} className="ml-1 text-xs text-brand-charcoal/70 hover:text-brand-green inline-flex items-center gap-1.5">
              <span
                className={`inline-block w-3.5 h-3.5 rounded border ${f.pages ? "bg-brand-green border-brand-green" : "border-brand-charcoal/40"}`}
                aria-hidden
              />
              Inclure les pages consultées
            </Link>
          )}
          {f.userId && (
            <Link href={href(f, { userId: null })} className="ml-auto text-xs font-semibold text-brand-green hover:underline">
              ✕ Tous les membres
            </Link>
          )}
        </div>
      </div>

      {/* Timeline */}
      {rows.length === 0 ? (
        <p className="text-sm text-brand-charcoal/60 bg-white rounded-xl border border-brand-green/10 px-4 py-8 text-center">
          Aucune activité pour ces filtres.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-brand-green/10 divide-y divide-brand-green/8">
          {rows.map((r) => {
            const meta = isActivityAction(r.action) ? ACTIVITY_ACTIONS[r.action] : null;
            const where = [r.device ? DEVICE[r.device] ?? r.device : null, r.browser, r.os, [r.city, r.country].filter(Boolean).join(", ") || null]
              .filter(Boolean)
              .join(" · ");
            return (
              <div key={r.id} className="px-4 py-3 text-sm grid sm:grid-cols-[9.5rem_1fr] gap-x-4 gap-y-0.5">
                <time className="text-xs text-brand-charcoal/60 sm:pt-0.5 tabular-nums">{fmt(r.at)}</time>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-brand-charcoal">{r.userName ?? (r.identifier ? "Inconnu" : "—")}</span>
                    {r.userRole && <span className="text-[10px] text-brand-charcoal/60 uppercase">{ROLE_LABELS[r.userRole]}</span>}
                    <span className={ACTION_TONE[r.action] ?? "text-brand-charcoal"}>{meta?.label ?? r.action}</span>
                  </div>
                  <p className="text-xs mt-0.5">
                    <Details row={r} />
                  </p>
                  {where && <p className="text-[11px] text-brand-charcoal/60 mt-0.5">{where}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-brand-charcoal/60">
            {total} événements · page {f.page} / {pages}
          </span>
          <div className="flex gap-2">
            {f.page > 1 && (
              <Link href={href(f, { page: f.page - 1 })} className="px-3 py-1.5 rounded-lg border border-brand-green/15 hover:border-brand-gold/50">
                ← Plus récents
              </Link>
            )}
            {f.page < pages && (
              <Link href={href(f, { page: f.page + 1 })} className="px-3 py-1.5 rounded-lg border border-brand-green/15 hover:border-brand-gold/50">
                Plus anciens →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
