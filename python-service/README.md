# TravelMate Python AI Service

This service provides TravelMate's local Ollama chatbot and English-to-Indic translation API.

## Requirements

- Windows 10/11
- Python 3.10 or 3.11 recommended
- Node backend running at `http://localhost:5000`
- Ollama installed locally
- Internet access for initial Python package and Ollama model downloads

## Local AI models

Install Ollama from https://ollama.com/download/windows and download the models:

```powershell
ollama pull qwen2.5:3b
ollama pull translategemma:4b
```

- `qwen2.5:3b` powers the TravelMate assistant.
- `translategemma:4b` powers local English-to-Indic translation.

No paid cloud translation or chatbot API is required. Keep Ollama running while using these features.

## Run the Python API

From the repository root:

```powershell
cd python-service
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8001
```

API documentation: http://127.0.0.1:8001/docs

The Node backend uses `PYTHON_AI_URL=http://127.0.0.1:8001` from `backend/.env`.

## Translation

The frontend applies prepared dictionaries first, then sends remaining English interface text to the Node API in small batches. Node forwards the batches to the Python `/translate-batch` endpoint. The Python service uses the locally installed TranslateGemma model.

The service supports English as the source language and the configured Indic target language codes. A language appearing in the website selector does not guarantee two-way or Indic-to-Indic translation.

To test the batch endpoint, open http://127.0.0.1:8001/docs and send a request to `POST /translate-batch`:

```json
{
  "texts": ["Welcome to Mysuru", "Explore nearby places"],
  "source": "eng_Latn",
  "target": "kan_Knda"
}
```

The response contains a `translations` array. Review translations of names, addresses and travel details.

## Website integration

In `backend/.env`, verify:

```env
PYTHON_AI_URL=http://127.0.0.1:8001
```

Keep MongoDB, the Node backend, Ollama, the Python API and the Vite frontend running in their respective terminals. Restart the service whose code you change.

## API endpoints

- `GET /` and `GET /health`
- `POST /chat` — local Ollama assistant with TravelMate place/event context
- `POST /translate` — single English-to-Indic translation
- `POST /translate-batch` — batch English-to-Indic translations

Keep this service bound to `127.0.0.1` during local development. Do not expose it directly to the public internet.
