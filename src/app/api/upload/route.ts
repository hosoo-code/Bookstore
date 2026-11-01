import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in to upload images.", 401);
  const form = await request.formData();
  const file = form.get("file");
  const purpose = form.get("purpose");
  if (purpose === "book" && user.role !== "admin") return apiError("Admin access required.", 403);
  if (!(file instanceof File) || file.size < 1 || file.size > 5 * 1024 * 1024) return apiError("Choose an image smaller than 5 MB.");
  const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const ext = extensions[file.type];
  if (!ext) return apiError("Only JPG, PNG, and WebP images are accepted.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const valid = ext === "jpg" ? buffer[0] === 0xff && buffer[1] === 0xd8 : ext === "png" ? buffer.subarray(0, 4).equals(Buffer.from([137, 80, 78, 71])) : buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  if (!valid) return apiError("The uploaded file is not a valid image.");
  const filename = `${randomUUID()}.${ext}`;
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const { error } = await client.storage.from("bookbuch-media").upload(`${user.id}/${filename}`, buffer, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = client.storage.from("bookbuch-media").getPublicUrl(`${user.id}/${filename}`);
      return Response.json({ url: data.publicUrl });
    }
    const directory = join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, filename), buffer, { flag: "wx" });
    return Response.json({ url: `/uploads/${filename}` });
  } catch { return apiError("Image upload failed. Please try again.", 500); }
}
