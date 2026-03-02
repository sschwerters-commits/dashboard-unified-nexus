import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AgentKey, agentKeys } from "@/types/agents";
import { getAgentData, updateAgent } from "@/lib/data-store";

const updateSchema = z.object({
  summary: z.string().min(1).optional(),
  highlights: z.array(z.string()).optional(),
  metrics: z.record(z.string(), z.number()).optional(),
  links: z
    .array(
      z.object({
        label: z.string().min(1),
        url: z.string().url(),
      })
    )
    .optional(),
});

const agentSet = new Set(agentKeys);

type RouteContext = { params: Promise<{ agent: string }> };

function getEnvToken(agent: AgentKey) {
  const envKey = `AGENT_TOKEN_${agent.toUpperCase()}`;
  return process.env[envKey];
}

function isAuthorized(agent: AgentKey, providedToken: string | null) {
  const expectedToken = getEnvToken(agent);
  if (!expectedToken) {
    console.warn(`No se configuró ${`AGENT_TOKEN_${agent.toUpperCase()}`} para proteger la API.`);
    return false;
  }
  return expectedToken === providedToken;
}

async function resolveAgent(context: RouteContext) {
  const { agent } = await context.params;
  return agent as AgentKey;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const agent = await resolveAgent(context);
  if (!agentSet.has(agent)) {
    return NextResponse.json({ error: "Agente no válido" }, { status: 404 });
  }

  const data = await getAgentData(agent);
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const agent = await resolveAgent(context);
  if (!agentSet.has(agent)) {
    return NextResponse.json({ error: "Agente no válido" }, { status: 404 });
  }

  const token = request.headers.get("x-agent-token");
  if (!isAuthorized(agent, token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.format() }, { status: 400 });
  }

  const updated = await updateAgent(agent, parsed.data);
  return NextResponse.json({ data: updated });
}

export const runtime = "nodejs";
