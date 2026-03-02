export const agentKeys = [
  "coach",
  "geek",
  "pesito",
  "florencia",
  "researcher",
  "nexus",
] as const;

export type AgentKey = (typeof agentKeys)[number];

export interface AgentLink {
  label: string;
  url: string;
}

export interface AgentPayload {
  title: string;
  summary: string;
  highlights: string[];
  metrics: Record<string, number>;
  links?: AgentLink[];
  lastUpdated: string | null;
}

export type AgentStore = Record<AgentKey, AgentPayload>;

export interface AgentUpdateInput {
  summary?: string;
  highlights?: string[];
  metrics?: Record<string, number>;
  links?: AgentLink[];
}
