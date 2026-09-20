import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// File ini hanya dipakai oleh route handler di server, bukan oleh komponen browser.
//
// Client dibuat lewat fungsi (bukan langsung di top-level module) supaya
// kalau environment variable-nya belum terisi, errornya baru muncul saat
// benar-benar dipakai di dalam try/catch route handler, dan bisa ditampilkan
// sebagai pesan JSON yang jelas ke pengguna. Kalau errornya dilempar di
// top-level module, seluruh route langsung crash sebelum sempat masuk
// try/catch, dan Next.js menampilkan halaman error HTML generik yang bikin
// bingung ("Unexpected token '<' ... is not valid JSON").

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi. " +
        "Di komputer isi lewat dashboard/.env.local, di Vercel lewat Settings > " +
        "Environment Variables, lalu jangan lupa redeploy setelah mengisinya."
    );
  }

  // Publishable key (dulu bernama anon key) memang boleh dilihat publik. Row
  // Level Security di Supabase hanya mengizinkan SELECT, jadi tidak ada yang
  // bisa mengubah data lewat kunci ini.
  cached = createClient(url, publishableKey, { auth: { persistSession: false } });
  return cached;
}
