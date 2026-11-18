"""Hybrid TravelMate assistant: local Ollama model with a safe rule-based fallback.

Ollama runs on the user's computer; no paid AI API key is required. The Node
backend supplies grounded place/event context so answers can use app data.
"""
import json
import os
import urllib.error
import urllib.request
from typing import Any


def _ollama_chat(message: str, location: str, language: str,
                 context: dict[str, Any] | None,
                 history: list[dict[str, str]] | None) -> str:
    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    context_text = json.dumps(context or {}, ensure_ascii=False)[:14000]
    language_instruction = (
        "Reply in the same language as the user's latest message."
        if language.lower() in {"auto", "automatic", "same as user"} else
        f"Reply in {language}. Keep place names recognizable."
    )
    system = (
        "You are TravelMate, a helpful tourism and itinerary assistant. "
        "Use the supplied TravelMate application context for claims about places and events. "
        "Never invent event dates, prices, opening hours, availability, bookings, or live facts. "
        "If the context does not contain a fact, say that you cannot verify it and suggest checking "
        "the official source. Make practical, concise itineraries; ask a short follow-up when budget, "
        "dates, interests, or trip length are essential. You may suggest actions in the website but "
        "must never claim you created a booking or saved a planner item unless the application confirms it. "
        + language_instruction
        + "\nCurrent destination: " + (location or "Mysuru")
        + "\nTravelMate data context (JSON): " + context_text
    )
    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    for item in (history or [])[-8:]:
        role = item.get("role")
        text = str(item.get("content", ""))[:2000]
        if role in {"user", "assistant"} and text:
            messages.append({"role": role, "content": text})
    messages.append({"role": "user", "content": message})
    payload = json.dumps({
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.4, "num_ctx": 8192},
    }).encode("utf-8")
    request = urllib.request.Request(
        base_url + "/api/chat", data=payload,
        headers={"Content-Type": "application/json"}, method="POST"
    )
    timeout = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "90"))
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            result = json.loads(response.read().decode("utf-8"))
        answer = str(result.get("message", {}).get("content", "")).strip()
        if not answer:
            raise RuntimeError("Ollama returned an empty answer.")
        return answer
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(
            f"Local AI model unavailable at {base_url}. Start Ollama and download '{model}'. Details: {exc}"
        ) from exc


def ollama_status() -> dict[str, Any]:
    """Return a safe local diagnostic for the configured Ollama model."""
    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    request = urllib.request.Request(base_url + "/api/tags", headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=4) as response:
            data = json.loads(response.read().decode("utf-8"))
        names = [str(item.get("name", "")) for item in data.get("models", [])]
        available = any(name == model or name.startswith(model + ":") for name in names)
        return {
            "connected": True,
            "model": model,
            "modelAvailable": available,
            "message": "Ollama is running and the configured model is installed." if available
                       else f"Ollama is running, but model '{model}' is not installed. Run: ollama pull {model}",
        }
    except Exception as exc:
        return {
            "connected": False,
            "model": model,
            "modelAvailable": False,
            "message": f"Cannot reach Ollama at {base_url}. Start Ollama and check its local service. Details: {exc}",
        }


def answer_question(message: str, location: str = "Mysuru",
                    language: str = "English",
                    context: dict[str, Any] | None = None,
                    history: list[dict[str, str]] | None = None) -> dict[str, str]:
    """Generate an answer with Ollama, or provide an honest lightweight fallback."""
    if os.getenv("AI_PROVIDER", "ollama").lower() == "ollama":
        try:
            return {
                "reply": _ollama_chat(message, location, language, context, history),
                "provider": "ollama-local",
            }
        except RuntimeError as exc:
            # Keep the app usable if Ollama is not installed, but disclose fallback.
            fallback = _rule_based_answer(message, location, context)
            return {
                "reply": fallback + "\n\n(Local AI is not connected yet. Start Ollama to enable open-ended AI replies.)",
                "provider": "rule-based-fallback",
                "warning": str(exc),
            }
    return {"reply": _rule_based_answer(message, location, context), "provider": "rule-based"}


def _rule_based_answer(message: str, location: str,
                       context: dict[str, Any] | None = None) -> str:
    text = message.casefold()
    places = (context or {}).get("places", [])
    events = (context or {}).get("events", [])
    if any(w in text for w in ("hello", "hi", "hey", "namaste")):
        return f"Hello! Welcome to TravelMate. I can help you explore {location}, find attractions and events, and plan a trip. What are you interested in?"
    if any(w in text for w in ("event", "festival", "concert", "show")):
        if events:
            return "Events available in TravelMate's current data: " + "; ".join(
                f"{e.get('name', 'Event')} at {e.get('venue', 'venue not listed')}" for e in events[:5]
            ) + ". Please confirm dates and ticket details with the organiser."
        return f"I couldn't find event records for {location} in the current TravelMate data. Try the Events page or check official local listings."
    if any(w in text for w in ("place", "attraction", "visit", "sightseeing", "tourist", "nearby")):
        if places:
            return f"Here are some places from TravelMate's current data near {location}: " + "; ".join(
                f"{p.get('name', 'Place')}" + (f" ({p['distance']:.1f} km away)" if isinstance(p.get("distance"), (int, float)) else "")
                for p in places[:5]
            ) + ". Check current opening hours before visiting."
        return f"TravelMate has no matching place records near {location} right now. Try expanding your search radius."
    if any(w in text for w in ("plan", "itinerary", "trip", "day")):
        return "I can help build an itinerary. Tell me your trip length, budget, interests (history, nature, food, shopping), and preferred pace. I can use the places currently listed in TravelMate."
    if any(w in text for w in ("book", "booking", "ticket")):
        return "Open TravelMate's Events page, choose an event, and use its booking flow if available. Check the event organiser, date, ticket terms and total before confirming."
    return f"I can help with destinations, nearby attractions, events and trip planning for {location}. For a tailored itinerary, tell me your dates, budget and interests."


def translate_prompt_language(language: str) -> str:
    """Kept as a tiny helper for callers that need a user-friendly language name."""
    return language or "English"
