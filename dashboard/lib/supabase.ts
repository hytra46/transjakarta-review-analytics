import { createClient } from "@supabase/supabase-js";

// File ini hanya dipakai oleh route handler di server, bukan oleh komponen browser.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi. " +
      "Di komputer isi lewat dashboard/.env.local, di Vercel lewat Settings > Environment Variables."
  );
}

// Anon key memang boleh dilihat publik. Row Level Security di Supabase hanya
// mengizinkan SELECT, jadi tidak ada yang bisa mengubah data lewat kunci ini.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});
