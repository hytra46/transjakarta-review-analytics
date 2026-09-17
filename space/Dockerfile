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

# Hugging Face Spaces selalu mengharapkan aplikasi berjalan di port 7860.
EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
