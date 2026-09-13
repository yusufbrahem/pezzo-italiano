import { getHoursSchedule, getHoursOverride } from "@/lib/data/settings";
import { computeIsOpen } from "@/lib/hours-shared";
import ScheduleForm from "./ScheduleForm";
import OverrideForm from "./OverrideForm";

export const metadata = { title: "Horaires" };

export default async function AdminHoursPage() {
  const schedule = await getHoursSchedule();
  const override = await getHoursOverride();
  const status = computeIsOpen(schedule, override);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-2">Horaires</h1>
      <p className="text-sm text-brand-charcoal/50 mb-6">
        Statut actuel :{" "}
        <span className={status.open ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
          {status.open ? "Ouvert" : "Fermé"}
        </span>{" "}
        {status.source === "override" && "(dérogation active)"}
      </p>

      <div className="mb-8">
        <h2 className="font-semibold text-brand-charcoal mb-3">
          Ouverture exceptionnelle / fermeture exceptionnelle
        </h2>
        <p className="text-xs text-brand-charcoal/50 mb-3">
          À activer quand le restaurant reste ouvert (ou ferme) en dehors des horaires habituels ce jour-là.
          Quand elle est active, la dérogation prime sur les horaires normaux ci-dessous.
        </p>
        <OverrideForm override={override} />
      </div>

      <div>
        <h2 className="font-semibold text-brand-charcoal mb-3">Horaires habituels</h2>
        <ScheduleForm schedule={schedule} />
      </div>
    </div>
  );
}
