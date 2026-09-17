"""
Koneksi ke Supabase untuk sisi pipeline.

Modul ini memakai SERVICE ROLE KEY, yang punya izin menulis penuh. Kunci ini
hanya boleh hidup di dua tempat: file .env di komputer Anda, dan GitHub Actions
Secrets. Jangan pernah menaruhnya di folder dashboard/ karena isi folder itu
ikut terkirim ke browser pengunjung.
"""

from __future__ import annotations

import logging
import os

from supabase import Client, create_client

log = logging.getLogger(__name__)

TABEL = "reviews"

# Supabase membatasi panjang satu permintaan, jadi data dipotong per bagian.
UKURAN_BATCH = 500


def buat_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL dan SUPABASE_SERVICE_KEY belum diisi. "
            "Di komputer, isi lewat file .env. Di GitHub, isi lewat Settings > "
            "Secrets and variables > Actions."
        )
    return create_client(url, key)


def ambil_id_yang_sudah_ada(client: Client, kandidat: list[str]) -> set[str]:
    """
    Tahap 4 pipeline: cek ID mana yang sudah ada di database.

    Ini dilakukan SEBELUM inference, supaya IndoBERT tidak membuang waktu
    memproses ulang review yang sudah pernah diklasifikasi.
    """
    sudah_ada: set[str] = set()

    for i in range(0, len(kandidat), UKURAN_BATCH):
        potongan = kandidat[i : i + UKURAN_BATCH]
        resp = client.table(TABEL).select("id").in_("id", potongan).execute()
        sudah_ada.update(baris["id"] for baris in (resp.data or []))

    log.info("%s dari %s ID sudah ada di database.", len(sudah_ada), len(kandidat))
    return sudah_ada


def simpan(client: Client, baris: list[dict]) -> int:
    """
    Tahap 7 pipeline: masukkan review baru ke database.

    Memakai upsert dengan kunci id. Kalau ada review yang lolos pengecekan tapi
    ternyata sudah ada, baris itu dilewati tanpa membuat error.
    """
    if not baris:
        return 0

    total = 0
    for i in range(0, len(baris), UKURAN_BATCH):
        potongan = baris[i : i + UKURAN_BATCH]
        client.table(TABEL).upsert(
            potongan, on_conflict="id", ignore_duplicates=True
        ).execute()
        total += len(potongan)
        log.info("Menyimpan %s baris (total %s).", len(potongan), total)

    return total
