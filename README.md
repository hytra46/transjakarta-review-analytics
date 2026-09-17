# TransJakarta App Review Analytics

Dashboard publik yang memantau review aplikasi TJ:Transjakarta di Google Play
Store sepanjang 2026. Review diambil otomatis setiap hari, diklasifikasikan
menjadi empat kategori dengan model IndoBERT, lalu ditampilkan sebagai KPI,
grafik tren, dan tabel yang bisa difilter.

Baru pertama kali mengerjakan ini? Buka **[PANDUAN_LENGKAP.md](PANDUAN_LENGKAP.md)**
dan ikuti dari Bagian 0.

## Alur data

```
Google Play Store
      |
      v
Python scraper  ->  validasi  ->  cek duplikat  ->  IndoBERT  ->  Supabase
      ^                                                              |
      |                                                              v
GitHub Actions (harian)                            Next.js dashboard -> Vercel
                                                                      |
                                Hugging Face Spaces (Playground) <----+
```

Pengambilan data dan penayangan data sengaja dipisah. Dashboard tidak pernah
melakukan scraping maupun inference, jadi tetap cepat walau dibuka banyak orang
sekaligus.

## Isi folder

| Folder | Isi |
| --- | --- |
| `scraper/` | Pengambilan review Play Store dan validasi tiap baris |
| `model/` | Inference IndoBERT, dan script konversi `.pkl` ke Hugging Face |
| `database/` | Skema tabel, Row Level Security, fungsi agregasi, koneksi pipeline |
| `pipeline/` | Penggabung semua tahap, inilah yang dijalankan terjadwal |
| `space/` | API Playground untuk Hugging Face Spaces |
| `dashboard/` | Aplikasi Next.js yang dideploy ke Vercel |
| `.github/workflows/` | Penjadwalan otomatis |

## Kategori

Nama kategori ditulis persis seperti keluaran model, sesuai `label2id` di
notebook training.

| Kategori | Maksud | Contoh saat pelatihan |
| --- | --- | --- |
| Apresiasi | Pengguna memuji aplikasi atau layanan | 1.414 |
| Keluhan | Pengguna melaporkan masalah atau ketidakpuasan | 647 |
| Saran | Pengguna mengusulkan perbaikan atau fitur | 128 |
| Pertanyaan | Pengguna menanyakan sesuatu | 76 |

## Keamanan

Service role key Supabase hanya hidup di GitHub Actions Secrets dan di file
`.env` lokal. Dashboard memakai anon key, dan Row Level Security di Supabase
hanya mengizinkan SELECT, sehingga tidak ada pengunjung yang bisa mengubah data.
Teks yang diketik di halaman Playground tidak disimpan ke mana pun.

## Catatan soal model

Model dilatih dari 2.265 review Play Store yang dilabeli manual, memakai
`indobenchmark/indobert-base-p1` dengan `max_length=64` dan tanpa preprocessing
teks. Ketidakseimbangan kelas ditangani dengan class weight seimbang saat
pelatihan, bukan dengan oversampling.

Label pada setiap review adalah hasil prediksi, bukan penilaian manusia. Angka
confidence adalah probabilitas menurut model dan belum dikalibrasi, jadi model
bisa saja sangat yakin namun tetap keliru. Kategori Saran dan Pertanyaan punya
contoh paling sedikit saat pelatihan, sehingga paling rawan meleset. Dashboard
menandai prediksi di bawah 60% dengan warna oranye.
