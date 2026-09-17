---
title: IndoBERT TransJakarta Playground
emoji: 🚌
colorFrom: blue
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---

# IndoBERT TransJakarta Playground

API klasifikasi review aplikasi TransJakarta menjadi empat kategori:
Apresiasi, Keluhan, Saran, dan Pertanyaan.

Teks yang dikirim ke API ini tidak disimpan.

## Endpoint

`POST /predict`

```json
{ "teks": "Aplikasinya sering error pas mau scan QR" }
```

Balasan:

```json
{
  "label": "Keluhan",
  "confidence": 0.9134,
  "probabilitas": {
    "Apresiasi": 0.0231,
    "Keluhan": 0.9134,
    "Pertanyaan": 0.0223,
    "Saran": 0.0412
  }
}
```

## Variabel yang perlu diatur

Di tab Settings Space ini, bagian Variables and secrets:

| Nama | Jenis | Isi |
| --- | --- | --- |
| `HF_MODEL_ID` | Variable | `USERNAME/indobert-tj-review` |
| `MAX_LENGTH` | Variable | `64`, sesuai notebook training |
| `HF_TOKEN` | Secret | Hanya perlu kalau repo model Anda privat |
