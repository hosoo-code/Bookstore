import { db } from "@/db";
import { profiles } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { isUuid, apiError, readObject } from "@/lib/http";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  if (!(await isAdmin())) return apiError("Admin access required.", 403);
  const users = await db.select({ id: profiles.id, username: profiles.username, displayName: profiles.displayName, email: profiles.email, role: profiles.role, createdAt: profiles.createdAt }).from(profiles).orderBy(desc(profiles.createdAt)).limit(200);
  return Response.json({ users });
}
export async function PATCH(request: Request) {
  const admin = await isAdmin();
  if (!admin) return apiError("Admin access required.", 403);
  const body = await readObject(request);
  const id = typeof body?.id === "string" ? body.id : "";
  const role = typeof body?.role === "string" ? body.role : "";
  if (!isUuid(id) || !["user", "admin", "suspended"].includes(role) || id === admin.id) return apiError("Invalid user or role. You cannot change your own role.");
  const [user] = await db.update(profiles).set({ role }).where(eq(profiles.id, id)).returning({ id: profiles.id, role: profiles.role });
  return user ? Response.json({ user }) : apiError("User not found.", 404);
}
