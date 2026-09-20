"""
Satu-satunya tempat inference IndoBERT dijalankan.

Modul ini dipakai oleh dua pihak:
  - pipeline/run_pipeline.py  (dijalankan GitHub Actions setiap hari)
  - space/app.py              (API Playground di Hugging Face Spaces)

Keduanya memakai fungsi yang sama supaya hasil prediksi di dashboard dan di
Playground tidak pernah berbeda, sesuai Bab 7 dokumen perencanaan.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Iterable

import torch
import torch.nn.functional as F
from transformers import AutoModelForSequenceClassification, AutoTokenizer

log = logging.getLogger(__name__)

# ID repo model di Hugging Face, hasil dari convert_pkl_to_hf.py
HF_MODEL_ID = os.getenv("HF_MODEL_ID", "GANTI_USERNAME/indobert-tj-review")

# Panjang token maksimal. Nilai 64 diambil dari notebook training Anda
# (tokenize_batch memakai max_length=64). Jangan diubah tanpa melatih ulang model.
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "64"))

# Jumlah teks yang diproses sekaligus. Angka kecil lebih aman untuk RAM terbatas.
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "32"))

# Set TORCH_DTYPE=float16 untuk memuat model dalam presisi setengah, kira-kira
# separuh ukuran RAM dari float32 (sekitar 220 MB, bukan 440 MB, untuk model
# sebesar IndoBERT base). Berguna di platform dengan RAM gratis yang ketat
# seperti Render (512 MB). Sedikit lebih lambat di CPU, tapi untuk Playground
# yang dipakai satu per satu, itu tidak terasa. Biarkan kosong di GitHub
# Actions, karena di sana RAM biasanya cukup dan presisi penuh lebih aman.
TORCH_DTYPE = os.getenv("TORCH_DTYPE", "").strip().lower()

# Batasi jumlah thread. Instance gratis biasanya cuma diberi sebagian kecil
# dari satu core CPU, dan PyTorch yang mencoba memakai banyak thread di CPU
# sekecil itu justru menghabiskan RAM tambahan untuk overhead tanpa manfaat.
torch.set_num_threads(int(os.getenv("TORCH_NUM_THREADS", "1")))


def bersihkan_teks(teks: str) -> str:
    """
    Preprocessing saat inference.

    Notebook training Anda memberi teks mentah langsung ke tokenizer, tanpa
    lowercase, tanpa membuang URL, tanda baca, maupun emoji. Karena itu fungsi
    ini sengaja TIDAK mengubah apa pun, supaya teks yang dilihat model saat
    inference sama persis dengan yang dilihatnya saat training.

    Jangan tambahkan langkah pembersihan di sini kecuali Anda melatih ulang
    model dengan pembersihan yang sama.
    """
    return "" if teks is None else str(teks)


@lru_cache(maxsize=1)
def muat_model():
    """Unduh dan muat model sekali saja, lalu simpan di memori."""
    log.info("Memuat model %s", HF_MODEL_ID)
    token = os.getenv("HF_TOKEN")  # hanya perlu kalau repo model Anda privat
    tokenizer = AutoTokenizer.from_pretrained(HF_MODEL_ID, token=token)

    kwargs = {}
    if TORCH_DTYPE == "float16":
        kwargs["torch_dtype"] = torch.float16
        log.info("Memuat model dalam float16 untuk menghemat RAM.")

    model = AutoModelForSequenceClassification.from_pretrained(
        HF_MODEL_ID, token=token, **kwargs
    )
    model.eval()

    id2label = {int(i): str(l) for i, l in model.config.id2label.items()}
    urutan_label = [id2label[i] for i in sorted(id2label)]
    log.info("Model siap. Label: %s", urutan_label)
    return tokenizer, model, urutan_label


def prediksi(teks_list: Iterable[str]) -> list[dict]:
    """
    Terima daftar teks, kembalikan daftar hasil prediksi.

    Setiap hasil berbentuk:
        {
          "label": "Keluhan",
          "confidence": 0.9134,
          "probabilitas": {"Apresiasi": 0.02, "Keluhan": 0.91, ...}
        }
    """
    teks_list = [bersihkan_teks(t) for t in teks_list]
    if not teks_list:
        return []

    tokenizer, model, urutan_label = muat_model()
    hasil: list[dict] = []

    for i in range(0, len(teks_list), BATCH_SIZE):
        batch = teks_list[i : i + BATCH_SIZE]
        inputs = tokenizer(
            batch,
            padding=True,
            truncation=True,
            max_length=MAX_LENGTH,
            return_tensors="pt",
        )

        with torch.no_grad():
            logits = model(**inputs).logits
            probs = F.softmax(logits, dim=-1)

        for baris in probs:
            nilai = baris.tolist()
            idx_tertinggi = int(max(range(len(nilai)), key=nilai.__getitem__))
            hasil.append(
                {
                    "label": urutan_label[idx_tertinggi],
                    "confidence": round(nilai[idx_tertinggi], 4),
                    "probabilitas": {
                        nama: round(p, 4) for nama, p in zip(urutan_label, nilai)
                    },
                }
            )

    return hasil


def prediksi_satu(teks: str) -> dict:
    """Versi praktis untuk satu teks, dipakai halaman Playground."""
    return prediksi([teks])[0]


if __name__ == "__main__":
    # Tes cepat: python model/inference.py
    logging.basicConfig(level=logging.INFO)
    # Empat kalimat ini sengaja diambil dari sel uji di notebook training Anda,
    # supaya hasilnya bisa langsung dibandingkan dengan hasil di Colab.
    contoh = [
        "Aplikasi membantu, saran saya tambahkan fiturnya lagi",
        "tdk bagus",
        "kapan update versi terbarunya?",
        "Sempat bingung pakainya, namun keseluruhan sudah sangat baik",
    ]
    for teks, out in zip(contoh, prediksi(contoh)):
        print(f"{out['label']:<12} {out['confidence']:.2%}  {teks[:60]}")
