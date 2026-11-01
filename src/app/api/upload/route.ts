import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function r2Client() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) return null;
  return {
    bucket: R2_BUCKET,
    publicUrl: R2_PUBLIC_URL.replace(/\/+$/, ""),
    client: new S3Client({ region: "auto", endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY } }),
  };
}

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
    const r2 = r2Client();
    if (r2) {
      const key = `${user.id}/${filename}`;
      await r2.client.send(new PutObjectCommand({ Bucket: r2.bucket, Key: key, Body: buffer, ContentType: file.type, CacheControl: "public, max-age=31536000, immutable" }));
      return Response.json({ url: `${r2.publicUrl}/${key}` });
    }
    const directory = join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, filename), buffer, { flag: "wx" });
    return Response.json({ url: `/uploads/${filename}` });
  } catch { return apiError("Image upload failed. Please try again.", 500); }
}
