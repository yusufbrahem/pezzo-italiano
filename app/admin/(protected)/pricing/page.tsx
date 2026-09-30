import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { needsApproval } from "@/lib/auth/roles";
import { getPricingTiers } from "@/lib/data/settings";
import { getPendingChange } from "@/lib/data/changes";
import PricingForm from "./PricingForm";

export const metadata = { title: "Tarifs" };

export default async function AdminPricingPage() {
  const [session, liveTiers, pending] = await Promise.all([requireSession(), getPricingTiers(), getPendingChange("pricing", null)]);
  const approval = needsApproval(session.role);
  // Staff / administrators continue from the proposal already waiting; the owner edits the live tiers.
  const tiers = approval && pending ? pending.payload.tiers : liveTiers;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-2">Tarifs</h1>
      <p className="text-sm text-brand-charcoal/60 mb-6 max-w-xl">
        Les cartes de référence affichées au-dessus de la liste des pizzas. Ajoutez, retirez ou réorganisez des
        tarifs librement — chaque prix (100g, ¼, ½, Plateau) est indépendant et optionnel, laissez un champ vide
        s&apos;il ne s&apos;applique pas. La liste des pizzas elle-même a ses propres prix individuels, modifiables
        depuis{" "}
        <a href="/admin/menu" className="underline hover:text-brand-green">
          Menu
        </a>
        .
      </p>

      {pending &&
        (approval ? (
          <p className="mb-5 max-w-2xl text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⏳ Vous voyez les tarifs proposés par {pending.submittedByName}, en attente de validation. Enregistrer remplacera
            cette proposition.
          </p>
        ) : (
          <Link
            href="/admin/approvals"
            className="mb-5 max-w-2xl flex items-center justify-between gap-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 hover:border-amber-300"
          >
            <span>⏳ {pending.submittedByName} a proposé de nouveaux tarifs.</span>
            <span className="font-semibold whitespace-nowrap">Voir →</span>
          </Link>
        ))}
      {approval && !pending && (
        <p className="mb-5 max-w-2xl text-xs text-brand-charcoal/60 bg-brand-cream border border-brand-green/10 rounded-lg px-3 py-2">
          Vos modifications seront visibles sur le site une fois validées par le propriétaire.
        </p>
      )}

      <PricingForm tiers={tiers} approval={approval} />
    </div>
  );
}
