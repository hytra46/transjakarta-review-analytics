"""
Mengambil review aplikasi TJ:Transjakarta dari Google Play Store.

Versi ini mengembangkan kode Colab Anda dengan tiga perbaikan:
  1. Berhenti otomatis begitu sampai di review yang lebih lama dari tahun target,
     jadi tidak perlu menarik 15.000 review setiap hari.
  2. Validasi tiap baris (Tahap 3 pipeline di dokumen perencanaan).
  3. Logging dan penanganan error, supaya kegagalan terlihat jelas di GitHub Actions.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime

from google_play_scraper import Sort, reviews

log = logging.getLogger(__name__)

APP_ID = os.getenv("APP_ID", "com.transjakmobile")  # TJ:Transjakarta
TAHUN_TARGET = int(os.getenv("TAHUN_TARGET", "2026"))

# Jumlah review per permintaan ke Google. 200 adalah batas aman.
UKURAN_HALAMAN = 200

# Batas pengaman supaya scraper tidak berjalan tanpa henti kalau terjadi hal aneh.
MAKS_HALAMAN = 200


def ambil_review(
    app_id: str = APP_ID,
    tahun_target: int = TAHUN_TARGET,
    maks_halaman: int = MAKS_HALAMAN,
) -> list[dict]:
    """
    Tarik review terbaru lalu saring hanya tahun target.

    Review diminta urut dari yang paling baru. Begitu ketemu review yang tahunnya
    sudah di bawah tahun target, pengambilan dihentikan karena sisanya pasti lebih
    lama lagi.
    """
    terkumpul: list[dict] = []
    token = None
    halaman = 0

    while halaman < maks_halaman:
        halaman += 1
        try:
            hasil, token = reviews(
                app_id,
                lang="id",
                country="id",
                sort=Sort.NEWEST,
                count=UKURAN_HALAMAN,
                continuation_token=token,
            )
        except Exception as e:
            log.error("Gagal mengambil halaman %s: %s", halaman, e)
            break

        if not hasil:
            log.info("Halaman %s kosong, pengambilan selesai.", halaman)
            break

        berhenti = False
        for r in hasil:
            tanggal = r.get("at")
            if not isinstance(tanggal, datetime):
                continue

            if tanggal.year > tahun_target:
                continue  # review lebih baru dari target, lewati saja
            if tanggal.year < tahun_target:
                berhenti = True
                break

            terkumpul.append(
                {
                    "id": r.get("reviewId"),
                    "tanggal": tanggal,
                    "bintang": r.get("score"),
                    "teks": r.get("content"),
                }
            )

        log.info("Halaman %s selesai, total terkumpul %s review.", halaman, len(terkumpul))

        if berhenti:
            log.info("Sudah mencapai review sebelum tahun %s, berhenti.", tahun_target)
            break
        if token is None:
            log.info("Google tidak memberi halaman berikutnya, berhenti.")
            break

    return terkumpul


def validasi(baris: list[dict]) -> tuple[list[dict], list[str]]:
    """
    Tahap 3 pipeline: buang baris yang tidak layak masuk database.

    Mengembalikan (baris_bersih, daftar_alasan_ditolak).
    """
    bersih: list[dict] = []
    ditolak: list[str] = []
    id_terlihat: set[str] = set()

    for b in baris:
        rid = b.get("id")
        if not rid:
            ditolak.append("id kosong")
            continue
        if rid in id_terlihat:
            ditolak.append(f"{rid}: duplikat di dalam hasil scraping")
            continue

        teks = (b.get("teks") or "").strip()
        if not teks:
            ditolak.append(f"{rid}: teks kosong")
            continue

        bintang = b.get("bintang")
        if not isinstance(bintang, int) or not 1 <= bintang <= 5:
            ditolak.append(f"{rid}: bintang tidak valid ({bintang})")
            continue

        tanggal = b.get("tanggal")
        if not isinstance(tanggal, datetime):
            ditolak.append(f"{rid}: tanggal tidak valid")
            continue

        id_terlihat.add(rid)
        bersih.append(
            {
                "id": rid,
                "tanggal": tanggal.isoformat(),
                "bintang": bintang,
                "teks": teks,
            }
        )

    return bersih, ditolak


if __name__ == "__main__":
    # Tes mandiri: python scraper/scraper.py
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    mentah = ambil_review()
    bersih, ditolak = validasi(mentah)

    print(f"Review tahun {TAHUN_TARGET} yang terambil : {len(mentah)}")
    print(f"Lolos validasi                        : {len(bersih)}")
    print(f"Ditolak                               : {len(ditolak)}")
    if bersih:
        tanggal = sorted(b["tanggal"] for b in bersih)
        print(f"Rentang tanggal                       : {tanggal[0]} sampai {tanggal[-1]}")
        print("\nContoh baris pertama:")
        print(bersih[0])
    for alasan in ditolak[:10]:
        print("  ditolak:", alasan)
