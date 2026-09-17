# Panduan Pengerjaan, Langkah demi Langkah

Panduan ini ditulis dengan asumsi Anda belum pernah memakai GitHub, Supabase,
Hugging Face, maupun Vercel. Kerjakan berurutan dari atas ke bawah. Jangan
melompat, karena tiap langkah memakai hasil langkah sebelumnya.

Total waktu kira-kira 4 sampai 6 jam kalau lancar. Semua layanan yang dipakai
gratis dan tidak meminta kartu kredit.

Sebelum mulai, siapkan empat akun. Daftar sekarang biar tidak terputus di tengah
jalan: GitHub, Supabase, Hugging Face, dan Vercel. Untuk Supabase dan Vercel,
pilih opsi "Continue with GitHub" supaya tidak perlu mengingat kata sandi baru.

---

## Bagian 0. Menyiapkan komputer

Anda butuh tiga program. Kalau sudah ada, lewati saja.

1. **Python 3.11.** Unduh di python.org. Saat memasang di Windows, centang
   "Add Python to PATH". Ini penting, kalau terlewat perintah `python` tidak akan dikenali.
2. **Node.js versi 20 atau lebih baru.** Unduh di nodejs.org, pilih versi LTS.
3. **Git.** Unduh di git-scm.com. Biarkan semua pilihan default.

Buka Terminal (di Mac) atau Command Prompt (di Windows), lalu ketik satu per satu:

```bash
python --version
node --version
git --version
```

Kalau ketiganya menjawab dengan nomor versi, komputer Anda siap.

---

## Bagian 1. Menyiapkan repository (Phase 0)

1. Ekstrak folder `transjakarta-review-analytics` dari file zip ke tempat yang
   mudah dicari, misalnya Desktop.
2. Buka github.com, klik tombol **+** di kanan atas, pilih **New repository**.
3. Nama repository: `transjakarta-review-analytics`. Pilih **Public**. Jangan
   centang "Add a README file", karena file itu sudah ada di folder Anda.
4. Kembali ke Terminal, masuk ke folder proyek, lalu jalankan:

```bash
cd Desktop/transjakarta-review-analytics
git init
git add .
git commit -m "Struktur awal proyek"
git branch -M main
git remote add origin https://github.com/USERNAME/transjakarta-review-analytics.git
git push -u origin main
```

Ganti `USERNAME` dengan username GitHub Anda.

**Cara memastikan berhasil:** buka halaman repository di GitHub, semua folder
harus terlihat. Yang TIDAK boleh terlihat adalah file `.env` dan file `.pkl`.
Kalau keduanya tidak muncul, berarti `.gitignore` bekerja dengan benar.

---

## Bagian 2. Memindahkan model ke Hugging Face (Phase 1)

Ini bagian yang paling sering bikin bingung, jadi saya jelaskan alasannya dulu.

File `indobert_tj_model.pkl` Anda berukuran 475 MB. GitHub menolak file di atas
100 MB, jadi model tidak bisa ikut masuk repo. Hugging Face adalah tempat
penyimpanan model yang gratis dan tanpa batas ukuran seketat itu. Sekali model
ada di sana, GitHub Actions dan Playground tinggal mengunduhnya sendiri.

Sekalian kita ubah formatnya. File `.pkl` menyimpan objek tokenizer dalam bentuk
pickle, yang hanya bisa dibuka oleh versi library yang mirip dengan saat disimpan.
Format Hugging Face lebih tahan banting dan bisa dibuka versi mana pun.

### 2.1 Buat akun dan token

1. Daftar di huggingface.co.
2. Klik foto profil, **Settings**, **Access Tokens**, **Create new token**.
3. Pilih tipe **Write**. Beri nama bebas, misalnya `tj-project`.
4. Salin token yang muncul (diawali `hf_`) dan simpan di tempat aman. Token ini
   hanya ditampilkan sekali.

### 2.2 Pindahkan model, pilih salah satu cara

**Opsi A, lewat file .pkl.** Pakai ini kalau Anda hanya punya file `.pkl` dan
tidak ingin melatih ulang.

