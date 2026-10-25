"""Optional local IndicTrans2 translation engine.

Model/deep-learning dependencies are loaded only when a translation is requested.
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

@lru_cache(maxsize=1)
def load_translator():
    """Load IndicTrans2 only when requested, not during normal service startup."""
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        from IndicTransToolkit.processor import IndicProcessor
    except ImportError as exc:
        raise RuntimeError(
            "Translation dependencies are not installed. Install python-service/requirements-translation.txt."
        ) from exc
    model_name = os.getenv("INDICTRANS_MODEL", "ai4bharat/indictrans2-en-indic-dist-200M")
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name, trust_remote_code=True)
        model.to("cpu")
        model.eval()
        processor = IndicProcessor(inference=True)
        return torch, tokenizer, model, processor
    except Exception as exc:
        raise RuntimeError(f"Could not load model '{model_name}'. Check internet access/model access and available RAM. Details: {exc}") from exc

def translate_text(text: str, source: str = "eng_Latn", target: str = "kan_Knda") -> dict:
    """Translate one sentence with IndicTrans2; returns metadata with the text."""
    supported = set(LANGUAGES.values())
    if source not in supported or target not in supported:
        raise ValueError("Unsupported language code. Use a supported IndicTrans2 code such as eng_Latn, kan_Knda, or hin_Deva.")
    torch, tokenizer, model, processor = load_translator()
    prepared = processor.preprocess_batch([text.strip()], src_lang=source, tgt_lang=target)
    inputs = tokenizer(prepared, return_tensors="pt", padding=True, truncation=True, max_length=256)
    with torch.no_grad():
        generated = model.generate(**inputs, max_length=256, num_beams=2)
    decoded = tokenizer.batch_decode(generated, skip_special_tokens=True)
    result = processor.postprocess_batch(decoded, lang=target)
    return {"translatedText": result[0], "source": source, "target": target,
            "model": os.getenv("INDICTRANS_MODEL", "ai4bharat/indictrans2-en-indic-dist-200M")}
