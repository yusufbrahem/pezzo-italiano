import { requireOwner } from "@/lib/auth/session";
import ActivityView from "./ActivityView";

export const metadata = { title: "Historique" };

// Team activity history — the owner only (staff / administrators are redirected).
export default async function ActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireOwner();
  return <ActivityView searchParams={await searchParams} />;
}
