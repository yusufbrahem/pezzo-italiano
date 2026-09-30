"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOwner, requireSession } from "@/lib/auth/session";
import { deleteOrder, setOrderConfirmed, setReviewRequested } from "@/lib/data/orders";
import { deleteDraft } from "@/lib/data/order-drafts";
import { sql } from "@/lib/db";
import { logActivity } from "@/lib/data/activity";

const OrderId = z.string().uuid();

// "Nom (téléphone)" of an order / draft, for the activity history.
async function who(table: "orders" | "order_drafts", id: string): Promise<string | null> {
  const rows =
    table === "orders"
      ? await sql`SELECT customer_name, phone FROM orders WHERE id = ${id}`
      : await sql`SELECT customer_name, phone FROM order_drafts WHERE id = ${id}`;
  return rows[0] ? `${rows[0].customer_name} (${rows[0].phone})` : null;
}

function refresh() {
  revalidatePath("/admin/clients");
  revalidatePath("/admin");
}

export async function toggleOrderConfirmed(id: string, confirmed: boolean) {
  const session = await requireSession();
  const parsed = OrderId.safeParse(id);
  if (!parsed.success) return;
  await logActivity({ userId: session.userId, action: confirmed ? "order_confirm" : "order_unconfirm", target: await who("orders", parsed.data) });
  await setOrderConfirmed(parsed.data, Boolean(confirmed));
  refresh();
}

export async function markReviewRequested(id: string, requested: boolean) {
  const session = await requireSession();
  const parsed = OrderId.safeParse(id);
  if (!parsed.success) return;
  await logActivity({ userId: session.userId, action: requested ? "review_requested" : "review_unrequested", target: await who("orders", parsed.data) });
  await setReviewRequested(parsed.data, Boolean(requested), session.userId);
  refresh();
}

/** Remove an unsent cart (called back, not interested, spam…). */
export async function removeDraft(id: string) {
  const session = await requireSession();
  const parsed = OrderId.safeParse(id);
  if (!parsed.success) return;
  await logActivity({ userId: session.userId, action: "draft_delete", target: await who("order_drafts", parsed.data) });
  await deleteDraft(parsed.data);
  refresh();
}

// Owner-only — customer data is permanently removed (spam, or a customer
// asking to be forgotten).
export async function removeOrder(id: string) {
  const session = await requireOwner();
  const parsed = OrderId.safeParse(id);
  if (!parsed.success) return;
  await logActivity({ userId: session.userId, action: "order_delete", target: await who("orders", parsed.data) });
  await deleteOrder(parsed.data);
  refresh();
}
