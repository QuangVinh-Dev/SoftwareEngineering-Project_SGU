import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

app = FastAPI(title="Hoi An Multilingual TTS")

MODEL_DIR = Path(os.getenv("MODEL_DIR", "/models"))

MODELS = {
    "vi": os.getenv("PIPER_MODEL_VI", ""),
    "en": os.getenv("PIPER_MODEL_EN", ""),
    "ja": os.getenv("PIPER_MODEL_JA", ""),
    "ko": os.getenv("PIPER_MODEL_KO", ""),
    "zh": os.getenv("PIPER_MODEL_ZH", ""),
}


class SynthesisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)
    language_code: str


def check_model(language_code: str) -> bool:
    filename = MODELS.get(language_code)
    if not filename:
        return False

    model_path = MODEL_DIR / filename
    config_path = Path(str(model_path) + ".json")

    return model_path.is_file() and config_path.is_file()


def japanese_phonemizer_ready() -> bool:
    try:
        import pyopenjtalk  # noqa: F401
        return True
    except ImportError:
        return False


@app.get("/health")
def health():
    model_status = {
        code: check_model(code)
        for code in MODELS
    }
    phonemizer_status = {"ja": japanese_phonemizer_ready()}

    if not all(model_status.values()) or not all(phonemizer_status.values()):
        raise HTTPException(
            status_code=503,
            detail={
                "status": "degraded",
                "models": model_status,
                "phonemizers": phonemizer_status,
            },
        )

    return {
        "status": "ok",
        "models": model_status,
        "phonemizers": phonemizer_status,
    }


@app.post("/synthesize")
def synthesize(request: SynthesisRequest):
    text = request.text.strip()
    code = request.language_code.strip().lower()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty",
        )

    if code not in MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {code}",
        )

    if not check_model(code):
        raise HTTPException(
            status_code=503,
            detail=f"Model or config missing for language: {code}",
        )

    model_path = MODEL_DIR / MODELS[code]
    piper_bin = shutil.which("piper")
    ffmpeg_bin = shutil.which("ffmpeg")

    if not piper_bin or not ffmpeg_bin:
        raise HTTPException(
            status_code=503,
            detail="Piper or FFmpeg is unavailable",
        )

    with tempfile.TemporaryDirectory() as temp_dir:
        wav_path = Path(temp_dir) / "speech.wav"
        mp3_path = Path(temp_dir) / "speech.mp3"

        try:
            subprocess.run(
                [
                    piper_bin,
                    "--model", str(model_path),
                    "--output_file", str(wav_path),
                ],
                input=text,
                text=True,
                capture_output=True,
                check=True,
                timeout=180,
            )

            subprocess.run(
                [
                    ffmpeg_bin,
                    "-y",
                    "-i", str(wav_path),
                    "-codec:a", "libmp3lame",
                    "-q:a", "4",
                    str(mp3_path),
                ],
                capture_output=True,
                check=True,
                timeout=180,
            )

            audio_bytes = mp3_path.read_bytes()

            return Response(
                content=audio_bytes,
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition":
                        'attachment; filename="speech.mp3"'
                },
            )

        except subprocess.TimeoutExpired:
            raise HTTPException(
                status_code=504,
                detail="Audio generation timed out",
            )

        except subprocess.CalledProcessError as exc:
            stderr = exc.stderr
            if isinstance(stderr, bytes):
                stderr = stderr.decode("utf-8", errors="replace")

            raise HTTPException(
                status_code=500,
                detail=(
                    "Audio generation failed: "
                    + (stderr or str(exc))[-1500:]
                ),
            )