Buka Colab, jalankan sel berikut satu per satu.

```python
!pip install -q transformers torch huggingface_hub safetensors
```

```python
from huggingface_hub import notebook_login
notebook_login()   # tempel token hf_ Anda di kotak yang muncul
```

Unggah file `convert_pkl_to_hf.py` lewat panel Files di sebelah kiri, pastikan
`indobert_tj_model.pkl` juga ada di sana, lalu jalankan:

```python
!python convert_pkl_to_hf.py \
    --pkl indobert_tj_model.pkl \
    --repo USERNAME/indobert-tj-review
```

Ganti `USERNAME` dengan username Hugging Face Anda.

**Opsi B, langsung dari notebook training.** Pakai ini kalau Opsi A gagal
membuka file `.pkl`, atau kalau notebook training Anda kebetulan masih hidup.
Cara ini lebih pendek karena melewati file `.pkl` sama sekali.

Buka `Salinan_dari_Train_IndoBERT_TJ_Playstore.ipynb`, jalankan ulang semua sel
sampai `trainer.train()` selesai, lalu tambahkan satu sel baru di bawahnya:

```python
!pip install -q huggingface_hub
from huggingface_hub import notebook_login
notebook_login()

model.config.id2label = id2label
model.config.label2id = label2id

model.push_to_hub("USERNAME/indobert-tj-review", safe_serialization=True)
tokenizer.push_to_hub("USERNAME/indobert-tj-review")
print("Selesai")
```

**Cara memastikan berhasil, untuk kedua opsi:** buka
`https://huggingface.co/USERNAME/indobert-tj-review`. Di tab Files harus ada
`model.safetensors`, `config.json`, dan beberapa file tokenizer. Buka
`config.json`, di dalamnya harus terlihat `id2label` berisi empat nama kategori
Anda.

Kalau Opsi A menampilkan peringatan bahwa bobot classifier tidak ditemukan,
jangan diteruskan. Tanpa bobot itu prediksi akan acak. Pindah ke Opsi B.

### 2.3 Yang sudah saya sesuaikan dengan notebook Anda

Tiga hal ini sudah saya samakan, jadi Anda tidak perlu menyunting apa pun:

| Hal | Nilai di notebook Anda | Sudah dipakai di kode |
| --- | --- | --- |
| Panjang token | `max_length=64` | `MAX_LENGTH = 64` di `model/inference.py` |
| Preprocessing | tidak ada, teks mentah | `bersihkan_teks` sengaja tidak mengubah apa pun |
| Nama kategori | `Apresiasi`, `Keluhan`, `Pertanyaan`, `Saran` | dipakai apa adanya di database dan dashboard |

Soal nama kategori, perhatikan huruf besar di awal. Model Anda mengeluarkan
`Keluhan`, bukan `keluhan`. Database menolak baris yang nama kategorinya tidak
persis sama, jadi jangan mengubahnya menjadi huruf kecil di mana pun.

Soal preprocessing, godaan terbesar nanti adalah menambahkan lowercase atau
pembersih emoji karena kelihatannya lebih rapi. Jangan. Model Anda belajar dari
teks mentah, jadi membersihkannya saat inference justru membuat teks jadi asing
bagi model dan akurasi turun tanpa error apa pun.

### 2.4 Tes di komputer

