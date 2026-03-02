import { promises as fs } from "fs";
import path from "path";
import { AgentKey, AgentStore, AgentUpdateInput, agentKeys } from "@/types/agents";
import {
  getSupabaseClient,
  supabaseAgentColumn,
  supabaseAvailable,
  supabaseTable,
} from "@/lib/supabase";

const dataDir = path.join(process.cwd(), "data");
const dataFilePath = path.join(dataDir, "agents.json");

function buildInitialStore(): AgentStore {
  return Object.fromEntries(
    agentKeys.map((key) => [
      key,
      {
        title: key.charAt(0).toUpperCase() + key.slice(1),
        summary: "Sin datos aún.",
        highlights: [],
        metrics: {},
        links: [],
        lastUpdated: null,
      },
    ])
  ) as unknown as AgentStore;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function buildSummaryFromRaw(metrics: Record<string, number>) {
  const parts = [] as string[];
  if (metrics.steps !== undefined) {
    parts.push(`Pasos ${metrics.steps.toLocaleString("es-CL")}`);
  }
  if (metrics.workouts !== undefined) {
    parts.push(`Workouts ${metrics.workouts}`);
  }
  return parts.length ? parts.join(" · ") : "Actualiza para ver el progreso de la semana";
}

function formatHabits(raw: Record<string, unknown>): string[] {
  const habits = raw.habits;
  if (!Array.isArray(habits)) {
    return [];
  }

  return habits
    .map((habit) => {
      if (typeof habit !== "object" || !habit) {
        return null;
      }
      const name = "name" in habit ? String((habit as Record<string, unknown>).name ?? "") : "";
      if (!name) {
        return null;
      }
      const completed = Boolean((habit as Record<string, unknown>).completed);
      return `${completed ? "✅" : "⭕"} ${name}`;
    })
    .filter((value): value is string => Boolean(value));
}

function normalizeMetrics(raw: Record<string, unknown>) {
  const metrics: Record<string, number> = {};
  const directSteps = toNumber(raw.steps);
  if (directSteps !== undefined) {
    metrics.steps = directSteps;
  }
  const directWorkouts = toNumber(raw.workouts);
  if (directWorkouts !== undefined) {
    metrics.workouts = directWorkouts;
  }

  const nested = raw.metrics;
  if (nested && typeof nested === "object") {
    for (const [key, value] of Object.entries(nested as Record<string, unknown>)) {
      const numeric = toNumber(value);
      if (numeric !== undefined) {
        metrics[key] = numeric;
      }
    }
  }

  return metrics;
}

function mapRowToPayload(agent: AgentKey, row: Record<string, unknown>) {
  const base = buildInitialStore()[agent];
  const rawData = row.data as Record<string, unknown> | undefined;
  if (!rawData) {
    return base;
  }

  const lastUpdated = (row.updated_at as string | null) ?? base.lastUpdated;
  const hasDashboardShape =
    typeof rawData.summary === "string" ||
    Array.isArray(rawData.highlights) ||
    typeof rawData.title === "string";

  if (hasDashboardShape) {
    return {
      ...base,
      ...(rawData as Partial<AgentStore[AgentKey]>),
      metrics:
        (rawData.metrics as Record<string, number> | undefined) ?? base.metrics,
      highlights: (rawData.highlights as string[] | undefined) ?? base.highlights,
      lastUpdated,
    };
  }

  const metrics = normalizeMetrics(rawData);
  const summary = buildSummaryFromRaw(metrics);
  const highlights = formatHabits(rawData);

  return {
    ...base,
    summary,
    highlights: highlights.length ? highlights : base.highlights,
    metrics: Object.keys(metrics).length ? metrics : base.metrics,
    lastUpdated,
  };
}

async function ensureLocalFile() {
  try {
    await fs.access(dataFilePath);
  } catch {
    const initial = buildInitialStore();
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dataFilePath, JSON.stringify(initial, null, 2), "utf-8");
  }
}

async function readFromLocal() {
  await ensureLocalFile();
  const raw = await fs.readFile(dataFilePath, "utf-8");
  return JSON.parse(raw) as AgentStore;
}

async function writeToLocal(data: AgentStore) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf-8");
}

async function readFromSupabase(): Promise<AgentStore | null> {
  if (!supabaseAvailable()) {
    return null;
  }

  const client = getSupabaseClient();
  const { data, error } = await client.from(supabaseTable).select("*").order(supabaseAgentColumn, {
    ascending: true,
  });

  if (error) {
    console.error("Supabase select error", error.message);
    return null;
  }

  if (!data || data.length === 0) {
    const initial = buildInitialStore();
    await writeToSupabase(initial);
    return initial;
  }

  const store: Partial<AgentStore> = {};
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  for (const row of rows) {
    const agent = row[supabaseAgentColumn] as AgentKey | undefined;
    if (!agent || !agentKeys.includes(agent)) {
      continue;
    }

    store[agent] = mapRowToPayload(agent, row);
  }

  return store as AgentStore;
}

async function writeToSupabase(data: AgentStore) {
  if (!supabaseAvailable()) {
    return false;
  }

  const client = getSupabaseClient();
  const rows = Object.entries(data).map(([agent, payload]) => ({
    [supabaseAgentColumn]: agent,
    data: payload,
  }));

  const { error } = await client.from(supabaseTable).upsert(rows, {
    onConflict: supabaseAgentColumn,
  });

  if (error) {
    console.error("Supabase upsert error", error.message);
    return false;
  }

  return true;
}

export async function readStore(): Promise<AgentStore> {
  if (supabaseAvailable()) {
    const remote = await readFromSupabase();
    if (remote) {
      return remote;
    }
  }

  return readFromLocal();
}

export async function writeStore(data: AgentStore) {
  if (supabaseAvailable()) {
    const ok = await writeToSupabase(data);
    if (ok) {
      return;
    }
  }

  await writeToLocal(data);
}

export async function getAgentData(agent: AgentKey) {
  const store = await readStore();
  return store[agent];
}

export async function getAllAgents() {
  return readStore();
}

export async function updateAgent(agent: AgentKey, payload: AgentUpdateInput) {
  const store = await readStore();
  const current = store[agent];

  store[agent] = {
    ...current,
    ...payload,
    highlights: payload.highlights ?? current.highlights,
    metrics: payload.metrics ?? current.metrics,
    links: payload.links ?? current.links,
    lastUpdated: new Date().toISOString(),
  };

  await writeStore(store);
  return store[agent];
}
