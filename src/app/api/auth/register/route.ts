import { db } from "@/db";
import { profiles } from "@/db/schema";
import { createLocalSession, hashPassword, publicUser } from "@/lib/auth";
import { apiError, readObject, stringValue } from "@/lib/http";
import { getSupabaseServerClient, supabaseConfigured } from "@/lib/supabase-server";
import { eq, or } from "drizzle-orm";

export async function POST(request: Request) {
  const body = await readObject(request);
  if (!body) return apiError("Invalid request.");
  const email = stringValue(body.email, 254).toLowerCase();
  const username = stringValue(body.username, 24).toLowerCase();
  const displayName = stringValue(body.displayName, 60);
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return apiError("Enter a valid email address.");
  if (!/^[a-z0-9_]{3,24}$/.test(username)) return apiError("Username must be 3–24 letters, numbers, or underscores.");
  if (displayName.length < 2 || password.length < 8 || password.length > 128) return apiError("Enter a name and a password of at least 8 characters.");
  const [taken] = await db.select({ id: profiles.id }).from(profiles).where(or(eq(profiles.email, email), eq(profiles.username, username))).limit(1);
  if (taken) return apiError("Email or username is already in use.", 409);
  try {
    if (supabaseConfigured) {
      const client = await getSupabaseServerClient();
      const { data, error } = await client!.auth.signUp({ email, password, options: { data: { display_name: displayName, username } } });
      if (error || !data.user) return apiError(error?.message || "Could not create account.", 400);
      await db.insert(profiles).values({ id: data.user.id, email, username, displayName }).onConflictDoNothing();
      return Response.json({ user: data.session ? publicUser((await db.select().from(profiles).where(eq(profiles.id, data.user.id)).limit(1))[0]) : null, requiresConfirmation: !data.session }, { status: 201 });
    }
    const [user] = await db.insert(profiles).values({ email, username, displayName, passwordHash: await hashPassword(password), lastSeenAt: new Date() }).returning();
    await createLocalSession(user.id);
    return Response.json({ user: publicUser(user), requiresConfirmation: false }, { status: 201 });
  } catch {
    return apiError("Could not create account. Please try a different email or username.", 409);
  }
}
