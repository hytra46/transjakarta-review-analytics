"""
Pipeline end-to-end. Inilah yang dijalankan GitHub Actions setiap hari.

Urutannya persis mengikuti Bab 6 dokumen perencanaan:
    Extract -> Scope -> Validate -> Deduplicate -> Transform -> Predict -> Load

Jalankan manual di komputer:
    python pipeline/run_pipeline.py
Coba dulu tanpa menyimpan apa pun:
    python pipeline/run_pipeline.py --dry-run
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

# Supaya folder scraper/, model/, dan database/ bisa diimpor dari mana saja.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database.supabase_client import ambil_id_yang_sudah_ada, buat_client, simpan  # noqa: E402
from model.inference import prediksi  # noqa: E402
from scraper.scraper import TAHUN_TARGET, ambil_review, validasi  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("pipeline")


def jalankan(dry_run: bool = False) -> int:
    log.info("=" * 60)
    log.info("Pipeline dimulai, tahun target %s", TAHUN_TARGET)
    log.info("=" * 60)

    # --- Tahap 1 dan 2: Extract dan Scope -----------------------------
    mentah = ambil_review()
    log.info("Tahap 1-2 Extract dan Scope : %s review tahun %s", len(mentah), TAHUN_TARGET)
    if not mentah:
        log.warning("Tidak ada review yang terambil. Data lama di database tetap aman.")
        return 0

    # --- Tahap 3: Validate --------------------------------------------
    bersih, ditolak = validasi(mentah)
    log.info("Tahap 3 Validate            : %s lolos, %s ditolak", len(bersih), len(ditolak))
    for alasan in ditolak[:5]:
        log.debug("  ditolak: %s", alasan)
    if not bersih:
        log.warning("Tidak ada baris yang lolos validasi.")
        return 0

    # --- Tahap 4: Deduplicate -----------------------------------------
    client = buat_client()
    sudah_ada = ambil_id_yang_sudah_ada(client, [b["id"] for b in bersih])
    baru = [b for b in bersih if b["id"] not in sudah_ada]
    log.info("Tahap 4 Deduplicate         : %s review benar-benar baru", len(baru))

    if not baru:
        log.info("Tidak ada review baru hari ini. Pipeline selesai tanpa perubahan.")
        return 0

    # --- Tahap 5 dan 6: Transform dan Predict -------------------------
    log.info("Tahap 5-6 Predict           : memuat IndoBERT dan memproses %s teks", len(baru))
    hasil = prediksi([b["teks"] for b in baru])

    for baris, out in zip(baru, hasil):
        baris["label"] = out["label"]
        baris["confidence"] = out["confidence"]

    ringkasan: dict[str, int] = {}
    for b in baru:
        ringkasan[b["label"]] = ringkasan.get(b["label"], 0) + 1
    log.info("Distribusi label baru       : %s", ringkasan)

    # --- Tahap 7: Load ------------------------------------------------
    if dry_run:
        log.info("Mode dry-run, tidak ada yang disimpan. Contoh hasil:")
        for b in baru[:3]:
            log.info("  [%s %.0f%%] %s", b["label"], b["confidence"] * 100, b["teks"][:70])
        return 0

    jumlah = simpan(client, baru)
    log.info("Tahap 7 Load                : %s review tersimpan ke Supabase", jumlah)
    log.info("Pipeline selesai.")
    return jumlah


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Jalankan semuanya tapi jangan menyimpan ke database",
    )
    args = parser.parse_args()

    try:
        jalankan(dry_run=args.dry_run)
    except Exception:
        log.exception("Pipeline gagal. Data lama di database tidak diubah.")
        sys.exit(1)