```bash
pip install -r requirements.txt
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

Salin `.env.example` menjadi `.env`, lalu isi `HF_MODEL_ID` dengan
`USERNAME/indobert-tj-review`. Kosongkan dulu bagian Supabase.

```bash
python model/inference.py
```

Script ini memakai empat kalimat uji yang sama persis dengan sel pengujian di
notebook Colab Anda.

**Cara memastikan berhasil:** hasilnya harus sama dengan yang Anda lihat di
Colab. Kalau berbeda, berarti ada yang tidak cocok antara model yang terunggah
dan model yang Anda latih. Unduhan pertama memakan waktu beberapa menit karena
model 475 MB sedang diambil.

---

## Bagian 3. Menguji scraper (Phase 2)

```bash
python scraper/scraper.py
```

**Cara memastikan berhasil:** muncul jumlah review tahun 2026 dan rentang
tanggalnya.

Kalau hasilnya 0 review, kemungkinan besar aplikasi yang Anda tuju memang belum
punya review di tahun itu. Coba ubah `TAHUN_TARGET` di file `.env` menjadi tahun
sebelumnya untuk memastikan scraper-nya sendiri berfungsi.

---

## Bagian 4. Menyiapkan database (Phase 3)

1. Buka supabase.com, klik **New project**. Beri nama `tj-review-analytics`.
   Pilih region **Southeast Asia (Singapore)**, yang paling dekat dengan Jakarta.
2. Supabase akan minta database password. Simpan, walaupun untuk proyek ini
   tidak akan dipakai.
3. Tunggu sekitar dua menit sampai project selesai dibuat.
4. Buka menu **SQL Editor** di kiri, klik **New query**, tempel SELURUH isi file
   `database/schema.sql`, lalu klik **Run**.
5. Buka menu **Project Settings**, lalu **API**. Di sana ada tiga hal yang perlu
   disalin:
   - **Project URL**
   - **anon public** key
   - **service_role** key (klik Reveal dulu)

Isikan Project URL dan service_role key ke file `.env` Anda.

**Peringatan penting:** service_role key bisa menghapus seluruh data Anda. Kunci
ini hanya boleh ada di file `.env` dan di GitHub Secrets. Jangan pernah
menempelkannya ke folder `dashboard/`, dan jangan pernah membagikannya.

**Cara memastikan berhasil:** buka menu **Table Editor**, tabel `reviews` harus
sudah muncul dengan tujuh kolom, meski masih kosong.

---

## Bagian 5. Menjalankan pipeline pertama kali (Phase 4)

Coba dulu tanpa menyimpan apa pun:

```bash
python pipeline/run_pipeline.py --dry-run
```

Log akan menampilkan tiap tahap: Extract, Validate, Deduplicate, Predict, dan
sebaris distribusi label. Perhatikan distribusinya. Data latih Anda didominasi
Apresiasi, jadi wajar kalau kategori itu juga mendominasi hasil. Yang perlu
dicurigai adalah kalau Saran dan Pertanyaan muncul nyaris nol, atau sebaliknya
kalau satu kategori menelan hampir semua review.

Di akhir muncul tiga contoh hasil prediksi lengkap dengan teksnya. Baca satu per
satu, apakah kategorinya masuk akal menurut Anda sebagai manusia.

Kalau sudah yakin, jalankan sungguhan:

```bash
python pipeline/run_pipeline.py
```

**Cara memastikan berhasil:** buka Table Editor di Supabase, tabel `reviews`
sudah terisi lengkap dengan kolom `label` dan `confidence`.

Jalankan sekali lagi perintah yang sama. Kali ini pipeline harus berhenti di
tahap Deduplicate dengan pesan tidak ada review baru. Ini bukti mekanisme
anti-duplikat Anda bekerja.

---

## Bagian 6. Mengotomatiskan lewat GitHub Actions (Phase 5)

1. Buka repository di GitHub, masuk **Settings**, lalu **Secrets and variables**,
   lalu **Actions**.
2. Di tab **Secrets**, klik **New repository secret** tiga kali untuk mengisi:

   | Nama | Isi |
   | --- | --- |
   | `SUPABASE_URL` | Project URL dari Supabase |
   | `SUPABASE_SERVICE_KEY` | service_role key |
   | `HF_TOKEN` | token `hf_` Anda |

3. Pindah ke tab **Variables**, klik **New repository variable** tiga kali:

   | Nama | Isi |
   | --- | --- |
   | `HF_MODEL_ID` | `USERNAME/indobert-tj-review` |
   | `APP_ID` | `com.transjakmobile` |
   | `TAHUN_TARGET` | `2026` |

4. Buka tab **Actions**, pilih workflow "Update review TransJakarta", klik
   **Run workflow**.

**Cara memastikan berhasil:** jalannya memakan waktu 5 sampai 10 menit. Buka
lognya dan baca dari atas. Semua tahap harus lewat tanpa error. Setelah ini
pipeline berjalan sendiri setiap hari pukul 09.00 WIB.

Kalau ingin mengubah jamnya, edit baris `cron` di
`.github/workflows/update_reviews.yml`. GitHub memakai zona waktu UTC, jadi
kurangi 7 jam dari jam WIB yang Anda inginkan.

---

## Bagian 7. Menyalakan Playground (Phase 7)

Playground butuh Python dan PyTorch, sedangkan Vercel hanya menjalankan
JavaScript. Karena itu model dijalankan terpisah di Hugging Face Spaces, lalu
dashboard tinggal bertanya ke sana.

1. Di huggingface.co, klik foto profil, **New Space**.
2. Nama: `indobert-tj-playground`. SDK: pilih **Docker**, template **Blank**.
   Hardware: **CPU basic**, yang gratis. Visibility: **Public**.
3. Di halaman Space, buka tab **Files**, klik **Add file**, lalu **Upload files**.
   Unggah empat file ini dari folder `space/`: `app.py`, `Dockerfile`,
   `requirements.txt`, dan `README.md`.
4. Salin juga file `model/inference.py` ke Space, dengan nama tetap
   `inference.py` di folder utama Space. File ini harus selalu sama persis
   dengan yang di GitHub, supaya hasil Playground dan hasil dashboard konsisten.
5. Buka tab **Settings** Space, bagian **Variables and secrets**. Tambahkan
   variable `HF_MODEL_ID` berisi `USERNAME/indobert-tj-review`, dan variable
   `MAX_LENGTH` berisi `64`.

Space akan membangun dirinya sendiri selama 5 sampai 10 menit.

**Cara memastikan berhasil:** buka
`https://USERNAME-indobert-tj-playground.hf.space/health` di browser. Harus
muncul `{"status":"siap"}`. Catat alamat Space ini, nanti dipakai di Bagian 9.

