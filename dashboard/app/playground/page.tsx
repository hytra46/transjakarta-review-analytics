"use client";

import { useState } from "react";
import { LABELS, WARNA_LABEL, type Label } from "@/lib/constants";

const BATAS = 1000;

const CONTOH = [
  "Aplikasinya enak dipakai, top up saldo cepat dan tiket QR langsung muncul.",
  "Sudah update tapi tetap force close waktu mau scan di halte.",
  "Tolong tambahkan notifikasi kalau bus sudah dekat halte.",
  "Kenapa saldo saya belum masuk padahal sudah bayar kemarin?",
];

type Hasil = {
  label: Label;
  confidence: number;
  probabilitas: Record<Label, number>;
};

export default function Playground() {
  const [teks, setTeks] = useState("");
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function prediksi() {
    const bersih = teks.trim();
    if (!bersih) {
      setError("Tulis dulu teks review yang mau diuji.");
      return;
    }

    setMemuat(true);
    setError(null);
    setHasil(null);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teks: bersih }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Prediksi gagal.");
      setHasil(json as Hasil);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prediksi gagal.");
    } finally {
      setMemuat(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-tj-ink">
          Coba sendiri model IndoBERT
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-tj-muted">
          Tulis kalimat seperti review aplikasi, lalu lihat model menempatkannya di kategori
          mana. Model yang dipakai di sini sama persis dengan yang memberi label pada data di
          halaman Analytics. Teks yang Anda tulis tidak disimpan ke mana pun.
        </p>
      </div>

      <div className="rounded-lg border border-tj-rule bg-white p-5">
        <label htmlFor="teks" className="mb-2 block text-xs text-tj-muted">
          Teks review
        </label>
        <textarea
          id="teks"
          rows={4}
          maxLength={BATAS}
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") prediksi();
          }}
          placeholder="Contoh: aplikasinya sering error waktu mau scan QR di halte"
          className="w-full resize-y rounded border border-tj-rule p-3 text-sm leading-relaxed"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={prediksi}
            disabled={memuat}
            className="rounded bg-tj-blue px-5 py-2 text-sm text-tj-white hover:bg-tj-blueDark disabled:opacity-60"
          >
            {memuat ? "Memproses…" : "Prediksi"}
          </button>
          <span className="text-xs text-tj-muted">
            {teks.length}/{BATAS} karakter
          </span>
        </div>

        <div className="mt-5 border-t border-tj-rule pt-4">
          <p className="mb-2 text-xs text-tj-muted">Atau pakai salah satu contoh ini</p>
          <div className="flex flex-wrap gap-2">
            {CONTOH.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTeks(c)}
                className="max-w-full truncate rounded-full border border-tj-rule px-3 py-1 text-xs text-tj-muted hover:border-tj-blue hover:text-tj-blue"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-tj-orange/40 bg-tj-orange/5 px-5 py-4 text-sm"
        >
          {error}
        </div>
      )}

      {hasil && (
        <div className="rounded-lg border border-tj-rule bg-white p-5">
          <p className="text-xs text-tj-muted">Model memilih kategori</p>
          <p
            className="font-display text-4xl capitalize leading-tight"
            style={{ color: WARNA_LABEL[hasil.label] }}
          >
            {hasil.label}
          </p>
          <p className="mb-6 mt-1 text-xs text-tj-muted">
            dengan keyakinan {(hasil.confidence * 100).toFixed(1)}%
          </p>

          <div className="space-y-3">
            {LABELS.map((l) => {
              const nilai = hasil.probabilitas[l] ?? 0;
              return (
                <div key={l}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="capitalize text-tj-ink">{l}</span>
                    <span className="tabular-nums text-tj-muted">
                      {(nilai * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-tj-blueSoft">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(nilai * 100, 0.6)}%`,
                        backgroundColor: WARNA_LABEL[l],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-tj-muted">
            Angka di atas adalah probabilitas menurut model, bukan ukuran kebenaran. Model
            bisa saja sangat yakin namun tetap keliru, terutama pada kalimat pendek atau
            kalimat yang mencampur pujian dan keluhan sekaligus. Kategori Saran dan
            Pertanyaan hanya punya sedikit contoh saat pelatihan, jadi paling sering meleset.
          </p>
        </div>
      )}
    </div>
  );
}
