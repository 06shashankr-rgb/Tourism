# TravelMate Python AI Service

This service exposes the separate Python chatbot and language translator for TravelMate. The chatbot uses a **hybrid design**: a local Ollama language model for open-ended conversations, with TravelMate place/event context supplied by the Node backend. If Ollama is unavailable, the service returns a transparent rule-based fallback instead of pretending a model answered.

## 1. Requirements

- Windows 10/11
- Python 3.10 or 3.11 recommended
- Node backend running at `http://localhost:5000`
- Ollama installed for generative local AI (free; no per-message cloud API key)
- Internet for initial package/model downloads

## 2. Install and start Ollama

1. Install Ollama for Windows from https://ollama.com/download/windows
2. Open a new VS Code terminal and download the recommended small model:

   ```powershell
   ollama pull qwen2.5:3b
   ```

3. Check that Ollama responds:

   ```powershell
   ollama run qwen2.5:3b
   ```

   Type a short question to test it, then type `/bye` to leave the model chat. The Ollama Windows app normally keeps its local service running. If it is not running, start Ollama from the Start menu or run `ollama serve` in a separate terminal.

The default model is `qwen2.5:3b`. You can select another model available in your Ollama installation by setting the `OLLAMA_MODEL` environment variable before starting Python, for example:

```powershell
$env:OLLAMA_MODEL = "qwen2.5:3b"
$env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
```

A 3B model is a reasonable starting point for many laptops, but speed and quality depend on available RAM/CPU. Model answers can be wrong; check official sources for changing travel facts.

## 3. Start TravelMate Python service

From the repository root in VS Code:

```powershell
cd python-service
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8001
```

If PowerShell blocks activation, run the venv executables directly:

```powershell
.\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt
.\\.venv\\Scripts\\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8001
```

Open http://127.0.0.1:8001/docs and test `POST /chat`. The Node backend calls this Python service when `PYTHON_AI_URL=http://127.0.0.1:8001` is set in `backend/.env`. It sends the user's question, selected language, recent conversation turns, and a small context containing places/events from the TravelMate database.

## 4. AI behaviour

- `POST /chat`: local Ollama model, language instruction, conversation history and grounded TravelMate context.
- The system prompt asks the model not to invent prices, opening hours, event availability, or completed bookings.
- If Ollama is not running or the model is missing, a rule-based fallback is returned with a warning in the reply. The response's `provider` field identifies the path used.
- The model may reply in English, Kannada, Hindi, Tamil or Telugu when asked; this is model-generated language, not a guarantee of perfect translation.
- The React website's five interface dictionaries remain in `travelmate-frontend/src/translations.js`. This is separate from dynamic AI replies.

## 5. Optional sentence translation with IndicTrans2

The separate `POST /translate` endpoint uses AI4Bharat IndicTrans2. It is not required for the AI chatbot.

1. Install CPU PyTorch using https://pytorch.org/get-started/locally/
2. Activate the Python environment and install:
   ```powershell
   pip install -r requirements-translation.txt
   ```
3. Review model access/licensing: https://huggingface.co/ai4bharat/indictrans2-en-indic-dist-200M
4. Start the Python service as above. The model loads only on the first translation request.
5. Test `POST /translate` with:
   ```json
   {"text":"Welcome to Mysuru","source":"eng_Latn","target":"kan_Knda"}
   ```

The first translation downloads model files and requires internet. Model downloads can be large and memory-intensive, especially on 8 GB RAM laptops. The default model is English-to-Indic; it does not support every language direction.

## API endpoints

- `GET /` and `GET /health`
- `POST /chat` — `{"message":"Plan a two-day Mysuru trip","location":"Mysuru","language":"English","context":{},"history":[]}`
- `POST /translate` — `{"text":"Welcome to Mysuru","source":"eng_Latn","target":"kan_Knda"}`

## Python files

- `app.py`: FastAPI routes.
- `chatbot.py`: Ollama-based conversational AI and fallback logic.
- `language_translator.py`: optional IndicTrans2 sentence translation.
- `requirements.txt`: lightweight web service dependencies.
- `requirements-translation.txt`: optional model dependencies.

Keep the service bound to `127.0.0.1) during local development. Do not expose it directly to the public internet.
