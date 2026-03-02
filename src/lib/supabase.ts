import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseTable = process.env.SUPABASE_TABLE ?? "agent_sections";
export const supabaseAgentColumn = process.env.SUPABASE_AGENT_COLUMN ?? "agent_id";

export function supabaseAvailable() {
  return Boolean(supabaseUrl && supabaseServiceKey);
}

export function getSupabaseClient() {
  if (!supabaseAvailable()) {
    throw new Error("Supabase no está configurado");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          "X-Client-Info": "neo-unified-dashboard/1.0",
        },
      },
    });
  }

  return supabaseClient;
}
