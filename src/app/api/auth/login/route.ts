import { db } from "@/db";
import { profiles } from "@/db/schema";
import { createLocalSession, publicUser, verifyPassword } from "@/lib/auth";
import { apiError, readObject, stringValue } from "@/lib/http";
import { getSupabaseServerClient, supabaseConfigured } from "@/lib/supabase-server";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const body = await readObject(request);
  if (!body) return apiError("Invalid request.");
  const email = stringValue(body.email, 254).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return apiError("Email and password are required.");
  if (supabaseConfigured) {
    const client = await getSupabaseServerClient();
    const { data, error } = await client!.auth.signInWithPassword({ email, password });
    if (error || !data.user) return apiError("Incorrect email or password, or email not yet confirmed.", 401);
    let [user] = await db.select().from(profiles).where(eq(profiles.id, data.user.id)).limit(1);
    if (!user) {
      const base = email.split("@")[0].replace(/[^a-z0-9_]/g, "").slice(0, 18) || "reader";
      [user] = await db.insert(profiles).values({ id: data.user.id, email, username: `${base}_${data.user.id.slice(0, 6)}`, displayName: data.user.user_metadata?.display_name || base }).onConflictDoNothing().returning();
    }
    if (user?.role === "suspended") { await client!.auth.signOut(); return apiError("This account has been suspended.", 403); }
    return Response.json({ user: publicUser(user) });
  }
  const [user] = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) return apiError("Incorrect email or password.", 401);
  await createLocalSession(user.id);
  await db.update(profiles).set({ lastSeenAt: new Date() }).where(eq(profiles.id, user.id));
  return Response.json({ user: publicUser(user) });
}
