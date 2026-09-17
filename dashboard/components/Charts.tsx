"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LABELS, WARNA_LABEL, type DataStats, type Label } from "@/lib/constants";

const SUMBU = { fontSize: 12, fill: "#5A6480" };
const GRID = "#E2E6F0";

function Kartu({
  judul,
  keterangan,
  children,
}: {
  judul: string;
  keterangan: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-tj-rule bg-white p-5">
      <h2 className="font-display text-xl tracking-wide text-tj-ink">{judul}</h2>
      <p className="mb-4 mt-0.5 text-xs text-tj-muted">{keterangan}</p>
      <div className="h-64">{children}</div>
    </section>
  );
}

function Kosong() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-tj-muted">
      Belum ada data yang cocok dengan filter ini.
    </div>
  );
}

function tanggalPendek(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

/** Line chart jumlah tiap kategori per minggu. */
export function TrenMingguan({ data }: { data: DataStats["mingguan"] }) {
  // Ubah data panjang (satu baris per minggu per label) menjadi data lebar
  // (satu baris per minggu, satu kolom per label), bentuk yang dibutuhkan recharts.
  const perMinggu = new Map<string, Record<string, number | string>>();
  for (const b of data) {
    const baris =
      perMinggu.get(b.minggu) ??
      ({ minggu: b.minggu, ...Object.fromEntries(LABELS.map((l) => [l, 0])) } as Record<
        string,
        number | string
      >);
    baris[b.label] = Number(b.jumlah);
    perMinggu.set(b.minggu, baris);
  }
  const rows = [...perMinggu.values()].sort((a, b) =>
    String(a.minggu).localeCompare(String(b.minggu))
  );

  return (
    <Kartu judul="Tren kategori per minggu" keterangan="Jumlah review tiap kategori, dikelompokkan per pekan">
      {rows.length === 0 ? (
        <Kosong />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="minggu" tickFormatter={tanggalPendek} tick={SUMBU} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis allowDecimals={false} tick={SUMBU} tickLine={false} axisLine={false} />
            <Tooltip
              labelFormatter={(v) => `Pekan ${tanggalPendek(String(v))}`}
              contentStyle={{ borderRadius: 6, border: `1px solid ${GRID}`, fontSize: 13 }}
            />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {LABELS.map((l) => (
              <Line
                key={l}
                type="monotone"
                dataKey={l}
                stroke={WARNA_LABEL[l]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Kartu>
  );
}

/** Bar chart jumlah review per kategori. */
export function DistribusiLabel({ data }: { data: DataStats["perLabel"] }) {
  const rows = data.map((d) => ({ label: d.label, jumlah: Number(d.jumlah) }));

  return (
    <Kartu judul="Jumlah per kategori" keterangan="Hasil klasifikasi IndoBERT atas review terpilih">
      {rows.length === 0 ? (
        <Kosong />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 24 }}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={SUMBU} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis type="category" dataKey="label" width={80} tick={SUMBU} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "#F2F5FC" }}
              contentStyle={{ borderRadius: 6, border: `1px solid ${GRID}`, fontSize: 13 }}
            />
            <Bar dataKey="jumlah" radius={[0, 3, 3, 0]} maxBarSize={28}>
              {rows.map((r) => (
                <Cell key={r.label} fill={WARNA_LABEL[r.label as Label]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Kartu>
  );
}

/** Bar chart jumlah review per nilai bintang. */
export function DistribusiBintang({ data }: { data: DataStats["perBintang"] }) {
  const peta = new Map(data.map((d) => [Number(d.bintang), Number(d.jumlah)]));
  const rows = [1, 2, 3, 4, 5].map((b) => ({ bintang: `${b}`, jumlah: peta.get(b) ?? 0 }));
  const kosong = rows.every((r) => r.jumlah === 0);

  return (
    <Kartu judul="Sebaran bintang" keterangan="Berapa banyak review di tiap nilai bintang">
      {kosong ? (
        <Kosong />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="bintang" tick={SUMBU} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis allowDecimals={false} tick={SUMBU} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "#F2F5FC" }}
              labelFormatter={(v) => `${v} bintang`}
              contentStyle={{ borderRadius: 6, border: `1px solid ${GRID}`, fontSize: 13 }}
            />
            {/* Bintang 1 dan 2 diberi warna oranye supaya sisi negatif langsung terlihat. */}
            <Bar dataKey="jumlah" radius={[3, 3, 0, 0]} maxBarSize={56}>
              {rows.map((r) => (
                <Cell key={r.bintang} fill={Number(r.bintang) <= 2 ? "#ED3500" : "#093FB4"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Kartu>
  );
}
