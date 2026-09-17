"use client";

import type { DataStats } from "@/lib/constants";

type Props = { kpi: DataStats["kpi"] | null; memuat: boolean };

/**
 * Tiga KPI disusun dalam satu panel yang dibagi garis tipis, bukan tiga kotak
 * terpisah, supaya terbaca seperti satu papan informasi di halte.
 */
export default function KpiPanel({ kpi, memuat }: Props) {
  const isi = [
    {
      judul: "Jumlah review",
      nilai: memuat || !kpi ? "—" : kpi.jumlah_review.toLocaleString("id-ID"),
      satuan: "review",
      warna: "#093FB4",
    },
    {
      judul: "Rata-rata bintang",
      nilai: memuat || !kpi ? "—" : Number(kpi.rata_bintang ?? 0).toFixed(2),
      satuan: "dari 5",
      warna: "#093FB4",
    },
    {
      judul: "Porsi keluhan",
      nilai: memuat || !kpi ? "—" : `${Number(kpi.persen_keluhan ?? 0).toFixed(1)}%`,
      satuan: "dari review terpilih",
      warna: "#ED3500",
    },
  ];

  return (
    <section
      aria-label="Ringkasan angka"
      className="grid grid-cols-1 divide-y divide-tj-rule rounded-lg border border-tj-rule bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0"
    >
      {isi.map((k) => (
        <div key={k.judul} className="px-5 py-6">
          <p className="text-xs text-tj-muted">{k.judul}</p>
          <p
            className="font-display text-5xl leading-none tracking-tight"
            style={{ color: k.warna }}
          >
            {k.nilai}
          </p>
          <p className="mt-1.5 text-xs text-tj-muted">{k.satuan}</p>
        </div>
      ))}
    </section>
  );
}
