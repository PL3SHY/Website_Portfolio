import { NextRequest } from "next/server";
import { audit } from "@/lib/audit/rules";
import { BlockedAddressError, fetchHeaders } from "@/lib/audit/safe-fetch";

// Best-effort limiter: each serverless instance keeps its own counts, so this slows casual abuse
// but is not a hard guarantee. For a strict limit use a shared store or Vercel's firewall rules.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
  }
  return recent.length > MAX_PER_WINDOW;
}

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (limited(ip)) return json({ error: "Too many requests. Please wait a minute and try again." }, 429);

  let input: unknown;
  try {
    input = (await request.json())?.url;
  } catch {
    return json({ error: "Send JSON like { \"url\": \"example.com\" }." }, 400);
  }
  if (typeof input !== "string" || input.trim() === "" || input.length > 2048) {
    return json({ error: "Please enter a URL (up to 2048 characters)." }, 400);
  }

  let target: URL;
  try {
    const raw = input.trim();
    target = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return json({ error: "That doesn't look like a valid URL." }, 400);
  }

  try {
    const result = await fetchHeaders(target.href);
    const isHttps = new URL(result.finalUrl).protocol === "https:";
    return json({
      requestedUrl: target.href,
      finalUrl: result.finalUrl,
      status: result.status,
      redirects: result.redirects,
      scannedAt: new Date().toISOString(),
      ...audit(result.headers, isHttps),
    });
  } catch (e) {
    if (e instanceof BlockedAddressError) {
      return json({ error: "That address isn't allowed. Private, local and internal addresses are blocked." }, 400);
    }
    return json({ error: "Couldn't reach that site (it may be offline, too slow, or have a TLS problem)." }, 502);
  }
}
