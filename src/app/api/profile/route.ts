import { db } from "@/db";
import { profiles, userInterests, categories } from "@/db/schema";
import { getCurrentUser, publicUser } from "@/lib/auth";
import { apiError, readObject, stringValue } from "@/lib/http";
import { eq, inArray } from "drizzle-orm";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const body = await readObject(request);
  if (!body) return apiError("Invalid request.");
  const update: Partial<typeof profiles.$inferInsert> = {};
  if (body.username !== undefined) {
    const username = stringValue(body.username, 24).toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(username)) return apiError("Username must be 3–24 letters, numbers, or underscores.");
    update.username = username;
  }
  if (body.displayName !== undefined) { const name = stringValue(body.displayName, 60); if (name.length < 2) return apiError("Display name is too short."); update.displayName = name; }
  if (body.bio !== undefined) update.bio = stringValue(body.bio, 500);
  for (const field of ["avatarUrl", "coverUrl"] as const) {
    if (body[field] !== undefined) {
      const value = stringValue(body[field], 500);
      if (value && !value.startsWith("/uploads/") && !value.startsWith("https://")) return apiError("Invalid image URL.");
      update[field] = value || null;
    }
  }
  if (body.favoriteGenres !== undefined) {
    if (!Array.isArray(body.favoriteGenres)) return apiError("Invalid genres.");
    const allowed = new Set((await db.select({ slug: categories.slug }).from(categories)).map((category) => category.slug));
    update.favoriteGenres = [...new Set(body.favoriteGenres.filter((genre): genre is string => typeof genre === "string" && allowed.has(genre)))].slice(0, 8);
  }
  if (body.favoriteAuthors !== undefined) {
    if (!Array.isArray(body.favoriteAuthors)) return apiError("Invalid authors.");
    update.favoriteAuthors = body.favoriteAuthors.filter((name): name is string => typeof name === "string").map((name) => name.trim().slice(0, 80)).filter(Boolean).slice(0, 12);
  }
  if (body.allowMessages !== undefined) update.allowMessages = body.allowMessages === true;
  if (!Object.keys(update).length) return apiError("No changes provided.");
  try {
    const [profile] = await db.update(profiles).set(update).where(eq(profiles.id, user.id)).returning();
    if (update.favoriteGenres) {
      await db.delete(userInterests).where(eq(userInterests.userId, user.id));
      if (update.favoriteGenres.length) {
        const ids = await db.select({ id: categories.id }).from(categories).where(inArray(categories.slug, update.favoriteGenres));
        if (ids.length) await db.insert(userInterests).values(ids.map(({ id }) => ({ userId: user.id, categoryId: id })));
      }
    }
    return Response.json({ profile: { ...publicUser(profile), bio: profile.bio, favoriteGenres: profile.favoriteGenres, favoriteAuthors: profile.favoriteAuthors, coverUrl: profile.coverUrl, allowMessages: profile.allowMessages } });
  } catch { return apiError("Username is already taken.", 409); }
}
