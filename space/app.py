"""
API Playground IndoBERT, dijalankan di Hugging Face Spaces.

Space ini punya repository sendiri, terpisah dari repo GitHub. Isinya cuma empat
file: app.py, inference.py, requirements.txt, dan Dockerfile.

PENTING: file inference.py di sini adalah SALINAN PERSIS dari model/inference.py
di repo GitHub. Setiap kali Anda mengubah preprocessing di sana, salin lagi ke
sini, supaya hasil Playground dan hasil dashboard tidak pernah berbeda.

Endpoint:
    GET  /health   -> cek Space sudah bangun atau belum
    POST /predict  -> {"teks": "..."} menghasilkan label dan probabilitas
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from inference import muat_model, prediksi_satu

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("playground")

BATAS_KARAKTER = 1000

app = FastAPI(title="IndoBERT TransJakarta Playground", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class PermintaanPrediksi(BaseModel):
    teks: str = Field(min_length=1, max_length=BATAS_KARAKTER)


@app.on_event("startup")
def pemanasan() -> None:
    """Muat model saat Space menyala, supaya permintaan pertama tidak lambat."""
    try:
        muat_model()
        log.info("Model siap melayani permintaan.")
    except Exception:
        log.exception("Model gagal dimuat saat startup.")


@app.get("/")
def akar() -> dict:
    return {"pesan": "IndoBERT TransJakarta Playground. Kirim POST ke /predict."}


@app.get("/health")
def health() -> dict:
    try:
        muat_model()
        return {"status": "siap"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model belum siap: {e}")


@app.post("/predict")
def predict(req: PermintaanPrediksi) -> dict:
    teks = req.teks.strip()
    if not teks:
        raise HTTPException(status_code=400, detail="Teks tidak boleh kosong.")

    try:
        hasil = prediksi_satu(teks)
    except Exception:
        log.exception("Prediksi gagal.")
        raise HTTPException(status_code=500, detail="Prediksi gagal diproses.")

    # Teks pengunjung tidak disimpan ke mana pun, sesuai Bab 3 dokumen perencanaan.
    return hasil
