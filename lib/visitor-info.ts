// Turns a request's User-Agent / referrer into the coarse, anonymous labels
// stored by app/api/track (device, OS, browser, traffic source). Pure — no I/O.

const BOT_RE =
  /bot|crawl|spider|slurp|mediapartners|headless|lighthouse|pagespeed|gtmetrix|preview|facebookexternalhit|facebookcatalog|whatsapp\/|telegram|discord|skype|python|curl|wget|axios|node-fetch|go-http|java\/|okhttp|phantom|puppeteer|playwright|selenium/i;

export function isBot(ua: string): boolean {
  return ua.length < 20 || BOT_RE.test(ua);
}

export function parseDevice(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android|IEMobile|Opera Mini/i.test(ua)) return "mobile";
  return "desktop";
}

export function parseOs(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Autre";
}

export function parseBrowser(ua: string): string {
  if (/Instagram/i.test(ua)) return "Instagram (in-app)";
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return "Facebook (in-app)";
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return "TikTok (in-app)";
  if (/Snapchat/i.test(ua)) return "Snapchat (in-app)";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
  if (/FxiOS|Firefox/i.test(ua)) return "Firefox";
  if (/CriOS|Chrome/i.test(ua)) return "Chrome";
  if (/Safari/i.test(ua)) return "Safari";
  return "Autre";
}

const REFERRER_SOURCES: [RegExp, string][] = [
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(facebook\.com|fb\.me|fb\.com|messenger\.com)$/, "facebook"],
  [/(^|\.)(wa\.me|whatsapp\.com)$/, "whatsapp"],
  [/(^|\.)(tiktok\.com)$/, "tiktok"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "x"],
  [/(^|\.)(snapchat\.com)$/, "snapchat"],
  [/(^|\.)(tripadvisor\.[a-z.]+)$/, "tripadvisor"],
];

/**
 * Where the visit came from. In-app browsers (Instagram, Facebook…) usually
 * send no referrer at all, so their User-Agent is checked first; then an
 * explicit ?utm_source=; then the referrer's domain.
 */
export function parseSource(opts: {
  ua: string;
  referrer: string | null;
  utmSource: string | null;
  ownHost: string | null;
  standalone: boolean;
}): string {
  const utm = opts.utmSource?.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);
  if (utm) return utm === "ig" ? "instagram" : utm === "fb" ? "facebook" : utm;

  if (/Instagram/i.test(opts.ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(opts.ua)) return "facebook";
  if (/TikTok|musical_ly|BytedanceWebview/i.test(opts.ua)) return "tiktok";
  if (/Snapchat/i.test(opts.ua)) return "snapchat";

  if (opts.referrer) {
    try {
      const host = new URL(opts.referrer).hostname.replace(/^www\./, "").toLowerCase();
      const own = opts.ownHost?.replace(/^www\./, "").toLowerCase();
      if (host && host !== own) {
        const known = REFERRER_SOURCES.find(([re]) => re.test(host));
        return known ? known[1] : host.slice(0, 60);
      }
    } catch {
      // unparsable referrer → treat as direct
    }
  }
  return opts.standalone ? "app" : "direct";
}

export const SOURCE_LABELS: Record<string, string> = {
  direct: "Accès direct / lien",
  app: "Appli (écran d'accueil)",
  google: "Google",
  bing: "Bing",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  x: "X (Twitter)",
  snapchat: "Snapchat",
  tripadvisor: "Tripadvisor",
};
