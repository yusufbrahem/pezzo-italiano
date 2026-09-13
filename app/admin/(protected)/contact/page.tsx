import { getContactSettings } from "@/lib/data/settings";
import ContactForm from "./ContactForm";

export const metadata = { title: "Coordonnées" };

export default async function AdminContactPage() {
  const contact = await getContactSettings();

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-green mb-6">Coordonnées</h1>
      <ContactForm contact={contact} />
    </div>
  );
}
