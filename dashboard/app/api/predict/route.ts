import { NextRequest, NextResponse } from "next/server";

// Selalu diproses di server, jangan pernah di-cache.
export const dynamic = "force-dynamic";

const BATAS_KARAKTER = 1000;

// Space gratis tertidur setelah lama tidak dipakai, dan butuh waktu untuk bangun.
const TIMEOUT_MS = 55_000;

export async function POST(req: NextRequest) {
  const apiUrl = process.env.PLAYGROUND_API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { error: "Alamat API Playground belum diatur di environment variables." },
      { status: 500 }
    );
  }

  let teks: string;
  try {
    const body = await req.json();
    teks = String(body?.teks ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak dikenali." }, { status: 400 });
  }

  if (!teks) {
    return NextResponse.json({ error: "Tulis dulu teks review yang mau diuji." }, { status: 400 });
  }
  if (teks.length > BATAS_KARAKTER) {
    return NextResponse.json(
      { error: `Teks terlalu panjang. Maksimal ${BATAS_KARAKTER} karakter.` },
      { status: 400 }
    );
  }

  const batalkan = AbortSignal.timeout(TIMEOUT_MS);

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teks }),
      signal: batalkan,
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Model sedang tidak bisa dihubungi. Coba lagi sebentar lagi." },
        { status: 502 }
      );
    }

    // Teks pengunjung berhenti di sini. Tidak ada yang ditulis ke database.
    return NextResponse.json(await res.json());
  } catch (e) {
    const timeout = e instanceof Error && e.name === "TimeoutError";
    return NextResponse.json(
      {
        error: timeout
          ? "Model sedang dinyalakan dan butuh waktu lebih lama. Coba klik Prediksi sekali lagi."
          : "Model sedang tidak bisa dihubungi. Coba lagi sebentar lagi.",
      },
      { status: 504 }
    );
  }
}
