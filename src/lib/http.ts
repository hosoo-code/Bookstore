export function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function readObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const data: unknown = await request.json();
    return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : null;
  } catch { return null; }
}

export function stringValue(value: unknown, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
