import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { UKURAN_HALAMAN, type DataStats } from "@/lib/constants";

// Data di-cache 60 detik. Kalau 100 orang membuka dashboard bersamaan,
// Supabase tidak ditanya 100 kali.
export const revalidate = 60;

/** Ubah parameter URL menjadi argumen yang dimengerti fungsi SQL di Supabase. */
function bacaFilter(req: NextRequest) {
  const q = req.nextUrl.searchParams;

  const mulai = q.get("mulai");
  const selesai = q.get("selesai");
  const labels = q.get("labels");
  const bintang = q.get("bintang");
  const halaman = Math.max(1, Number(q.get("halaman") ?? 1));
  const cari = (q.get("cari") ?? "").trim();

  return {
    rpc: {
      // null berarti tanpa filter, sesuai aturan di database/schema.sql
      p_start: mulai ? `${mulai}T00:00:00Z` : null,
      // tanggal akhir ditambah satu hari supaya review di hari itu ikut terhitung
      p_end: selesai ? `${tambahSatuHari(selesai)}T00:00:00Z` : null,
      p_labels: labels ? labels.split(",").filter(Boolean) : null,
      p_bintang: bintang ? bintang.split(",").filter(Boolean).map(Number) : null,
    },
    halaman,
    cari,
  };
}

function tambahSatuHari(tanggal: string): string {
  const d = new Date(`${tanggal}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { rpc, halaman, cari } = bacaFilter(req);

  try {
    const supabase = getSupabase();

    // Tabel detail diambil terpisah, karena perlu paginasi dan pencarian teks.
    let query = supabase
      .from("reviews")
      .select("id, tanggal, bintang, teks, label, confidence", { count: "exact" })
      .order("tanggal", { ascending: false });

    if (rpc.p_start) query = query.gte("tanggal", rpc.p_start);
    if (rpc.p_end) query = query.lt("tanggal", rpc.p_end);
    if (rpc.p_labels) query = query.in("label", rpc.p_labels);
    if (rpc.p_bintang) query = query.in("bintang", rpc.p_bintang);
    if (cari) query = query.ilike("teks", `%${cari}%`);

    const dari = (halaman - 1) * UKURAN_HALAMAN;
    query = query.range(dari, dari + UKURAN_HALAMAN - 1);

    // Semua permintaan dijalankan bersamaan supaya halaman terbuka lebih cepat.
    const [kpi, mingguan, perLabel, perBintang, update, tabel] = await Promise.all([
      supabase.rpc("review_kpi", rpc),
      supabase.rpc("review_mingguan", rpc),
      supabase.rpc("review_per_label", rpc),
      supabase.rpc("review_per_bintang", rpc),
      supabase.rpc("review_terakhir_update"),
      query,
    ]);

    const gagal = [kpi, mingguan, perLabel, perBintang, update, tabel].find((r) => r.error);
    if (gagal?.error) throw new Error(gagal.error.message);

    const data: DataStats = {
      kpi: kpi.data?.[0] ?? { jumlah_review: 0, rata_bintang: 0, persen_keluhan: 0 },
      mingguan: mingguan.data ?? [],
      perLabel: perLabel.data ?? [],
      perBintang: perBintang.data ?? [],
      terakhirUpdate: (update.data as string | null) ?? null,
      baris: tabel.data ?? [],
      totalBaris: tabel.count ?? 0,
    };

    return NextResponse.json(data);
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "Penyebab tidak diketahui";
    console.error("Gagal mengambil data dashboard:", pesan);
    return NextResponse.json(
      { error: "Data gagal dimuat dari database. Coba muat ulang halaman." },
      { status: 502 }
    );
  }
}
