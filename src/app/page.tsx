import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAllAgents } from "@/lib/data-store";
import { AgentCard } from "@/components/agent-card";
import { LogoutButton } from "@/components/logout-button";
import { AgentTabs } from "@/components/agent-tabs";
import { AgentKey } from "@/types/agents";
import { SESSION_COOKIE_NAME, SESSION_TOKEN } from "@/lib/session-config";

export const metadata: Metadata = {
  title: "Dashboard Unificado | Sebastián",
};

export default async function Home() {
  const cookieStore = cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (session !== SESSION_TOKEN) {
    redirect("/login");
  }

  const agents = await getAllAgents();
  const entries = Object.entries(agents) as [AgentKey, (typeof agents)[AgentKey]][];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#05060a] via-[#0b0f17] to-[#111a2c] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-white/60">Control centralizado</p>
            <h1 className="text-4xl font-semibold">HQ de Agentes de Sebastián</h1>
            <p className="text-white/70">Todas las mejoras diarias en un solo lugar protegido.</p>
          </div>
          <LogoutButton />
        </header>

        <section>
          <AgentTabs data={agents} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-white/60">Vista rápida</p>
              <h2 className="text-2xl font-semibold">Últimas actualizaciones</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {entries.map(([agent, data]) => (
              <AgentCard key={agent} agent={agent} data={data} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
