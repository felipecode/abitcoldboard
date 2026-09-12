import { getMember } from "@/lib/members";

export const SESSION_COOKIE = "abc_session";
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export type Session = {
  memberId: string;
  name: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return secret;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const buffer = Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
  return buffer.toString("base64url");
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

export async function signSession(session: Session): Promise<string> {
  const body = toBase64Url(Buffer.from(JSON.stringify(session)));
  const key = await hmacKey(getSecret());
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  return `${body}.${toBase64Url(signature)}`;
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const key = await hmacKey(getSecret());
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      new Uint8Array(fromBase64Url(signature)),
      new TextEncoder().encode(body),
    );
    if (!valid) return null;

    const session = JSON.parse(fromBase64Url(body).toString("utf8")) as Session;
    if (!session.memberId || !session.name || !session.exp) return null;
    if (session.exp * 1000 <= Date.now()) return null;
    if (!getMember(session.memberId)) return null;
    return session;
  } catch {
    return null;
  }
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function createSessionPayload(memberId: string, name: string): Session {
  return {
    memberId,
    name,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
}