Catatan: Space gratis tertidur kalau lama tidak dipakai, dan butuh sekitar satu
menit untuk bangun. Ini normal. Halaman Playground sudah menyiapkan pesan yang
menjelaskan hal ini kepada pengunjung.

---

## Bagian 8. Menjalankan dashboard di komputer (Phase 6)

```bash
cd dashboard
npm install
```

Salin `.env.local.example` menjadi `.env.local`, lalu isi:

- `NEXT_PUBLIC_SUPABASE_URL` dengan Project URL Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` dengan **anon public** key, bukan service_role
- `PLAYGROUND_API_URL` dengan alamat Space dari Bagian 7

```bash
npm run dev
```

Buka `http://localhost:3000`.

**Cara memastikan berhasil:** angka KPI terisi, grafik muncul, dan tabel berisi
review. Klik-klik filter kategori dan bintang, angka KPI harus ikut berubah.
Lalu buka `http://localhost:3000/playground`, ketik satu kalimat, klik Prediksi.

---

## Bagian 9. Deploy ke internet (Phase 8)

Simpan dulu semua perubahan Anda:

```bash
cd ..
git add .
git commit -m "Dashboard dan pipeline siap"
git push
```

1. Buka vercel.com, masuk dengan akun GitHub, klik **Add New**, lalu **Project**.
2. Pilih repository `transjakarta-review-analytics`.
3. Di bagian **Root Directory**, klik Edit dan pilih folder `dashboard`. Langkah
   ini wajib, kalau terlewat Vercel akan bingung karena folder utama berisi Python.
4. Buka bagian **Environment Variables**, isi tiga variabel yang sama dengan
   `.env.local` Anda.
5. Klik **Deploy**.

**Cara memastikan berhasil:** setelah sekitar dua menit Anda dapat alamat
seperti `transjakarta-review-analytics.vercel.app`. Buka dari ponsel, bukan
hanya dari laptop, dan pastikan tabelnya bisa digeser dan tidak ada yang terpotong.

---

## Bagian 10. Pemeriksaan akhir (Phase 9)

