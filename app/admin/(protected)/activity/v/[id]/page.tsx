import { requireOwner } from "@/lib/auth/session";
import VersionView from "./VersionView";

export const metadata = { title: "Détail d'une modification" };

// Owner only: exactly what a change did to the site, and a one-click restore.
export default async function VersionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOwner();
  const { id } = await params;
  return <VersionView id={Number(id) || 0} />;
}
