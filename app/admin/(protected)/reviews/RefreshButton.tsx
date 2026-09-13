"use client";

import { useState, useTransition } from "react";
import { refreshReviews } from "./actions";

export default function RefreshButton() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setDone(false);
          startTransition(async () => {
            await refreshReviews();
            setDone(true);
          });
        }}
        className="px-5 py-2.5 rounded-lg bg-brand-green text-brand-white font-semibold text-sm hover:bg-brand-green-light transition-colors disabled:opacity-60"
      >
        {pending ? "Actualisation..." : "Rafraîchir maintenant"}
      </button>
      {done && !pending && (
        <p className="text-sm text-green-700 mt-2">Avis actualisés.</p>
      )}
    </div>
  );
}
