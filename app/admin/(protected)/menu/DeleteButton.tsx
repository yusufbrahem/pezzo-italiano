"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteMenuItem } from "./actions";

export default function DeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Supprimer "${name}" du menu ?`)) {
          startTransition(() => deleteMenuItem(id));
        }
      }}
      aria-label={`Supprimer ${name}`}
      className="text-xs font-semibold text-red-600 hover:text-red-700 p-2 sm:px-2 sm:py-1 disabled:opacity-50"
    >
      {pending ? (
        "..."
      ) : (
        <>
          <Trash2 size={16} className="sm:hidden" aria-hidden />
          <span className="hidden sm:inline">Supprimer</span>
        </>
      )}
    </button>
  );
}
