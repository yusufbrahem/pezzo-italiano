"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackAdminPage } from "./activity/actions";

// Records each admin page a team member opens (owner-only history at
// /admin/activity). Fire-and-forget: never blocks or breaks navigation.
export default function ActivityPing() {
  const pathname = usePathname();
  useEffect(() => {
    trackAdminPage(pathname).catch(() => {});
  }, [pathname]);
  return null;
}
