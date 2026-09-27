"use client";

import { useTransition } from "react";
import type { DraftRow } from "@/lib/data/order-drafts";
import { formatDT } from "@/lib/orders-filters";
import { formatDateTime, formatPhone } from "./format";
import { removeDraft } from "./actions";

function DraftActions({ draft }: { draft: DraftRow }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`https://wa.me/${draft.phone}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1fb855] transition-colors"
      >
        💬 WhatsApp
      </a>
      <a
        href={`tel:+${draft.phone}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-green/20 text-brand-green text-xs font-semibold hover:border-brand-green/40 transition-colors"
      >
        📞 Appeler
      </a>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm(`Retirer le panier non envoyé de "${draft.customerName || formatPhone(draft.phone)}" ?`)) {
            startTransition(() => removeDraft(draft.id));
          }
        }}
        className="ml-auto text-xs font-semibold text-brand-charcoal/45 hover:text-red-600 px-2 py-1 disabled:opacity-50"
      >
        {pending ? "..." : "Retirer"}
      </button>
    </div>
  );
}

export default function DraftsList({ drafts }: { drafts: DraftRow[] }) {
  return (
    <ul className="space-y-3">
      {drafts.map((d) => {
        const qty = d.items.reduce((s, i) => s + i.quantity, 0);
        return (
          <li key={d.id} className="bg-white rounded-xl border border-brand-green/10 p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-brand-charcoal truncate">{d.customerName || "Sans nom"}</span>
                  {d.pastOrders > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-green text-[10px] font-bold uppercase tracking-wide">
                      Client · {d.pastOrders} cmd
                    </span>
                  )}
                </div>
                <p className="text-sm text-brand-charcoal/70 tabular-nums">{formatPhone(d.phone)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-brand-green tabular-nums">{d.total > 0 ? formatDT(d.total) : "à conf."}</p>
                <p className="text-[11px] text-brand-charcoal/45">{formatDateTime(d.updatedAt)}</p>
              </div>
            </div>
            <p className="text-xs text-brand-charcoal/60 mb-1">
              {d.orderType === "livraison" ? "🛵 Livraison" : "🏃 À emporter"} · {qty} article{qty > 1 ? "s" : ""} :{" "}
              {d.items.map((i) => (i.customNote ? i.name : `${i.quantity}× ${i.name}${i.sizeLabel ? ` (${i.sizeLabel})` : ""}`)).join(", ")}
            </p>
            {(d.address || d.notes) && (
              <p className="text-xs text-brand-charcoal/50 mb-1">
                {d.address && `📍 ${d.address}${d.zone ? `, ${d.zone}` : ""}`}
                {d.address && d.notes ? " · " : ""}
                {d.notes && `📝 ${d.notes}`}
              </p>
            )}
            <div className="mt-3">
              <DraftActions draft={d} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
