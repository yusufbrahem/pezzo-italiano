"use client";

import { useEffect, useState } from "react";

// Schedule + override now live in the database (edited from /admin/hours),
// so the open/closed computation happens server-side — this hook just polls
// the small public endpoint that does it. Same signature and 60s cadence as
// before, so Contact.tsx/Footer.tsx need no changes for this part.
export function useIsOpenNow() {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/hours-status", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setOpen(data.open);
      } catch {
        // network hiccup — keep the previous value rather than flashing null
      }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return open;
}
