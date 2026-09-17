// Konstanta dan tipe data yang dipakai bersama oleh komponen di browser
// maupun oleh route handler di server. File ini sengaja tidak mengandung
// koneksi database, supaya library Supabase tidak ikut terkirim ke browser.

// Ditulis persis seperti keluaran model, sesuai label2id di notebook training.
// Urutan di sini hanya menentukan urutan tampilan, bukan urutan id model.
export const LABELS = ["Apresiasi", "Keluhan", "Saran", "Pertanyaan"] as const;
export type Label = (typeof LABELS)[number];

export const WARNA_LABEL: Record<Label, string> = {
  Apresiasi: "#093FB4",
  Keluhan: "#ED3500",
  Saran: "#0B8A6A",
  Pertanyaan: "#7A5AF8",
};

// Di bawah angka ini prediksi model ditandai sebagai kurang meyakinkan.
export const AMBANG_RAGU = 0.6;

export const UKURAN_HALAMAN = 25;

export type Filter = {
  mulai: string | null; // format YYYY-MM-DD
  selesai: string | null;
  labels: Label[];
  bintang: number[];
  halaman: number;
};

export type Review = {
  id: string;
  tanggal: string;
  bintang: number;
  teks: string;
  label: Label;
  confidence: number | null;
};

export type DataStats = {
  kpi: { jumlah_review: number; rata_bintang: number; persen_keluhan: number };
  mingguan: { minggu: string; label: Label; jumlah: number }[];
  perLabel: { label: Label; jumlah: number }[];
  perBintang: { bintang: number; jumlah: number }[];
  terakhirUpdate: string | null;
  baris: Review[];
  totalBaris: number;
};
