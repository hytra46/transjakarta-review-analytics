FROM python:3.11-slim

# Hugging Face Spaces menjalankan container sebagai user biasa, bukan root.
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH" \
    HF_HOME="/home/user/.cache/huggingface"

WORKDIR /app

COPY --chown=user requirements.txt .
# Pasang PyTorch versi CPU lebih dulu supaya image tidak membengkak.
RUN pip install --no-cache-dir torch==2.5.1 --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

COPY --chown=user . .

# Render (dan kebanyakan platform hosting lain) memberi tahu port yang harus
# dipakai lewat environment variable PORT saat container dijalankan, bukan
# lewat nomor tetap. Baris ENV di bawah cuma nilai default kalau PORT tidak
# diisi (misalnya saat Anda coba jalankan container ini di komputer sendiri).
ENV PORT=10000
EXPOSE 10000
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
