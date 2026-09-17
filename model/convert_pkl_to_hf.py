"""
Konversi indobert_tj_model.pkl (475 MB) menjadi repo model Hugging Face.

JALANKAN SEKALI SAJA, di Google Colab, tempat file .pkl Anda berada.
Setelah ini selesai, file .pkl tidak dipakai lagi oleh pipeline maupun dashboard.

Kenapa perlu dikonversi:
  1. GitHub menolak file di atas 100 MB, jadi .pkl tidak bisa ikut masuk repo.
  2. File .pkl menyimpan objek tokenizer dalam bentuk pickle. Pickle hanya bisa
     dibuka oleh versi library yang mirip dengan saat disimpan. Kalau versi
     transformers di GitHub Actions berbeda sedikit saja, file bisa gagal dibuka.
  3. Format Hugging Face (safetensors + file tokenizer) bisa dibaca versi mana pun
     dan bisa diunduh otomatis oleh pipeline dan Playground.

Kalau file .pkl gagal dibuka, ada jalan pintas: lihat PANDUAN_LENGKAP.md Bagian 2.2
opsi B, yaitu mendorong model langsung dari notebook training tanpa lewat .pkl.

Cara pakai di Colab:
    !pip install -q transformers torch huggingface_hub safetensors
    from huggingface_hub import notebook_login; notebook_login()
    !python convert_pkl_to_hf.py --pkl indobert_tj_model.pkl --repo USERNAME/indobert-tj-review
"""

import argparse
import pickle
from pathlib import Path

import torch
from transformers import AutoConfig, AutoModelForSequenceClassification, AutoTokenizer


def muat_artifact(path: Path) -> dict:
    """Buka file .pkl, baik yang disimpan pakai torch.save maupun pickle.dump."""
    try:
        artifact = torch.load(path, map_location="cpu", weights_only=False)
    except Exception:
        try:
            with open(path, "rb") as f:
                artifact = pickle.load(f)
        except Exception as e:
            raise RuntimeError(
                f"File {path} tidak bisa dibuka: {e}\n\n"
                "Penyebab paling umum: file .pkl menyimpan objek tokenizer, dan objek itu "
                "hanya bisa dibuka oleh versi transformers yang mirip dengan saat disimpan.\n"
                "Jalan keluar tercepat: buka notebook training Anda, jalankan ulang sampai "
                "sel trainer.train(), lalu pakai cara langsung yang ada di "
                "PANDUAN_LENGKAP.md Bagian 2.2, opsi B."
            ) from e

    if not isinstance(artifact, dict):
        raise TypeError(
            f"Isi {path} bukan dictionary, melainkan {type(artifact)}. "
            "Script ini mengharapkan dict berisi model_state_dict, model_name, "
            "tokenizer, label2id, dan id2label."
        )
    return artifact


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pkl", required=True, help="Path ke indobert_tj_model.pkl")
    parser.add_argument("--repo", required=True, help="Nama repo HF, contoh: henry/indobert-tj-review")
    parser.add_argument("--out", default="indobert-tj-hf", help="Folder hasil konversi")
    parser.add_argument("--private", action="store_true", help="Buat repo privat, bukan publik")
    parser.add_argument("--skip-upload", action="store_true", help="Hanya konversi, jangan upload")
    args = parser.parse_args()

    pkl_path = Path(args.pkl)
    out_dir = Path(args.out)

    print(f"Membuka {pkl_path} ...")
    artifact = muat_artifact(pkl_path)
    print(f"Kunci yang ditemukan: {sorted(artifact.keys())}")

    state_dict = artifact["model_state_dict"]
    model_name = artifact.get("model_name", "indobenchmark/indobert-base-p1")
    label2id = {str(k): int(v) for k, v in artifact["label2id"].items()}
    id2label = {int(k): str(v) for k, v in artifact["id2label"].items()}

    print(f"Model dasar : {model_name}")
    print(f"Label       : {[id2label[i] for i in sorted(id2label)]}")

    # Bangun ulang arsitektur model, lalu isi dengan bobot hasil training Anda.
    config = AutoConfig.from_pretrained(
        model_name,
        num_labels=len(label2id),
        id2label=id2label,
        label2id=label2id,
    )
    model = AutoModelForSequenceClassification.from_config(config)

    missing, unexpected = model.load_state_dict(state_dict, strict=False)
    if missing:
        print(f"PERINGATAN, bobot ini tidak ada di file .pkl: {missing}")
    if unexpected:
        print(f"CATATAN, bobot ini ada di .pkl tapi tidak dipakai model: {unexpected}")
    if any("classifier" in nama for nama in missing):
        raise RuntimeError(
            "Bobot classifier tidak ditemukan. Tanpa itu prediksi akan acak. "
            "Periksa lagi isi file .pkl Anda."
        )

    model.eval()

    # Tokenizer: pakai yang tersimpan di .pkl kalau ada, kalau gagal ambil dari model dasar.
    tokenizer = artifact.get("tokenizer")
    if tokenizer is None:
        print("Tokenizer tidak ada di .pkl, mengambil dari model dasar.")
        tokenizer = AutoTokenizer.from_pretrained(model_name)

    out_dir.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(out_dir, safe_serialization=True)
    tokenizer.save_pretrained(out_dir)
    print(f"Tersimpan di folder {out_dir.resolve()}")

    if args.skip_upload:
        print("Upload dilewati sesuai permintaan.")
        return

    from huggingface_hub import HfApi

    api = HfApi()
    api.create_repo(repo_id=args.repo, repo_type="model", private=args.private, exist_ok=True)
    api.upload_folder(repo_id=args.repo, repo_type="model", folder_path=str(out_dir))
    print(f"Selesai. Model sekarang ada di https://huggingface.co/{args.repo}")


if __name__ == "__main__":
    main()
