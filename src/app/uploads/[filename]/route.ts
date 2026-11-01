import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(filename)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const bytes = await readFile(join(process.cwd(), "public", "uploads", filename));
    const extension = filename.split(".").pop();
    const contentType = extension === "jpg" ? "image/jpeg" : extension === "png" ? "image/png" : "image/webp";
    return new Response(new Uint8Array(bytes).buffer, {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
