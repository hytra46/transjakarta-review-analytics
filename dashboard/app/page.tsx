"use client";

import { useCallback, useEffect, useState } from "react";
import { DistribusiBintang, DistribusiLabel, TrenMingguan } from "@/components/Charts";
import Filters from "@/components/Filters";
import KpiPanel from "@/components/KpiPanel";
import ReviewTable from "@/components/ReviewTable";
import type { DataStats, Filter } from "@/lib/constants";

const FILTER_AWAL: Filter = {
  mulai: null,
  selesai: null,
  labels: [],
  bintang: [],
  halaman: 1,
};

export default function Dashboard() {
  const [filter, setFilter] = useState<Filter>(FILTER_AWAL);
  const [cari, setCari] = useState("");
  const [cariTertunda, setCariTertunda] = useState("");
  const [data, setData] = useState<DataStats | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tunggu 400 ms setelah pengguna berhenti mengetik, supaya database tidak
  // ditanya setiap kali satu huruf ditekan.
  useEffect(() => {
    const t = setTimeout(() => setCariTertunda(cari), 400);
    return () => clearTimeout(t);
  }, [cari]);

  useEffect(() => {
    const batal = new AbortController();

    async function ambil() {
      setMemuat(true);
      setError(null);

      const q = new URLSearchParams();
      if (filter.mulai) q.set("mulai", filter.mulai);
      if (filter.selesai) q.set("selesai", filter.selesai);
      if (filter.labels.length) q.set("labels", filter.labels.join(","));
      if (filter.bintang.length) q.set("bintang", filter.bintang.join(","));
      if (cariTertunda) q.set("cari", cariTertunda);
      q.set("halaman", String(filter.halaman));

      try {
        const res = await fetch(`/api/stats?${q}`, { signal: batal.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Data gagal dimuat.");
        setData(json as DataStats);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Data gagal dimuat.");
      } finally {
        setMemuat(false);
      }
    }

    ambil();
    return () => batal.abort();
  }, [filter, cariTertunda]);

  // Setiap perubahan filter mengembalikan tabel ke halaman pertama.
  const ubahFilter = useCallback((f: Partial<Filter>) => {
    setFilter((lama) => ({ ...lama, ...f, halaman: 1 }));
  }, []);

  const reset = useCallback(() => {
    setFilter(FILTER_AWAL);
    setCari("");
  }, []);

  const terakhir = data?.terakhirUpdate
    ? new Date(data.terakhirUpdate).toLocaleString("id-ID", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="font-display text-3xl tracking-wide text-tj-ink">
          Review aplikasi TransJakarta sepanjang 2026
        </h1>
        <p className="text-xs text-tj-muted">
          {terakhir ? `Terakhir diperbarui ${terakhir} WIB` : "Menunggu pembaruan pertama"}
        </p>
      </div>

      <Filters
        filter={filter}
        cari={cari}
        onFilter={ubahFilter}
        onCari={setCari}
        onReset={reset}
      />

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-tj-orange/40 bg-tj-orange/5 px-5 py-4 text-sm text-tj-ink"
        >
          {error} Kalau terus berulang, periksa environment variable Supabase di Vercel.
        </div>
      )}

      <KpiPanel kpi={data?.kpi ?? null} memuat={memuat} />

      <TrenMingguan data={data?.mingguan ?? []} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DistribusiLabel data={data?.perLabel ?? []} />
        <DistribusiBintang data={data?.perBintang ?? []} />
      </div>

      <ReviewTable
        baris={data?.baris ?? []}
        total={data?.totalBaris ?? 0}
        halaman={filter.halaman}
        memuat={memuat}
        onHalaman={(h) => setFilter((lama) => ({ ...lama, halaman: h }))}
      />

      <div className="space-y-2 border-t border-tj-rule pt-5 text-xs leading-relaxed text-tj-muted">
        <p>
          Kategori pada setiap review adalah hasil prediksi model IndoBERT, bukan penilaian
          manusia. Angka confidence menunjukkan seberapa yakin model terhadap pilihannya, dan
          bukan jaminan bahwa kategorinya benar. Nilai di bawah 60% ditandai warna oranye.
        </p>
        <p>
          Model dilatih pada 2.265 review berlabel manual dengan komposisi yang timpang:
          Apresiasi 1.414, Keluhan 647, Saran 128, dan Pertanyaan 76. Kategori Saran dan
          Pertanyaan punya contoh paling sedikit, sehingga prediksi pada dua kategori itu
          paling perlu dibaca dengan hati-hati.
        </p>
      </div>
    </div>
  );
}
