import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY));

export async function getSupabaseServerClient() {
  if (!supabaseConfigured) return null;
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
    {
      cookies: {
        getAll() { return store.getAll(); },
        setAll(entries) {
          try {
            entries.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Server Components cannot set cookies; route handlers can.
          }
        },
      },
    },
  );
}
