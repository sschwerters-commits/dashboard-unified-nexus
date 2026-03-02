"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AgentKey, AgentStore, agentKeys } from "@/types/agents";
import { AgentCard } from "@/components/agent-card";

const tabs: Array<{
  key: AgentKey;
  label: string;
  emoji: string;
  description: string;
}> = [
  {
    key: "pesito",
    label: "Finanzas",
    emoji: "💰",
    description: "Balance, flujos y alertas financieras",
  },
  {
    key: "researcher",
    label: "Investigación",
    emoji: "🔬",
    description: "Insights estratégicos y conocimiento",
  },
  {
    key: "coach",
    label: "Vida Sana",
    emoji: "💪",
    description: "Salud, hábitos y métricas personales",
  },
  {
    key: "florencia",
    label: "Agenda",
    emoji: "📅",
    description: "Logística familiar y compromisos",
  },
  {
    key: "geek",
    label: "Datos",
    emoji: "📊",
    description: "Análisis cuantitativo y automatizaciones",
  },
  {
    key: "nexus",
    label: "Coordinación",
    emoji: "🔗",
    description: "Estado de los agentes y gestión operativa",
  },
];

const STORAGE_KEY = "agent-tabs:last-selected";
const URL_PARAM = "agent";
const agentSet = new Set(agentKeys);
const digitMap = tabs.reduce<Record<string, AgentKey>>((acc, tab, index) => {
  acc[String(index + 1)] = tab.key;
  return acc;
}, {});

interface AgentTabsProps {
  data: AgentStore;
}

const getInitialAgent = (): AgentKey => {
  if (typeof window === "undefined") {
    return "pesito";
  }

  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get(URL_PARAM);
  if (fromUrl && agentSet.has(fromUrl as AgentKey)) {
    return fromUrl as AgentKey;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && agentSet.has(stored as AgentKey)) {
    return stored as AgentKey;
  }

  return "pesito";
};

export function AgentTabs({ data }: AgentTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [storedAgent, setStoredAgent] = useState<AgentKey>(getInitialAgent);

  const urlAgent = searchParams?.get(URL_PARAM);
  const hasUrlAgent = Boolean(urlAgent && agentSet.has(urlAgent as AgentKey));
  const active = (hasUrlAgent && urlAgent ? urlAgent : storedAgent) as AgentKey;

  useEffect(() => {
    if (hasUrlAgent) {
      window.localStorage.setItem(STORAGE_KEY, active);
    }
  }, [active, hasUrlAgent]);

  const handleSelect = useCallback(
    (key: AgentKey) => {
      setStoredAgent(key);
      window.localStorage.setItem(STORAGE_KEY, key);

      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set(URL_PARAM, key);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      const nextAgent = digitMap[event.key];
      if (!nextAgent) {
        return;
      }

      event.preventDefault();
      handleSelect(nextAgent);
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [handleSelect]);

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      <nav className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur">
        <div className="mb-3 text-xs uppercase tracking-widest text-white/40">
          Atajos 1–{tabs.length} para saltar entre agentes
        </div>
        <ul className="space-y-2">
          {tabs.map((tab, index) => {
            const isActive = tab.key === active;
            return (
              <li key={tab.key}>
                <button
                  className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                    isActive
                      ? "bg-white text-slate-900 shadow"
                      : "text-white/80 hover:bg-white/10"
                  }`}
                  onClick={() => handleSelect(tab.key)}
                >
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <span>{tab.emoji}</span>
                    <span>
                      {tab.label}
                      <span className="ml-2 rounded-full border border-white/20 px-2 py-0.5 text-xs font-normal text-white/50">
                        {index + 1}
                      </span>
                    </span>
                  </div>
                  <p className={`text-sm ${isActive ? "text-slate-600" : "text-white/60"}`}>
                    {tab.description}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-4">
        <p className="text-sm uppercase tracking-widest text-white/60">
          Sección seleccionada
        </p>
        <AgentCard agent={active} data={data[active]} />
      </div>
    </div>
  );
}
