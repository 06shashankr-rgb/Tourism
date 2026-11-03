"""Local IndicTrans2 English-to-Indic translation engine for TravelMate.

This module uses AI4Bharat's distilled En-Indic checkpoint and lazy-loads it
on the first request. That checkpoint translates from English to Indic;
do not pass Indic source text to it.
"""
import os
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

# English-to-Indic distilled model, approximately 200M parameters.
MODEL_NAME = os.getenv(
    "INDICTRANS_EN_INDIC_MODEL",
    "ai4bharat/indictrans2-en-indic-dist-200M",
)

@lru_cache(maxsize=1)
def load_translator():
    """Load the model once, only when translation is first requested."""
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        from IndicTransToolkit.processor import IndicProcessor
    except ImportError as exc:
        raise RuntimeError(
            "Translation dependencies are missing. Install requirements-translation.txt."
        ) from exc

    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
        model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME, trust_remote_code=True)
        model.to("cpu")
        model.eval()
        processor = IndicProcessor(inference=True)
        return torch, tokenizer, model, processor
    except Exception as exc:
        raise RuntimeError(
            f"Could not load {MODEL_NAME}. Check model access, internet and available RAM. Details: {exc}"
        ) from exc


def translate_texts(texts: list[str], source: str = "eng_Latn",
                    target: str = "kan_Knda") -> dict:
    """Translate 1–50 English UI strings to a supported Indic language."""
    if source != "eng_Latn":
        raise ValueError(
            "The configured distilled checkpoint is English-to-Indic only. "
            "Use the separate Indic-Indic checkpoint for Indic-to-Indic text."
        )
    if target not in set(LANGUAGES.values()) - {"eng_Latn"}:
        raise ValueError("Unsupported target language code.")

    cleaned = [str(item).strip() for item in texts]
    if not cleaned or len(cleaned) > 50 or any(not item for item in cleaned):
        raise ValueError("Provide 1–50 non-empty text strings.")
    if any(len(item) > 1500 for item in cleaned):
        raise ValueError("Each text string must be 1,500 characters or fewer.")

    torch, tokenizer, model, processor = load_translator()
    prepared = processor.preprocess_batch(cleaned, src_lang=source, tgt_lang=target)
    inputs = tokenizer(prepared, return_tensors="pt", padding=True, truncation=True, max_length=256)
    with torch.no_grad():
        generated = model.generate(**inputs, max_length=256, num_beams=2)
    decoded = tokenizer.batch_decode(generated, skip_special_tokens=True)
    translated = processor.postprocess_batch(decoded, lang=target)
    return {
        "translations": translated,
        "source": source,
        "target": target,
        "model": MODEL_NAME,
    }


def translate_text(text: str, source: str = "eng_Latn", target: str = "kan_Knda") -> dict:
    """Backward-compatible single-string translation helper."""
    result = translate_texts([text], source, target)
    return {
        "translatedText": result["translations"][0],
        "source": source,
        "target": target,
        "model": result["model"],
    }
