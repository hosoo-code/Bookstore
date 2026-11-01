import { db } from "@/db";
import { profiles, sessions, type Profile } from "@/db/schema";
import { getSupabaseServerClient, supabaseConfigured } from "@/lib/supabase-server";
import { and, eq, gt } from "drizzle-orm";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";

const scrypt = promisify(scryptCallback);
const cookieName = "bookbuch_session";

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex || hex.length !== 128) return false;
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(hash, Buffer.from(hex, "hex"));
}

export async function createLocalSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await db.insert(sessions).values({ userId, tokenHash, expiresAt: new Date(Date.now() + 30 * 86400000) });
  (await cookies()).set(cookieName, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400,
  });
}

export async function clearAuth() {
  if (supabaseConfigured) {
    const client = await getSupabaseServerClient();
    await client?.auth.signOut();
  } else {
    const token = (await cookies()).get(cookieName)?.value;
    if (token) await db.delete(sessions).where(eq(sessions.tokenHash, createHash("sha256").update(token).digest("hex")));
    (await cookies()).delete(cookieName);
  }
}

export async function getCurrentUser(): Promise<Profile | null> {
  if (supabaseConfigured) {
    const client = await getSupabaseServerClient();
    const { data: { user }, error } = await client!.auth.getUser();
    if (error || !user?.email) return null;
    let [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
    if (!profile) {
      const base = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 18) || "reader";
      await db.insert(profiles).values({ id: user.id, email: user.email.toLowerCase(), username: `${base}_${user.id.slice(0, 6)}`, displayName: user.user_metadata?.display_name || base }).onConflictDoNothing();
      [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
    }
    return profile?.role === "suspended" ? null : profile ?? null;
  }
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const hash = createHash("sha256").update(token).digest("hex");
  const [row] = await db.select({ profile: profiles }).from(sessions).innerJoin(profiles, eq(sessions.userId, profiles.id))
    .where(and(eq(sessions.tokenHash, hash), gt(sessions.expiresAt, new Date()))).limit(1);
  return row?.profile?.role === "suspended" ? null : row?.profile ?? null;
}

export function publicUser(profile: Profile | null) {
  if (!profile) return null;
  return { id: profile.id, username: profile.username, displayName: profile.displayName, avatarUrl: profile.avatarUrl, role: profile.role };
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}
