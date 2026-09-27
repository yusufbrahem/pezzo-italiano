export interface DaySchedule {
  opens: string; // "HH:MM"
  closes: string; // "HH:MM"
  closed: boolean;
}

export type HoursSchedule = Record<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun", DaySchedule>;

export interface HoursOverride {
  active: boolean;
  mode: "open" | "closed";
  reason: string | null;
  expiresAt: string | null; // ISO timestamp, null = stays until manually toggled off
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function tunisNow(now: Date): { weekday: keyof HoursSchedule; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Tunis",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const weekday = (parts.find((p) => p.type === "weekday")?.value ?? "Mon") as keyof HoursSchedule;
  const hour = Number(parts.find((p) => p.type === "hour")?.value) % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value);
  return { weekday, minutes: hour * 60 + minute };
}

export interface OpenStatus {
  open: boolean;
  source: "override" | "schedule";
  reason: string | null;
}

const WEEK: (keyof HoursSchedule)[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** A closing time at or before the opening time means "closes after midnight". */
export function closesAfterMidnight(day: DaySchedule): boolean {
  return toMinutes(day.closes) <= toMinutes(day.opens);
}

export function isOverrideExpired(override: HoursOverride, now: Date = new Date()): boolean {
  return override.expiresAt !== null && new Date(override.expiresAt) <= now;
}

/**
 * The manual override wins whenever it's active and not expired; otherwise
 * falls back to the regular weekly schedule (Tunis local time). A day that
 * closes after midnight (e.g. 11:00 → 01:00) stays open into the early hours
 * of the next day.
 */
export function computeIsOpen(
  schedule: HoursSchedule,
  override: HoursOverride,
  now: Date = new Date()
): OpenStatus {
  if (override.active && !isOverrideExpired(override, now)) {
    return { open: override.mode === "open", source: "override", reason: override.reason };
  }

  const { weekday, minutes } = tunisNow(now);
  const today = schedule[weekday];
  const yesterday = schedule[WEEK[(WEEK.indexOf(weekday) + 6) % 7]];

  const openToday =
    !!today &&
    !today.closed &&
    minutes >= toMinutes(today.opens) &&
    (closesAfterMidnight(today) || minutes < toMinutes(today.closes));
  const openFromYesterday =
    !!yesterday && !yesterday.closed && closesAfterMidnight(yesterday) && minutes < toMinutes(yesterday.closes);

  return { open: openToday || openFromYesterday, source: "schedule", reason: null };
}

// ── <input type="datetime-local"> ⇄ ISO, always in Tunis time ─────────────
// A datetime-local value has no timezone. Interpreting it with `new Date()`
// uses the *server's* zone (UTC on Vercel) — which made "revenir à 22:00"
// actually expire at 23:00 Tunis time. These pin it to Africa/Tunis.

function tunisWallClockMs(instant: Date): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Tunis",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .map((x) => [x.type, x.value])
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
}

/** "2026-09-14T22:00" (Tunis) → ISO instant, or null if not a valid value. */
export function tunisLocalInputToIso(local: string): string | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const offset = tunisWallClockMs(new Date(asUtc)) - asUtc; // +1h for Tunis
  return new Date(asUtc - offset).toISOString();
}

/** ISO instant → "2026-09-14T22:00" in Tunis time, for the input's value. */
export function isoToTunisLocalInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(tunisWallClockMs(new Date(iso))).toISOString().slice(0, 16);
}

const DAY_NAMES_EN: Record<keyof HoursSchedule, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

/**
 * Groups consecutive days with identical hours into schema.org
 * OpeningHoursSpecification entries, for the JSON-LD in app/layout.tsx.
 * Deliberately reflects the regular posted schedule only — never the live
 * "exceptionally open" override, since search engines cache this.
 */
export function buildOpeningHoursSpecification(schedule: HoursSchedule) {
  const order: (keyof HoursSchedule)[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const groups: { days: (keyof HoursSchedule)[]; day: DaySchedule }[] = [];

  for (const key of order) {
    const day = schedule[key];
    if (day.closed) continue;
    const last = groups[groups.length - 1];
    if (last && last.day.opens === day.opens && last.day.closes === day.closes) {
      last.days.push(key);
    } else {
      groups.push({ days: [key], day });
    }
  }

  return groups.map(({ days, day }) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: days.map((d) => DAY_NAMES_EN[d]),
    opens: day.opens,
    closes: day.closes,
  }));
}

const DAY_LABELS_FR: Record<keyof HoursSchedule, string> = {
  Mon: "Lundi", Tue: "Mardi", Wed: "Mercredi", Thu: "Jeudi",
  Fri: "Vendredi", Sat: "Samedi", Sun: "Dimanche",
};

/**
 * Groups consecutive days with identical hours into ranges for a compact
 * display, e.g. "Lundi – Vendredi · 11h00 – 23h00".
 */
export function formatScheduleForDisplay(schedule: HoursSchedule): { days: string; time: string }[] {
  const order: (keyof HoursSchedule)[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const groups: { days: (keyof HoursSchedule)[]; day: DaySchedule }[] = [];

  for (const key of order) {
    const day = schedule[key];
    const last = groups[groups.length - 1];
    if (last && last.day.opens === day.opens && last.day.closes === day.closes && last.day.closed === day.closed) {
      last.days.push(key);
    } else {
      groups.push({ days: [key], day });
    }
  }

  return groups.map(({ days, day }) => {
    const label = days.length > 1
      ? `${DAY_LABELS_FR[days[0]]} – ${DAY_LABELS_FR[days[days.length - 1]]}`
      : DAY_LABELS_FR[days[0]];
    const time = day.closed
      ? "Fermé"
      : `${day.opens.replace(":", "h")} – ${day.closes.replace(":", "h")}`;
    return { days: label, time };
  });
}
