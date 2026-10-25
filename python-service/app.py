"""FastAPI entry point for TravelMate's local chatbot and translation services."""
import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from chatbot import answer_question
from language_translator import LANGUAGES, translate_text

app = FastAPI(title="TravelMate Local Python Service", version="1.1.0")
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

@app.get("/")
def root():
    return {"service": "TravelMate Local Python Service", "status": "ok"}

@app.get("/health")
def health():
    return {
        "ok": True,
        "chatbot": "rule-based local service",
        "translation": "optional IndicTrans2; model loads on first request",
        "languageCodes": sorted(LANGUAGES.keys()),
    }

@app.post("/chat")
def chat(body: ChatRequest):
    return {"reply": answer_question(body.message.strip(), (body.location or "Mysuru").strip()[:100])}

@app.post("/translate")
def translate(body: TranslateRequest):
    try:
        return translate_text(body.text, body.source, body.target)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Translation failed: {exc}") from exc
