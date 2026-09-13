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

/**
 * The manual override wins whenever it's active and not expired; otherwise
 * falls back to the regular weekly schedule (Tunis local time).
 */
export function computeIsOpen(
  schedule: HoursSchedule,
  override: HoursOverride,
  now: Date = new Date()
): OpenStatus {
  if (override.active && (!override.expiresAt || new Date(override.expiresAt) > now)) {
    return { open: override.mode === "open", source: "override", reason: override.reason };
  }

  const { weekday, minutes } = tunisNow(now);
  const day = schedule[weekday];
  if (!day || day.closed) return { open: false, source: "schedule", reason: null };

  const open = minutes >= toMinutes(day.opens) && minutes < toMinutes(day.closes);
  return { open, source: "schedule", reason: null };
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
