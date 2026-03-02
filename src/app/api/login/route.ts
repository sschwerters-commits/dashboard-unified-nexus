import { NextResponse } from "next/server";
import { z } from "zod";
import { startSession } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

export async function POST(request: Request) {
  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ error: "Config de credenciales incompleta" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  startSession();
  return NextResponse.json({ ok: true });
}
