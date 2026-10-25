"""Local TravelMate assistant API.

The chatbot works without a cloud API. IndicTrans2 translation is optional and
loads only when /translate is called, so the basic chatbot works on 8 GB RAM.
"""
import os
from functools import lru_cache
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="TravelMate Local AI Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    location: Optional[str] = "Mysuru"

class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1500)
    source: str = "eng_Latn"
    target: str = Field(default="kan_Knda", min_length=3, max_length=20)

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

def answer_question(message: str, location: str = "Mysuru") -> str:
    text = message.casefold()
    if any(w in text for w in ("hello", "hi", "hey", "namaste")):
        return f"Hello! Welcome to TravelMate. I can help you explore {location}, discover attractions, plan a trip, and find events. What would you like to do?"
    if any(w in text for w in ("place", "attraction", "visit", "sightseeing", "tourist", "nearby")):
        return f"Popular places to research in {location} include Mysuru Palace, Chamundi Hill, St. Philomena's Cathedral, Karanji Lake, and Brindavan Gardens. Check current opening hours and travel details before visiting."
    if any(w in text for w in ("food", "restaurant", "eat", "cuisine")):
        return f"To explore food in {location}, compare nearby restaurants by distance, opening hours, reviews, and dietary options. TravelMate's Places section can show available place records."
    if any(w in text for w in ("hotel", "stay", "accommodation", "lodging")):
        return f"Compare accommodation in {location} by budget, location, guest reviews, and cancellation policy. Confirm availability directly with the provider before booking."
    if any(w in text for w in ("event", "festival", "concert", "show")):
        return f"Check TravelMate's Events section for listed events in or near {location}. Event dates and ticket availability can change, so confirm details with the official organiser."
    if any(w in text for w in ("plan", "itinerary", "trip", "day")):
        return "For a simple itinerary, group nearby attractions together, check opening times, leave time for travel and meals, and keep one flexible slot. Tell me your trip length, budget, and interests for a more tailored outline."
    if any(w in text for w in ("book", "booking", "ticket")):
        return "Open the Events section, choose an event, and follow its booking instructions. Check the provider, ticket terms, date, and total price before confirming any purchase."
    if any(w in text for w in ("translate", "language", "kannada", "hindi")):
        return "TravelMate includes prepared interface translations. For translating new sentences offline, start the optional IndicTrans2 setup described in python-service/README.md."
    return "I can help with tourist attractions, restaurants, accommodation, local events, bookings, and trip planning. Tell me your destination and what you are looking for."

@app.get("/")
def root():
    return {"service": "TravelMate Local Python Service", "status": "ok"}

@app.get("/health")
def health():
    return {"ok": True, "translation": "optional IndicTrans2; model loads on first request"}

@app.post("/chat")
def chat(body: ChatRequest):
    return {"reply": answer_question(body.message.strip(), (body.location or "Mysuru").strip()[:100])}

@lru_cache(maxsize=1)
def load_translator():
    """Load IndicTrans2 only when requested, not during normal service startup."""
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        from IndicTransToolkit.processor import IndicProcessor
    except ImportError as exc:
        raise RuntimeError(
            "Translation dependencies are not installed. Follow python-service/README.md and install requirements-translation.txt."
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

@app.post("/translate")
def translate(body: TranslateRequest):
    if body.source not in set(LANGUAGES.values()) or body.target not in set(LANGUAGES.values()):
        raise HTTPException(status_code=400, detail="Unsupported language code. Use a supported IndicTrans2 code such as eng_Latn, kan_Knda, or hin_Deva.")
    try:
        torch, tokenizer, model, processor = load_translator()
        prepared = processor.preprocess_batch([body.text.strip()], src_lang=body.source, tgt_lang=body.target)
        inputs = tokenizer(prepared, return_tensors="pt", padding=True, truncation=True, max_length=256)
        with torch.no_grad():
            generated = model.generate(**inputs, max_length=256, num_beams=2)
        decoded = tokenizer.batch_decode(generated, skip_special_tokens=True)
        result = processor.postprocess_batch(decoded, lang=body.target)
        return {"translatedText": result[0], "source": body.source, "target": body.target, "model": os.getenv("INDICTRANS_MODEL", "ai4bharat/indictrans2-en-indic-dist-200M")}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Translation failed: {exc}") from exc
