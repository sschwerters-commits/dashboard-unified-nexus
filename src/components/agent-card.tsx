import { AgentKey, AgentPayload } from "@/types/agents";
import { BadgeCheck, Clock3 } from "lucide-react";

interface AgentCardProps {
  agent: AgentKey;
  data: AgentPayload;
}

const agentColors: Record<AgentKey, string> = {
  coach: "from-green-500/20 to-emerald-500/10",
  geek: "from-cyan-500/20 to-slate-500/10",
  pesito: "from-amber-500/30 to-rose-500/10",
  florencia: "from-pink-400/30 to-orange-400/10",
  researcher: "from-purple-500/30 to-indigo-500/10",
  nexus: "from-blue-500/30 to-sky-500/10",
};

export function AgentCard({ agent, data }: AgentCardProps) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-gradient-to-br ${agentColors[agent]} p-6 shadow-lg transition hover:shadow-xl`}>
      <header className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">{agent}</p>
          <h2 className="text-2xl font-semibold text-white">{data.title}</h2>
        </div>
        <BadgeCheck className="text-white/60" size={24} />
      </header>

      <p className="text-sm text-white/80">{data.summary}</p>

      {data.highlights.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-white/90">
          {data.highlights.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-white/70" />
              {item}
            </li>
          ))}
        </ul>
      )}

      {Object.keys(data.metrics).length > 0 && (
        <dl className="mt-5 grid grid-cols-2 gap-4 text-white">
          {Object.entries(data.metrics).map(([label, value]) => (
            <div key={label} className="rounded-xl bg-black/20 p-3 text-center">
              <dt className="text-xs uppercase tracking-wide text-white/60">{label}</dt>
              <dd className="text-xl font-semibold">{typeof value === 'number' ? value.toLocaleString("es-CL") : String(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {data.links && data.links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {data.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/30 px-4 py-1 text-white/90 transition hover:border-white hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      <footer className="mt-6 flex items-center gap-2 text-xs text-white/60">
        <Clock3 size={14} />
        <span>
          {data.lastUpdated && !isNaN(new Date(data.lastUpdated).getTime())
            ? new Date(data.lastUpdated).toLocaleString("es-CL", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "Aún sin actualizaciones"}
        </span>
      </footer>
    </section>
  );
}
