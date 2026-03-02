import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_TOKEN, SESSION_MAX_AGE } from "@/lib/session-config";

export function hasValidSession() {
  const cookieStore = cookies();
  const stored = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return Boolean(stored && stored === SESSION_TOKEN);
}

export function startSession() {
  const cookieStore = cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: SESSION_TOKEN,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function endSession() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
