// supabase/functions/_shared/security.ts
// Helper keamanan bersama untuk edge functions (K2 / IO-13):
// - CORS allowlist berbasis origin (env ALLOWED_ORIGINS)
// - Validasi user in-app dari JWT (gateway verify_jwt=true sudah cek signature)
//
// Catatan: helper ini butuh env ALLOWED_ORIGINS diisi daftar origin app
// (pisahkan dengan koma), mis:
//   supabase secrets set ALLOWED_ORIGINS=https://app.rekapanmitra.id,http://localhost:8080

/** Origin dev default agar lokal tetap jalan tanpa env tambahan. */
const DEFAULT_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
];

export function getAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  const configured = raw
    .split(",")
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
  return [...new Set([...configured, ...DEFAULT_DEV_ORIGINS])];
}

/** CORS headers dinamis: hanya echo Origin yang ada di allowlist. */
export function resolveCorsHeaders(req: Request, extraAllowHeaders?: string[]): HeadersInit {
  const origin = req.headers.get("Origin");
  const allowHeaders = [
    "authorization",
    "apikey",
    "content-type",
    "x-client-info",
    "x-supabase-client-platform",
    "x-supabase-client-platform-version",
    "x-supabase-client-runtime",
    "x-supabase-client-runtime-version",
    ...(extraAllowHeaders ?? []),
  ];
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": allowHeaders.join(", "),
    Vary: "Origin",
  };
  if (origin && getAllowedOrigins().includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export function jsonResponse(body: unknown, status: number, cors?: HeadersInit): Response {
  const headers = new Headers({ "Content-Type": "application/json", ...(cors ?? {}) });
  return new Response(JSON.stringify(body), { status, headers });
}

/** Log terstruktur satu baris (JSON) — mudah difilter di Supabase logs. */
export function logEvent(
  level: "info" | "warn" | "error",
  event: string,
  data: Record<string, unknown> = {},
) {
  const entry = { ts: new Date().toISOString(), level, event, ...data };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function base64UrlDecode(input: string): Uint8Array | null {
  try {
    const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(padded);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

interface JwtClaims {
  role?: string;
  sub?: string;
}

/**
 * Ambil klaim role/sub dari JWT pada header Authorization.
 * Signature SUDAH diverifikasi gateway (wajib verify_jwt=true di config.toml),
 * jadi cukup baca payload: tolak jika bukan sesi user sungguhan (role anon).
 */
export function authenticateUser(req: Request): { ok: true; userId: string } | { ok: false; reason: string } {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false, reason: "missing_authorization_header" };

  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed_token" };

  const payloadBytes = base64UrlDecode(parts[1]);
  if (!payloadBytes) return { ok: false, reason: "undecodable_payload" };

  let claims: JwtClaims;
  try {
    claims = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return { ok: false, reason: "invalid_json_payload" };
  }

  // Anon/publishable key memakai role "anon" — bukan user in-app.
  if (!claims.sub || claims.role !== "authenticated") {
    return { ok: false, reason: claims.role === "anon" ? "anon_key_not_allowed" : "not_authenticated_session" };
  }
  return { ok: true, userId: claims.sub };
}

/**
 * Perbandingan string konstan-waktu (untuk secret webhook Telegram).
 * Tidak bocorkan posisi byte pertama yang beda.
 */
export function secureCompare(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  const len = Math.max(ea.length, eb.length);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < len; i++) {
    diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  }
  return diff === 0;
}
