"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteMenuItem } from "./actions";

export default function DeleteButton({ id, name, approval = false }: { id: string; name: string; approval?: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const question = approval
          ? `Demander la suppression de "${name}" ? Le propriétaire devra la valider.`
          : `Supprimer "${name}" du menu ?`;
        if (confirm(question)) {
          startTransition(async () => {
            await deleteMenuItem(id);
          });
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
