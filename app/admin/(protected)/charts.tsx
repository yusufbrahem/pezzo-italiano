import type { ReactNode } from "react";

// Shared admin charts (/admin/clients stats, /admin/audience). Pure HTML/CSS,
// server-renderable. Single-series throughout — one brand-green hue, so no
// legend is needed; each card's title names what's plotted. Every mark has a
// hover tooltip, and exact values are always available as text.

export const card = "bg-white rounded-xl border border-brand-green/10 p-5";
export const cardTitle = "text-sm font-semibold text-brand-charcoal";
export const cardSub = "text-xs text-brand-charcoal/45 mt-0.5";

export const nf = new Intl.NumberFormat("fr-FR");
const dayFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
export const fmtBucket = (ymd: string, long = false) =>
  (long ? weekdayFmt : dayFmt).format(new Date(`${ymd}T00:00:00Z`));

export const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

export function Stat({
  label,
  value,
  hint,
  delta,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  /** % change vs the previous period of the same length; null = no comparison possible */
  delta?: number | null;
}) {
  return (
    <div className={card}>
      <p className="text-xs text-brand-charcoal/50">{label}</p>
      <p className="text-2xl font-semibold text-brand-charcoal mt-1">{value}</p>
      {delta !== undefined && delta !== null && (
        <p
          className={`text-xs font-semibold mt-1 ${
            delta > 0 ? "text-green-700" : delta < 0 ? "text-red-600" : "text-brand-charcoal/45"
          }`}
        >
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "="} {delta > 0 ? "+" : ""}
          {delta} % <span className="font-normal text-brand-charcoal/40">vs période précédente</span>
        </p>
      )}
      {hint && <p className="text-xs text-brand-charcoal/45 mt-1">{hint}</p>}
    </div>
  );
}

export interface BarRow {
  key: string;
  label: string;
  value: number;
  valueText: ReactNode;
  title?: string;
}

/** Ranked horizontal bars, longest first, with the exact value beside each. */
export function BarList({ rows, numbered = true }: { rows: BarRow[]; numbered?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.key} className="group">
          <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
            <span className="min-w-0 truncate text-brand-charcoal">
              {numbered && <span className="text-brand-charcoal/35 tabular-nums mr-1.5">{i + 1}.</span>}
              {r.label}
            </span>
            <span className="flex-shrink-0 tabular-nums text-brand-charcoal/70">{r.valueText}</span>
          </div>
          <div className="h-2 bg-brand-green/5 rounded-r-[4px]" title={r.title}>
            <div
              className="h-full bg-brand-green-muted group-hover:bg-brand-green rounded-r-[4px] transition-colors"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Rounds an axis maximum up so both it and its half are clean numbers (4/2, 50/25, 100/50…). */
function niceCeil(max: number): number {
  if (max <= 10) return max % 2 === 0 ? max : max + 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  return [1, 2, 4, 5, 10].map((m) => m * pow).find((c) => c >= max) ?? 10 * pow;
}

/** Column chart with a hover tooltip per column and sparse x-axis ticks. */
export function Columns({
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
  const niceMax = niceCeil(Math.max(1, ...data.map((d) => d.value)));
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
