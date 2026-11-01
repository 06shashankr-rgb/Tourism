"""FastAPI entry point for TravelMate's local chatbot and translation services."""
import os
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from chatbot import answer_question
from language_translator import LANGUAGES, translate_text, translate_texts

app = FastAPI(title="TravelMate Local Python Service", version="1.2.0")
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
    language: str = Field(default="English", max_length=40)
    context: dict[str, Any] = Field(default_factory=dict)
    history: list[dict[str, str]] = Field(default_factory=list)

class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1500)
    source: str = "eng_Latn"
    target: str = Field(default="kan_Knda", min_length=3, max_length=20)

class TranslateBatchRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=50)
    source: str = "eng_Latn"
    target: str = Field(default="kan_Knda", min_length=3, max_length=20)

@app.get("/")
def root():
    return {"service": "TravelMate Local Python Service", "status": "ok"}

@app.get("/health")
def health():
    return {
        "ok": True,
        "chatbot": "local Ollama AI with rule-based fallback",
        "aiProvider": os.getenv("AI_PROVIDER", "ollama"),
        "ollamaModel": os.getenv("OLLAMA_MODEL", "qwen2.5:3b"),
        "translation": "optional IndicTrans2; model loads on first request",
        "languageCodes": sorted(LANGUAGES.keys()),
    }

@app.post("/chat")
def chat(body: ChatRequest):
    return answer_question(
        body.message.strip(),
        (body.location or "Mysuru").strip()[:100],
        body.language,
        body.context,
        body.history,
    )

@app.post("/translate-batch")
def translate_batch(body: TranslateBatchRequest):
    try:
        return translate_texts(body.texts, body.source, body.target)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Translation failed: {exc}") from exc

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