Dokumen perencanaan Anda punya daftar acceptance criteria di Bab 13. Telusuri
satu per satu sambil membuka dashboard publik Anda:

- Filter tanggal, kategori, dan bintang bekerja, dan KPI ikut berubah.
- Grafik mingguan menampilkan empat kategori.
- Tabel bisa berpindah halaman.
- Playground memberi prediksi dan grafik confidence.
- Waktu pembaruan terakhir muncul di kanan atas.
- Buka kode sumber halaman di browser, cari kata `service_role`. Harus tidak
  ditemukan sama sekali.
- Coba filter yang pasti kosong, misalnya tanggal di masa depan. Harus muncul
  pesan yang ramah, bukan halaman error.

---

## Bagian 11. Menyusun portfolio (Phase 10)

Untuk keperluan portfolio Data Analyst, yang paling menjual bukan modelnya,
melainkan ceritanya. Isi README repository Anda dengan:

1. Masalah yang ingin dijawab, dalam satu paragraf.
2. Diagram alur data, boleh digambar sederhana.
3. Tiga sampai lima temuan konkret dari data Anda sendiri. Contoh bentuknya:
   kategori apa yang paling sering muncul, apakah keluhan naik di pekan tertentu,
   apakah review bintang 1 didominasi topik tertentu.
4. Tangkapan layar dashboard.
5. Tautan ke dashboard publik dan ke Playground.
6. Satu paragraf jujur soal keterbatasan. Anda sudah punya bahan yang kuat di
   sini, jadi tulis apa adanya:
   - Data latih 2.265 review dengan komposisi timpang: Apresiasi 1.414,
     Keluhan 647, Saran 128, Pertanyaan 76.
   - Ketimpangan itu ditangani dengan class weight seimbang saat pelatihan,
     bukan dengan oversampling, sehingga kategori Saran dan Pertanyaan tetap
     paling rawan meleset.
   - Confidence belum dikalibrasi, jadi angka 90% tidak berarti benar 9 dari 10.
   - Review Play Store hanya mewakili pengguna yang mau repot menulis, yang
     biasanya sedang sangat senang atau sangat kesal.

Poin nomor 6 justru sering jadi pembeda. Orang yang tahu batas datanya sendiri
terlihat lebih matang daripada orang yang hanya memamerkan akurasi. Kalau ditanya
saat wawancara, satu jawaban yang bagus adalah: metrik yang Anda pantau adalah
F1 macro, bukan accuracy, justru karena accuracy akan terlihat tinggi hanya
dengan menebak Apresiasi terus.

Kalau nanti Anda punya waktu tambahan, langkah paling berdampak bukan mengganti
model, melainkan menambah data berlabel untuk Saran dan Pertanyaan. Dashboard
Anda sekarang sudah bisa membantu: filter kategori Saran, urutkan yang
confidence-nya rendah, lalu labeli ulang secara manual. Itu putaran perbaikan
yang enak diceritakan di portfolio.

---

## Kalau ada yang macet

| Gejala | Kemungkinan penyebab |
| --- | --- |
| `ModuleNotFoundError` waktu menjalankan script Python | Jalankan perintahnya dari folder utama proyek, bukan dari dalam subfolder |
| Pipeline bilang 0 review baru terus | Memang tidak ada review baru sejak kemarin. Ini perilaku yang benar |
| Dashboard kosong padahal database terisi | Anon key salah, atau `schema.sql` belum dijalankan sampai selesai |
| Vercel gagal build | Root Directory belum diarahkan ke folder `dashboard` |
| Playground selalu timeout | Space sedang bangun dari tidur. Tunggu satu menit lalu coba lagi |
| Semua baris ditolak database | Nama kategori tidak persis sama, periksa huruf besar di awal |
| Label prediksi terasa ngawur | Kemungkinan `MAX_LENGTH` atau `bersihkan_teks` sempat diubah |
| Saran dan Pertanyaan hampir tidak pernah muncul | Wajar, dua kategori itu paling sedikit contohnya saat pelatihan |
| GitHub Actions gagal di langkah pipeline | Buka lognya, biasanya Secrets ada yang salah ketik |
