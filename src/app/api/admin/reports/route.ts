import { db } from "@/db";
import { userReports, posts, profiles } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { isUuid, apiError, readObject } from "@/lib/http";
import { desc, eq } from "drizzle-orm";
export async function GET() {
  if (!(await isAdmin())) return apiError("Admin access required.", 403);
  const rows = await db.select({ report: userReports, postBody: posts.body, targetUsername: profiles.username }).from(userReports)
    .leftJoin(posts, eq(userReports.targetPostId, posts.id)).leftJoin(profiles, eq(userReports.targetUserId, profiles.id))
    .orderBy(desc(userReports.createdAt)).limit(100);
  return Response.json({ reports: rows.map(({ report, postBody, targetUsername }) => ({ ...report, postBody, targetUsername })) });
}
export async function PATCH(request: Request) {
  if (!(await isAdmin())) return apiError("Admin access required.", 403);
  const body = await readObject(request);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = typeof body?.status === "string" ? body.status : "";
  if (!isUuid(id) || !["open", "resolved", "dismissed"].includes(status)) return apiError("Invalid report.");
  const [report] = await db.update(userReports).set({ status }).where(eq(userReports.id, id)).returning();
  return report ? Response.json({ report }) : apiError("Report not found.", 404);
}
