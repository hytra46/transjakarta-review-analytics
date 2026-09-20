# Dockerfile ini dibuild dengan CONTEXT folder utama proyek (bukan folder
# space/ saja), supaya bisa mengambil model/inference.py langsung dari
# sumbernya tanpa perlu menyalin manual ke folder lain. Kalau Anda memakai
# Render, ini diatur lewat kolom "Docker Build Context Directory" (isi titik
# atau kosongkan) dan "Dockerfile Path" (isi space/Dockerfile). Lihat
# PANDUAN_LENGKAP.md Bagian 7.1.

FROM python:3.11-slim

# Hugging Face Spaces / Render menjalankan container sebagai user biasa, bukan root.
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH" \
    HF_HOME="/home/user/.cache/huggingface"

WORKDIR /app

COPY --chown=user space/requirements.txt .
# Pasang PyTorch versi CPU lebih dulu supaya image tidak membengkak.
RUN pip install --no-cache-dir torch==2.5.1 --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

COPY --chown=user space/app.py .
# Diambil langsung dari model/, satu-satunya sumber file ini. Kalau Anda
# mengubah preprocessing di model/inference.py, cukup push, tidak perlu
# menyalin ke tempat lain.
COPY --chown=user model/inference.py .

# Render (dan kebanyakan platform hosting lain) memberi tahu port yang harus
# dipakai lewat environment variable PORT saat container dijalankan, bukan
# lewat nomor tetap. Baris ENV di bawah cuma nilai default kalau PORT tidak
# diisi (misalnya saat Anda coba jalankan container ini di komputer sendiri).
ENV PORT=10000
EXPOSE 10000
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
