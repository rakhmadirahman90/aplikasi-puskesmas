import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) return json({ error: "Sesi admin tidak ditemukan." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Konfigurasi backend belum lengkap." }, 500);

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: identity, error: identityError } = await caller.auth.getUser();
    if (identityError || !identity.user) return json({ error: "Sesi login tidak valid." }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile, error: profileError } = await admin
      .from("app_users")
      .select("role")
      .eq("auth_user_id", identity.user.id)
      .maybeSingle();

    if (profileError) return json({ error: "Gagal memverifikasi hak akses admin." }, 500);
    if (profile?.role !== "admin") return json({ error: "Hanya Admin yang dapat mereset password user." }, 403);

    const body = await req.json();
    const authUserId = typeof body?.authUserId === "string" ? body.authUserId.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!authUserId) return json({ error: "Akun user belum terhubung ke Supabase Auth." }, 400);
    if (password.length < 8) return json({ error: "Password baru minimal 8 karakter." }, 400);

    const { error: updateError } = await admin.auth.admin.updateUserById(authUserId, { password });
    if (updateError) return json({ error: updateError.message }, 400);

    return json({ ok: true });
  } catch {
    return json({ error: "Terjadi kesalahan saat mereset password." }, 500);
  }
});
