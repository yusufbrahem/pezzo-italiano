"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOwner, requireSession } from "@/lib/auth/session";
import { deleteOrder, setOrderConfirmed, setReviewRequested } from "@/lib/data/orders";
import { deleteDraft } from "@/lib/data/order-drafts";

const OrderId = z.string().uuid();

function refresh() {
  revalidatePath("/admin/clients");
  revalidatePath("/admin");
}

export async function toggleOrderConfirmed(id: string, confirmed: boolean) {
  await requireSession();
  const parsed = OrderId.safeParse(id);
  if (!parsed.success) return;
  await setOrderConfirmed(parsed.data, Boolean(confirmed));
  refresh();
}

export async function markReviewRequested(id: string, requested: boolean) {
  const session = await requireSession();
  const parsed = OrderId.safeParse(id);
  if (!parsed.success) return;
  await setReviewRequested(parsed.data, Boolean(requested), session.userId);
  refresh();
}

/** Remove an unsent cart (called back, not interested, spam…). */
export async function removeDraft(id: string) {
  await requireSession();
  const parsed = OrderId.safeParse(id);
  if (!parsed.success) return;
  await deleteDraft(parsed.data);
  refresh();
}

// Owner-only — customer data is permanently removed (spam, or a customer
// asking to be forgotten).
export async function removeOrder(id: string) {
  await requireOwner();
  const parsed = OrderId.safeParse(id);
  if (!parsed.success) return;
  await deleteOrder(parsed.data);
  refresh();
}
