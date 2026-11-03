"""Local English-to-Indic translation for TravelMate.

Primary option: optional AI4Bharat IndicTrans2 model.
Fallback: the already-running local Ollama chat model. No paid cloud API is used.
"""
import json
import os
import re
import urllib.error
import urllib.request
from functools import lru_cache

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
    "asm_Beng": "Assamese", "ben_Beng": "Bengali", "brx_Deva": "Bodo",
    "doi_Deva": "Dogri", "guj_Gujr": "Gujarati", "hin_Deva": "Hindi",
    "kan_Knda": "Kannada", "kas_Arab": "Kashmiri", "gom_Deva": "Konkani",
    "mai_Deva": "Maithili", "mal_Mlym": "Malayalam", "mni_Mtei": "Manipuri",
    "mar_Deva": "Marathi", "npi_Deva": "Nepali", "ory_Orya": "Odia",
    "pan_Guru": "Punjabi", "san_Deva": "Sanskrit", "sat_Olck": "Santali",
    "snd_Arab": "Sindhi", "tam_Taml": "Tamil", "tel_Telu": "Telugu",
    "urd_Arab": "Urdu",
}
MODEL_NAME = os.getenv(
    "INDICTRANS_EN_INDIC_MODEL",
    "ai4bharat/indictrans2-en-indic-dist-200M",
)


@lru_cache(maxsize=1)
def load_translator():
    """Load IndicTrans2 once, only when a translation request needs it."""
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        from IndicTransToolkit.processor import IndicProcessor
    except ImportError as exc:
        raise RuntimeError(
            "Optional IndicTrans2 dependencies are not installed."
        ) from exc

    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
        model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME, trust_remote_code=True)
        model.to("cpu")
        model.eval()
        return torch, tokenizer, model, IndicProcessor(inference=True)
    except Exception as exc:
        raise RuntimeError(f"Could not load IndicTrans2: {exc}") from exc


def _translate_with_indictrans(texts: list[str], target: str) -> list[str]:
    torch, tokenizer, model, processor = load_translator()
    prepared = processor.preprocess_batch(texts, src_lang="eng_Latn", tgt_lang=target)
    inputs = tokenizer(prepared, return_tensors="pt", padding=True, truncation=True, max_length=256)
    with torch.no_grad():
        generated = model.generate(**inputs, max_length=256, num_beams=2)
    decoded = tokenizer.batch_decode(generated, skip_special_tokens=True)
    return processor.postprocess_batch(decoded, lang=target)


def _translate_with_ollama(texts: list[str], target: str) -> list[str]:
    """Translate with the local chat model; ask for JSON to preserve batch alignment."""
    language = LANGUAGE_NAMES.get(target)
    if not language:
        raise RuntimeError("Unsupported language target.")
    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    prompt = (
        f"Translate every item below from English into {language}. "
        "Preserve meaning, punctuation, numbers, names, URLs and placeholders such as {name}. "
        "Return ONLY valid JSON in this exact shape: {\"translations\":[\"...\",\"...\"]}. "
        "Do not add explanations or markdown. Keep exactly the same number and order of items.\n"
        + json.dumps(texts, ensure_ascii=False)
    )
    payload = json.dumps({
        "model": model,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": "You are a careful professional translator for a tourism website."},
            {"role": "user", "content": prompt},
        ],
        "options": {"temperature": 0.1, "num_ctx": 8192},
    }).encode("utf-8")
    request = urllib.request.Request(
        base_url + "/api/chat", data=payload,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))) as response:
            result = json.loads(response.read().decode("utf-8"))
        raw = result.get("message", {}).get("content", "")
        parsed = json.loads(raw)
        translated = parsed.get("translations") if isinstance(parsed, dict) else None
        if not isinstance(translated, list) or len(translated) != len(texts):
            raise RuntimeError("Local AI translation returned an invalid batch.")
        if any(not isinstance(value, str) or not value.strip() for value in translated):
            raise RuntimeError("Local AI translation returned an empty translation.")
        return translated
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, KeyError) as exc:
        raise RuntimeError(
            f"Local translation unavailable. Start Ollama and download '{model}'. Details: {exc}"
        ) from exc


def translate_texts(texts: list[str], source: str = "eng_Latn",
                    target: str = "kan_Knda") -> dict:
    """Translate 1–50 English UI strings to a supported Indic language."""
    if source != "eng_Latn":
        raise ValueError("The configured translation models currently translate English to Indic languages only.")
    if target not in LANGUAGE_NAMES:
        raise ValueError("Unsupported target language code.")
    cleaned = [str(item).strip() for item in texts]
    if not cleaned or len(cleaned) > 50 or any(not item for item in cleaned):
        raise ValueError("Provide 1–50 non-empty text strings.")
    if any(len(item) > 1500 for item in cleaned):
        raise ValueError("Each text string must be 1,500 characters or fewer.")

    provider = "IndicTrans2-local"
    try:
        translated = _translate_with_indictrans(cleaned, target)
    except RuntimeError as indic_error:
        try:
            translated = _translate_with_ollama(cleaned, target)
            provider = "Ollama-local"
        except RuntimeError as ollama_error:
            raise RuntimeError(
                "Neither local translation engine is ready. Install the optional IndicTrans2 "
                "dependencies or start Ollama with the configured model. "
                f"IndicTrans2: {indic_error}; Ollama: {ollama_error}"
            ) from ollama_error

    if len(translated) != len(cleaned) or any(not isinstance(x, str) or not x.strip() for x in translated):
        raise RuntimeError("Translation engine returned an incomplete result.")
    return {
        "translations": translated,
        "source": source,
        "target": target,
        "model": MODEL_NAME if provider == "IndicTrans2-local" else os.getenv("OLLAMA_MODEL", "qwen2.5:3b"),
        "provider": provider,
    }


def translate_text(text: str, source: str = "eng_Latn", target: str = "kan_Knda") -> dict:
    result = translate_texts([text], source, target)
    return {
        "translatedText": result["translations"][0],
        "source": source,
        "target": target,
        "model": result["model"],
        "provider": result["provider"],
    }
