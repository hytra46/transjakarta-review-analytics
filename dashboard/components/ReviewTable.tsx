"use client";

import { AMBANG_RAGU, UKURAN_HALAMAN, WARNA_LABEL, type Review } from "@/lib/constants";

type Props = {
  baris: Review[];
  total: number;
  halaman: number;
  memuat: boolean;
  onHalaman: (h: number) => void;
};

function tanggalPanjang(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ReviewTable({ baris, total, halaman, memuat, onHalaman }: Props) {
  const totalHalaman = Math.max(1, Math.ceil(total / UKURAN_HALAMAN));
  const dari = total === 0 ? 0 : (halaman - 1) * UKURAN_HALAMAN + 1;
  const sampai = Math.min(halaman * UKURAN_HALAMAN, total);

  return (
    <section className="rounded-lg border border-tj-rule bg-white">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-tj-rule px-5 py-4">
        <h2 className="font-display text-xl tracking-wide text-tj-ink">Detail review</h2>
        <p className="text-xs text-tj-muted">
          {total === 0
            ? "Tidak ada review yang cocok"
            : `Menampilkan ${dari}–${sampai} dari ${total.toLocaleString("id-ID")} review`}
        </p>
      </div>

      {/* Tabel bisa digeser ke samping di layar kecil, halaman tidak ikut melar. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="border-b border-tj-rule text-left text-xs text-tj-muted">
              <th scope="col" className="px-5 py-2.5 font-normal">Tanggal</th>
              <th scope="col" className="px-3 py-2.5 font-normal">Bintang</th>
              <th scope="col" className="px-3 py-2.5 font-normal">Review</th>
              <th scope="col" className="px-3 py-2.5 font-normal">Kategori</th>
              <th scope="col" className="px-5 py-2.5 text-right font-normal">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {memuat && baris.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-tj-muted">
                  Memuat data…
                </td>
              </tr>
            )}

            {!memuat && baris.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-tj-muted">
                  Tidak ada review yang cocok. Longgarkan filternya.
                </td>
              </tr>
            )}

            {baris.map((r) => (
              <tr key={r.id} className="border-b border-tj-rule/60 align-top last:border-0">
                <td className="whitespace-nowrap px-5 py-3 text-tj-muted">
                  {tanggalPanjang(r.tanggal)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 tabular-nums">
                  <span className={r.bintang <= 2 ? "text-tj-orange" : "text-tj-ink"}>
                    {r.bintang}
                  </span>
                  <span className="text-tj-muted">/5</span>
                </td>
                <td className="max-w-md px-3 py-3 leading-relaxed">{r.teks}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs capitalize text-white"
                    style={{ backgroundColor: WARNA_LABEL[r.label] }}
                  >
                    {r.label}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">
                  {r.confidence == null ? (
                    <span className="text-tj-muted">—</span>
                  ) : Number(r.confidence) < AMBANG_RAGU ? (
                    // Prediksi lemah ditandai supaya tidak dibaca sebagai fakta.
                    <span
                      className="text-tj-orange"
                      title="Model kurang yakin pada review ini"
                    >
                      {(Number(r.confidence) * 100).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-tj-muted">
                      {(Number(r.confidence) * 100).toFixed(0)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalHalaman > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-tj-rule px-5 py-3">
          <button
            type="button"
            disabled={halaman <= 1}
            onClick={() => onHalaman(halaman - 1)}
            className="rounded border border-tj-rule px-3 py-1.5 text-sm disabled:opacity-40 enabled:hover:border-tj-blue enabled:hover:text-tj-blue"
          >
            Sebelumnya
          </button>
          <span className="text-xs text-tj-muted">
            Halaman {halaman} dari {totalHalaman}
          </span>
          <button
            type="button"
            disabled={halaman >= totalHalaman}
            onClick={() => onHalaman(halaman + 1)}
            className="rounded border border-tj-rule px-3 py-1.5 text-sm disabled:opacity-40 enabled:hover:border-tj-blue enabled:hover:text-tj-blue"
          >
            Berikutnya
          </button>
        </div>
      )}
    </section>
  );
}
