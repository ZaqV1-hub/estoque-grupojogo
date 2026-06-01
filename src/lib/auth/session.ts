import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "controle-estoque-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.SESSION_SECRET ?? "dev-session-secret-rincao";
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createSessionToken(userId: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${userId}.${expiresAt}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function readSessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [userId, expiresAtRaw, signature] = token.split(".");

  if (!userId || !expiresAtRaw || !signature) {
    return null;
  }

  const payload = `${userId}.${expiresAtRaw}`;
  const expected = sign(payload);
  const provided = Buffer.from(signature, "hex");
  const original = Buffer.from(expected, "hex");

  if (provided.length !== original.length || !timingSafeEqual(provided, original)) {
    return null;
  }

  if (Number(expiresAtRaw) < Date.now()) {
    return null;
  }

  return { userId };
}

export async function getSessionUserId() {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value)?.userId ?? null;
}

export async function setSessionCookie(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
