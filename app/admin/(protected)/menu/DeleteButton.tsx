"use client";

import { useTransition } from "react";
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
      className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 disabled:opacity-50"
    >
      {pending ? "..." : "Supprimer"}
    </button>
  );
}
