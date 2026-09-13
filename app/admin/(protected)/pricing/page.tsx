import { getPricingTiers } from "@/lib/data/settings";
import PricingForm from "./PricingForm";

export const metadata = { title: "Tarifs" };

export default async function AdminPricingPage() {
  const tiers = await getPricingTiers();

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-2">Tarifs</h1>
      <p className="text-sm text-brand-charcoal/50 mb-6 max-w-xl">
        Les cartes de référence affichées au-dessus de la liste des pizzas. Ajoutez, retirez ou réorganisez des
        tarifs librement — chaque prix (100g, ¼, ½, Plateau) est indépendant et optionnel, laissez un champ vide
        s&apos;il ne s&apos;applique pas. La liste des pizzas elle-même a ses propres prix individuels, modifiables
        depuis{" "}
        <a href="/admin/menu" className="underline hover:text-brand-green">
          Menu
        </a>
        .
      </p>
      <PricingForm tiers={tiers} />
    </div>
  );
}
