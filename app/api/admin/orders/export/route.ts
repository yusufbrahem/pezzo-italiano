import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { getOrdersForExport } from "@/lib/data/orders";
import { buildOrdersWorkbook } from "@/lib/orders-export";
import { logActivity } from "@/lib/data/activity";
import { parseOrderFilters, tunisToday } from "@/lib/orders-filters";

// Excel export of customer orders for /admin/clients.
//   ?scope=all      → every order ever recorded
//   ?scope=filtered → exactly the current table filters (same query params)
//
// Owner-only: this is a bulk download of every customer's name and phone.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) return new NextResponse("Non authentifié", { status: 401 });
  if (session.role !== "owner") return new NextResponse("Réservé au propriétaire", { status: 403 });

  const params = req.nextUrl.searchParams;
  const filters = params.get("scope") === "filtered" ? parseOrderFilters(params) : null;

  try {
    const orders = await getOrdersForExport(filters);
    await logActivity({ userId: session.userId, action: "orders_export", target: filters ? "Sélection filtrée" : "Toutes les commandes", details: { rows: orders.length } });
    const file = await buildOrdersWorkbook(orders, filters);
    const name = `pezzo-commandes${filters ? "-selection" : ""}-${tunisToday()}.xlsx`;
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[orders export] failed:", err);
    return new NextResponse("Export indisponible — réessayez dans un instant.", { status: 503 });
  }
}
