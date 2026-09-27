// Display helpers shared by the /admin/clients server and client components.
// Always formatted in Tunis time, so server and browser render identically.

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Tunis",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const longDateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Tunis",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));
export const formatLongDateTime = (iso: string) => longDateTimeFmt.format(new Date(iso));

/** 21653086089 → +216 53 086 089 */
export function formatPhone(phone: string) {
  const m = phone.match(/^216(\d{2})(\d{3})(\d{3})$/);
  return m ? `+216 ${m[1]} ${m[2]} ${m[3]}` : `+${phone}`;
}
