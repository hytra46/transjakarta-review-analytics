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

## Cara deploy

Folder ini dirancang untuk dideploy sebagai Web Service Docker di
**Render.com** (gratis, tanpa kartu kredit). Lihat PANDUAN_LENGKAP.md
Bagian 7 untuk langkah lengkapnya. Root Directory saat setup Render harus
diarahkan ke folder `space` ini.

Folder ini juga tetap kompatibel dipakai sebagai Hugging Face Space
(SDK: Docker) kalau suatu saat Anda berlangganan PRO, tidak perlu
mengubah apa pun.

## Variabel yang perlu diatur

Di Render: tab **Environment** pada Web Service ini.
Di Hugging Face Space (kalau dipakai): tab **Settings**, bagian
**Variables and secrets**.

| Nama | Jenis | Isi |
| --- | --- | --- |
| `HF_MODEL_ID` | Variable | `USERNAME/indobert-tj-review` |
| `MAX_LENGTH` | Variable | `64`, sesuai notebook training |
| `TORCH_DTYPE` | Variable | `float16`, menghemat RAM kira-kira setengahnya (disarankan untuk RAM gratis yang terbatas) |
| `HF_TOKEN` | Secret | Hanya perlu kalau repo model Anda privat |
