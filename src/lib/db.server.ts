import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Database access layer.
 *
 * Everything is driven from environment variables so the project can be moved
 * to Vercel (or any host) untouched:
 *
 *   DB_PROVIDER=lovable   -> SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   DB_PROVIDER=local     -> LOCAL_DB_URL + LOCAL_DB_SERVICE_KEY
 *
 * Both point at a Postgres instance exposed over the same Data API, so the
 * application code below is identical for either provider.
 */
export function db(): SupabaseClient {
  const provider = (process.env["DB_PROVIDER"] || "lovable").toLowerCase();

  const url =
    provider === "local"
      ? process.env["LOCAL_DB_URL"]
      : process.env["SUPABASE_URL"];
  const key =
    provider === "local"
      ? process.env["LOCAL_DB_SERVICE_KEY"]
      : process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !key) {
    throw new Error(
      `Database is not configured for DB_PROVIDER="${provider}". Set the matching URL and service key in .env.`,
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export function dbProvider(): string {
  return (process.env["DB_PROVIDER"] || "lovable").toLowerCase();
}
