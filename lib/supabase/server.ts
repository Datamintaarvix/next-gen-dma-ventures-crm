import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

function getSupabaseKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

/**
 * Validates whether live Supabase server credentials are configured.
 */
export function isSupabaseServerConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  return Boolean(
    url &&
    !url.includes("placeholder") &&
    !url.includes("your-project") &&
    key &&
    !key.includes("placeholder") &&
    !key.includes("your-anon-key") &&
    !key.includes("placeholder-key")
  );
}

let cachedAdminClient: SupabaseClient<any> | null = null;
let lastUsedUrl = "";
let lastUsedKey = "";

/**
 * Returns a server-side Supabase client.
 * Uses SUPABASE_SERVICE_ROLE_KEY for server operations, strictly isolated from client bundles.
 */
export function getSupabaseAdminClient(): SupabaseClient<any> {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  if (!cachedAdminClient || lastUsedUrl !== url || lastUsedKey !== key) {
    if (!url || !key) {
      cachedAdminClient = createClient(
        "https://placeholder-project.supabase.co",
        "placeholder-key",
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    } else {
      cachedAdminClient = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      lastUsedUrl = url;
      lastUsedKey = key;
    }
  }
  return cachedAdminClient;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient<any>, {
  get(_target, prop: string | symbol) {
    const client = getSupabaseAdminClient();
    const val = (client as any)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});

