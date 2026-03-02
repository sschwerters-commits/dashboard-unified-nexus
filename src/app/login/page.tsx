import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LoginForm } from "@/components/login-form";
import { SESSION_COOKIE_NAME, SESSION_TOKEN } from "@/lib/session-config";

export const metadata: Metadata = {
  title: "Ingresar | Dashboard Unificado",
};

export default function LoginPage() {
  const cookieStore = cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (session === SESSION_TOKEN) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#05060a] via-[#0b0f17] to-[#111a2c] px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-widest text-white/50">Ingreso privado</p>
        <h1 className="mb-1 text-3xl font-semibold text-white">Dashboard Unificado</h1>
        <p className="mb-6 text-sm text-white/70">Acceso restringido a Sebastián</p>
        <LoginForm />
      </div>
    </main>
  );
}
