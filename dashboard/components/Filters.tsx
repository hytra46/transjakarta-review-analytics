"use client";

import { LABELS, WARNA_LABEL, type Filter, type Label } from "@/lib/constants";

type Props = {
  filter: Filter;
  cari: string;
  onFilter: (f: Partial<Filter>) => void;
  onCari: (teks: string) => void;
  onReset: () => void;
};

export default function Filters({ filter, cari, onFilter, onCari, onReset }: Props) {
  function toggleLabel(l: Label) {
    const ada = filter.labels.includes(l);
    onFilter({ labels: ada ? filter.labels.filter((x) => x !== l) : [...filter.labels, l] });
  }

  function toggleBintang(b: number) {
    const ada = filter.bintang.includes(b);
    onFilter({ bintang: ada ? filter.bintang.filter((x) => x !== b) : [...filter.bintang, b] });
  }

  const adaFilter =
    filter.mulai || filter.selesai || filter.labels.length > 0 || filter.bintang.length > 0 || cari;

  return (
    <section
      aria-label="Filter data"
      className="rounded-lg border border-tj-rule bg-white p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div>
          <label htmlFor="mulai" className="mb-1 block text-xs text-tj-muted">
            Dari tanggal
          </label>
          <input
            id="mulai"
            type="date"
            value={filter.mulai ?? ""}
            onChange={(e) => onFilter({ mulai: e.target.value || null })}
            className="rounded border border-tj-rule px-2.5 py-1.5 text-sm"
          />
        </div>

        <div>
          <label htmlFor="selesai" className="mb-1 block text-xs text-tj-muted">
            Sampai tanggal
          </label>
          <input
            id="selesai"
            type="date"
            value={filter.selesai ?? ""}
            onChange={(e) => onFilter({ selesai: e.target.value || null })}
            className="rounded border border-tj-rule px-2.5 py-1.5 text-sm"
          />
        </div>

        <div className="min-w-[14rem] flex-1">
          <label htmlFor="cari" className="mb-1 block text-xs text-tj-muted">
            Cari kata dalam review
          </label>
          <input
            id="cari"
            type="search"
            value={cari}
            placeholder="misalnya: saldo, QR, error"
            onChange={(e) => onCari(e.target.value)}
            className="w-full rounded border border-tj-rule px-2.5 py-1.5 text-sm"
          />
        </div>

        {adaFilter && (
          <button
            type="button"
            onClick={onReset}
            className="rounded border border-tj-rule px-3 py-1.5 text-sm text-tj-muted hover:border-tj-blue hover:text-tj-blue"
          >
            Hapus semua filter
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
        <fieldset>
          <legend className="mb-2 text-xs text-tj-muted">Kategori</legend>
          <div className="flex flex-wrap gap-2">
            {LABELS.map((l) => {
              const aktif = filter.labels.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => toggleLabel(l)}
                  style={
                    aktif
                      ? { backgroundColor: WARNA_LABEL[l], borderColor: WARNA_LABEL[l] }
                      : { borderColor: WARNA_LABEL[l], color: WARNA_LABEL[l] }
                  }
                  className={`rounded-full border px-3 py-1 text-sm capitalize ${
                    aktif ? "text-white" : "bg-white"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs text-tj-muted">Bintang</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((b) => {
              const aktif = filter.bintang.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  aria-pressed={aktif}
                  aria-label={`${b} bintang`}
                  onClick={() => toggleBintang(b)}
                  className={`h-9 w-9 rounded border text-sm ${
                    aktif
                      ? "border-tj-blue bg-tj-blue text-white"
                      : "border-tj-rule bg-white text-tj-ink hover:border-tj-blue"
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </section>
  );
}
