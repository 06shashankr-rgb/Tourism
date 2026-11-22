"""Local English-to-Indic translation for TravelMate using Ollama TranslateGemma."""
import json
import os
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

LANGUAGES = {
    "as": "asm_Beng", "bn": "ben_Beng", "brx": "brx_Deva",
    "doi": "doi_Deva", "en": "eng_Latn", "gu": "guj_Gujr",
    "hi": "hin_Deva", "kn": "kan_Knda", "ks": "kas_Arab",
    "kok": "gom_Deva", "mai": "mai_Deva", "ml": "mal_Mlym",
    "mni": "mni_Mtei", "mr": "mar_Deva", "ne": "npi_Deva",
    "or": "ory_Orya", "pa": "pan_Guru", "sa": "san_Deva",
    "sat": "sat_Olck", "sd": "snd_Arab", "ta": "tam_Taml",
    "te": "tel_Telu", "ur": "urd_Arab",
}

LANGUAGE_NAMES = {
    "asm_Beng": "Assamese", "ben_Beng": "Bengali",
    "brx_Deva": "Bodo", "doi_Deva": "Dogri",
    "guj_Gujr": "Gujarati", "hin_Deva": "Hindi",
    "kan_Knda": "Kannada", "kas_Arab": "Kashmiri",
    "gom_Deva": "Konkani", "mai_Deva": "Maithili",
    "mal_Mlym": "Malayalam", "mni_Mtei": "Manipuri",
    "mar_Deva": "Marathi", "npi_Deva": "Nepali",
    "ory_Orya": "Odia", "pan_Guru": "Punjabi",
    "san_Deva": "Sanskrit", "sat_Olck": "Santali",
    "snd_Arab": "Sindhi", "tam_Taml": "Tamil",
    "tel_Telu": "Telugu", "urd_Arab": "Urdu",
}

LANGUAGE_CODES = {
    "as": "as", "bn": "bn", "brx": "brx", "doi": "doi",
    "gu": "gu", "hi": "hi", "kn": "kn", "ks": "ks",
    "kok": "gom", "mai": "mai", "ml": "ml", "mni": "mni",
    "mr": "mr", "ne": "ne", "or": "or", "pa": "pa",
    "sa": "sa", "sat": "sat", "sd": "sd", "ta": "ta",
    "te": "te", "ur": "ur",
}

TRANSLATION_MODEL = os.getenv("TRANSLATION_MODEL", "translategemma:4b")
OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")


def _translate_one(text: str, target: str) -> str:
    language = LANGUAGE_NAMES[target]
    language_code = next(
        (code for code, target_code in LANGUAGES.items() if target_code == target),
        "",
    )
    language_code = LANGUAGE_CODES.get(language_code, language_code)

    prompt = (
        f"You are a professional English (en) to {language} "
        f"({language_code}) translator. "
        f"Translate accurately using natural {language} grammar. "
        "Use the target language's native writing system. "
        "Preserve names, facts, numbers, URLs and placeholders exactly. "
        "Return only the translation, without explanations or quotation marks. "
        "Translate the following English text:\n\n"
        f"{text}"
    )

    payload = json.dumps({
        "model": TRANSLATION_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.1, "num_ctx": 4096},
    }).encode("utf-8")

    request = urllib.request.Request(
        OLLAMA_URL + "/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        timeout = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "180"))
        with urllib.request.urlopen(request, timeout=timeout) as response:
            result = json.loads(response.read().decode("utf-8"))
        translated = str(result.get("response", "")).strip()
        if not translated:
            raise RuntimeError("Ollama returned an empty translation.")
        return translated
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Ollama translation request failed ({exc.code}): {detail}") from exc
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Translation model unavailable: {exc}") from exc


def translation_status() -> dict:
    """Check the local Ollama server and whether TranslateGemma is installed."""
    request = urllib.request.Request(OLLAMA_URL + "/api/tags", method="GET")
    try:
        with urllib.request.urlopen(
            request, timeout=float(os.getenv("OLLAMA_STATUS_TIMEOUT_SECONDS", "5"))
        ) as response:
            data = json.loads(response.read().decode("utf-8"))
        models = [
            item.get("name", "")
            for item in data.get("models", [])
            if isinstance(item, dict)
        ]
        model_ready = any(
            name == TRANSLATION_MODEL or name.startswith(TRANSLATION_MODEL + ":")
            for name in models
        )
        return {
            "ollamaReady": True,
            "translationModelReady": model_ready,
            "model": TRANSLATION_MODEL,
            "availableModels": models,
        }
    except Exception as exc:
        return {
            "ollamaReady": False,
            "translationModelReady": False,
            "model": TRANSLATION_MODEL,
            "availableModels": [],
            "reason": str(exc),
        }


def translate_texts(
    texts: list[str],
    source: str = "eng_Latn",
    target: str = "kan_Knda",
) -> dict:
    """Translate a batch of English UI strings into one supported Indic language."""
    if source != "eng_Latn":
        raise ValueError("The local translation service currently supports English as the source language.")
    if target not in LANGUAGE_NAMES:
        raise ValueError("Unsupported target language code.")

    cleaned = [str(item).strip() for item in texts]
    if not cleaned or len(cleaned) > 50 or any(not item for item in cleaned):
        raise ValueError("Provide 1–50 non-empty text strings.")
    if any(len(item) > 1500 for item in cleaned):
        raise ValueError("Each text string must be 1,500 characters or fewer.")

    status = translation_status()
    if not status["ollamaReady"]:
        raise RuntimeError("Ollama is not running. Start Ollama and try again.")
    if not status["translationModelReady"]:
        raise RuntimeError(
            f"Translation model '{TRANSLATION_MODEL}' is not installed. "
            "Run: ollama pull " + TRANSLATION_MODEL
        )

    with ThreadPoolExecutor(max_workers=min(2, len(cleaned))) as pool:
        translated = list(pool.map(lambda item: _translate_one(item, target), cleaned))
    if len(translated) != len(cleaned) or any(not value.strip() for value in translated):
        raise RuntimeError("Translation engine returned an incomplete result.")

    return {
        "translations": translated,
        "source": source,
        "target": target,
        "model": TRANSLATION_MODEL,
        "provider": "Ollama-TranslateGemma-local",
    }


def translate_text(
    text: str,
    source: str = "eng_Latn",
    target: str = "kan_Knda",
) -> dict:
    result = translate_texts([text], source, target)
    return {
        "translatedText": result["translations"][0],
        "source": source,
        "target": target,
        "model": result["model"],
        "provider": result["provider"],
    }
