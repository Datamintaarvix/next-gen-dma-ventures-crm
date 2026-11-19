import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
// Clean URL by stripping any trailing /rest/v1 or slashes to ensure valid PostgREST client base
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Checks whether valid Supabase credentials have been configured in the environment.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseUrl.includes("your-project") &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes("placeholder") &&
    !supabaseAnonKey.includes("your-anon-key")
  );
}

/**
 * Public browser-safe Supabase client (using Anon Key).
 * Suitable for client components and public queries.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
