// Unit test helper keamanan (K2 / IO-13).
// Jalankan: deno test supabase/functions/ --allow-env
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  authenticateUser,
  resolveCorsHeaders,
  secureCompare,
} from "./security.ts";

// ─── secureCompare ────────────────────────────────────────────────
Deno.test("secureCompare: string identik → true", () => {
  assertEquals(secureCompare("abc123", "abc123"), true);
});

Deno.test("secureCompare: beda 1 byte → false", () => {
  assertEquals(secureCompare("abc123", "abc124"), false);
});

Deno.test("secureCompare: panjang beda → false", () => {
  assertEquals(secureCompare("short", "a-much-longer-secret"), false);
  assertEquals(secureCompare("", ""), true);
});

Deno.test("secureCompare: kosong vs isi → false", () => {
  assertEquals(secureCompare("", "secret"), false);
});

// ─── authenticateUser ─────────────────────────────────────────────
function makeJwt(payload: Record<string, unknown>): string {
  const enc = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${enc({ alg: "HS256", typ: "JWT" })}.${enc(payload)}.signature-not-checked-here`;
}

const reqWith = (headers: Record<string, string>) =>
  new Request("https://example.com/fn", { method: "POST", headers });

Deno.test("authenticateUser: tanpa header Authorization → ditolak", () => {
  const r = authenticateUser(reqWith({}));
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.reason, "missing_authorization_header");
});

Deno.test("authenticateUser: token bukan JWT (1 segmen) → ditolak", () => {
  const r = authenticateUser(reqWith({ Authorization: "Bearer bukanjwt" }));
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.reason, "malformed_token");
});

Deno.test("authenticateUser: anon key (role=anon) → ditolak", () => {
  const jwt = makeJwt({ role: "anon", iss: "supabase" });
  const r = authenticateUser(reqWith({ Authorization: `Bearer ${jwt}` }));
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.reason, "anon_key_not_allowed");
});

Deno.test("authenticateUser: role authenticated tanpa sub → ditolak", () => {
  const jwt = makeJwt({ role: "authenticated" });
  const r = authenticateUser(reqWith({ Authorization: `Bearer ${jwt}` }));
  assertEquals(r.ok, false);
});

Deno.test("authenticateUser: sesi user sah → ok + userId", () => {
  const jwt = makeJwt({ role: "authenticated", sub: "user-uuid-1" });
  const r = authenticateUser(reqWith({ Authorization: `Bearer ${jwt}` }));
  assertEquals(r.ok, true);
  if (r.ok) assertEquals(r.userId, "user-uuid-1");
});

// ─── resolveCorsHeaders ───────────────────────────────────────────
Deno.test("CORS: origin dev localhost diizinkan default", () => {
  const headers = resolveCorsHeaders(
    reqWith({ Origin: "http://localhost:8080" }),
  ) as Record<string, string>;
  assertEquals(headers["Access-Control-Allow-Origin"], "http://localhost:8080");
});

Deno.test("CORS: origin asing tidak di-echo", () => {
  const headers = resolveCorsHeaders(
    reqWith({ Origin: "https://evil.example.com" }),
  ) as Record<string, string>;
  assertEquals(headers["Access-Control-Allow-Origin"], undefined);
});
