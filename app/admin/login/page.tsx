import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import LoginForm from "./LoginForm";

export const metadata = { title: "Connexion — Admin Pezzo Italiano" };

export default async function LoginPage() {
  const session = await verifySession();
  if (session) redirect("/admin");

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-brand-gold mx-auto mb-4 flex items-center justify-center">
            <span className="font-serif text-2xl font-black text-brand-green">P</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-brand-green">Pezzo Italiano</h1>
          <p className="text-brand-charcoal/50 text-sm mt-1">Espace administration</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
