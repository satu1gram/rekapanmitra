// Edge Function: delete-account
// Permanently deletes the signed-in user's account and all of their business data.
// Required by the App Store / Play Store for apps that let people create an account.
//
// Security:
// - verify_jwt = true (supabase/config.toml) and the user is re-read from the token here;
//   the user id is never taken from the request body.
// - The caller must send { "confirm": "HAPUS AKUN" } so a stray request cannot delete an account.
// - Admin accounts are refused (they manage the shared catalog) and must be removed by another admin.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const CONFIRM_TEXT = "HAPUS AKUN";
const PROOF_BUCKET = "transfer-proofs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// Child rows first. Several of these tables reference auth.users WITHOUT "on delete cascade"
// (order_items, order_expenses, general_income, products), which would otherwise block deleteUser.
const USER_TABLES: { table: string; column: string }[] = [
  { table: "order_expenses", column: "user_id" },
  { table: "order_items", column: "user_id" },
  { table: "stock_entries", column: "user_id" },
  { table: "orders", column: "user_id" },
  { table: "customers", column: "user_id" },
  { table: "general_expenses", column: "user_id" },
  { table: "general_income", column: "user_id" },
  { table: "monthly_targets", column: "user_id" },
  { table: "products", column: "user_id" },
  { table: "store_settings", column: "user_id" },
  { table: "user_stock", column: "user_id" },
  { table: "user_mitra_levels", column: "user_id" },
  { table: "telegram_bot_registrations", column: "user_id" },
  { table: "telegram_sessions", column: "tenant_id" },
  { table: "telegram_connections", column: "tenant_id" },
  { table: "profiles", column: "user_id" },
];

/** A table that does not exist on this database is not an error. */
function isMissingTable(error: { code?: string; message?: string } | null) {
  return !!error && (error.code === "42P01" || error.code === "PGRST205" || /does not exist|schema cache/i.test(error.message ?? ""));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Metode tidak didukung." });

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { error: "Sesi tidak ditemukan. Silakan masuk lagi." });

  let body: { confirm?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // handled below
  }
  if (body.confirm !== CONFIRM_TEXT) return json(400, { error: `Konfirmasi tidak sesuai. Ketik ${CONFIRM_TEXT}.` });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) return json(401, { error: "Sesi berakhir. Silakan masuk lagi." });
  const userId = user.id;

  const { data: profile } = await admin.from("profiles").select("role").eq("user_id", userId).maybeSingle();
  if ((profile as { role?: string } | null)?.role === "admin") {
    return json(403, { error: "Akun admin tidak bisa dihapus dari aplikasi. Minta admin lain menghapusnya." });
  }

  try {
    // 1. Transfer proof photos: "<user id>/<file>" in the transfer-proofs bucket.
    for (;;) {
      const { data: files, error } = await admin.storage.from(PROOF_BUCKET).list(userId, { limit: 100 });
      if (error) throw error;
      if (!files || files.length === 0) break;
      const { error: removeError } = await admin.storage.from(PROOF_BUCKET).remove(files.map((f) => `${userId}/${f.name}`));
      if (removeError) throw removeError;
      if (files.length < 100) break;
    }

    // 2. Telegram connections this user created for someone else's store keep working, without the link.
    const { error: connectedByError } = await admin.from("telegram_connections").update({ connected_by: null }).eq("connected_by", userId);
    if (connectedByError && !isMissingTable(connectedByError)) throw connectedByError;

    // 3. Business data.
    for (const { table, column } of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq(column, userId);
      if (error && !isMissingTable(error)) throw new Error(`${table}: ${error.message}`);
    }

    // 4. The login itself.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;
  } catch (error) {
    console.error("delete-account failed", userId, error);
    return json(500, { error: "Akun gagal dihapus. Coba lagi atau hubungi admin." });
  }

  console.log("delete-account done", userId);
  return json(200, { ok: true });
});
