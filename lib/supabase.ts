import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL_HINT =
  "SUPABASE_URL must be the Project URL from Supabase → Settings → API, like https://xxxx.supabase.co";

function readEnv(name: string): string {
  const raw = process.env[name];
  if (!raw) return "";
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

function rawSupabaseUrl(): string {
  return readEnv("SUPABASE_URL") || readEnv("NEXT_PUBLIC_SUPABASE_URL");
}

function rawServiceRoleKey(): string {
  return readEnv("SUPABASE_SERVICE_ROLE_KEY");
}

function normalizeSupabaseUrl(raw: string): string {
  let candidate = raw;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(URL_HINT);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `${URL_HINT}. Do not paste the database URI (postgresql://...).`,
    );
  }
  if (!parsed.hostname) {
    throw new Error(URL_HINT);
  }

  return parsed.origin;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(rawSupabaseUrl() && rawServiceRoleKey());
}

export function getSupabase(): SupabaseClient {
  const url = rawSupabaseUrl();
  const key = rawServiceRoleKey();
  if (!url || !key) {
    throw new Error("Supabase is not configured");
  }

  return createClient(normalizeSupabaseUrl(url), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
