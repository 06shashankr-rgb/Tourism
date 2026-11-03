# TravelMate Python AI Service

This service contains the local Ollama chatbot and an optional IndicTrans2 translator. The translator can be called directly or used by the website through the Node API.

## 1. Requirements

- Windows 10/11
- Python 3.10 or 3.11 recommended
- Node backend running at `http://localhost:5000`
- Ollama for local generative AI conversations (optional for translation)
- Internet for initial package and model downloads

## 2. Local AI chatbot (optional)

Install Ollama from https://ollama.com/download/windows and run:

```powershell
ollama pull qwen2.5:3b
```

The default model is `qwen2.5:3b`. The Python chatbot receives the user's question, selected language, recent conversation and a small set of current TravelMate place/event records from the backend.

## 3. Run the Python API

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

## 4. Enable IndicTrans2 website translation

The frontend uses prepared translations first, then asks the Node API to translate remaining visible English UI text in small batches. Node forwards those requests to Python's `/translate-batch` endpoint. The model is loaded once on the first translation request and reused.

### Model and supported language options

TravelMate uses the AI4Bharat distilled English-to-Indic model:

`ai4bharat/indictrans2-en-indic-dist-200M`

The dropdown uses English language names for the IndicTrans2 language options: Assamese, Bengali, Bodo, Dogri, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santali, Sindhi, Tamil, Telugu and Urdu.

The configured distilled checkpoint is English-to-Indic. It does **not** translate arbitrary Indic-to-Indic or Indic-to-English requests. For those directions, the Indic-Indic or Indic-En checkpoints must be separately configured and selected. Do not infer language-direction support from a language appearing in the dropdown.

### Install the optional dependencies

IndicTrans2 inference requires PyTorch, Transformers, SentencePiece, Sacremoses and IndicTransToolkit. On Windows, install the compatible CPU build of PyTorch first using the official selector:

https://pytorch.org/get-started/locally/

Then, with the TravelMate Python virtual environment activated:

```powershell
pip install -r requirements-translation.txt
```

If you want to override the model, set the same environment variable before starting Uvicorn:

```powershell
$env:INDICTRANS_EN_INDIC_MODEL = "ai4bharat/indictrans2-en-indic-dist-200M"
```

Check the official model card and access requirements:
https://huggingface.co/ai4bharat/indictrans2-en-indic-dist-200M

The first translation request downloads the model. Model files and PyTorch can require several gigabytes of storage and memory. An 8 GB laptop may run slowly or run out of memory; install and test the lightweight Python API and Ollama separately before adding IndicTrans2 dependencies.

### Test the Python batch endpoint

With the Python service running, open http://127.0.0.1:8001/docs and test `POST /translate-batch`:

```json
{
  "texts": ["Welcome to Mysuru", "Explore nearby places"],
  "source": "eng_Latn",
  "target": "kan_Knda"
}
```

Expected response contains a `translations` array with the same number of entries as the input.

### Enable website translation

In `backend/.env`, verify:

```env
PYTHON_AI_URL=http://127.0.0.1:8001
```

The frontend calls `POST http://localhost:5000/api/translate` with:

```json
{
  "texts": ["Welcome to Mysuru", "Explore nearby places"],
  "target": "kan_Knda"
}
```

Node forwards this batch to Python, specifying English as the source language. Keep the backend, frontend and Python terminals running. After changing Python code or installing dependencies, restart Uvicorn. After changing the backend, restart Node.

## 5. API endpoints

- `GET /` and `GET /health`
- `POST /chat` — hybrid Ollama chatbot with TravelMate context
- `POST /translate` — single English-to-Indic translation
- `POST /translate-batch` — batch English-to-Indic translations

## Python files

- `app.py`: FastAPI endpoints
- `chatbot.py`: local Ollama chatbot and safe fallback
- `language_translator.py`: IndicTrans2 translation with local Ollama fallback

Keep this service bound to `127.0.0.1` during local development. Do not expose it directly to the public internet.


### Translation fallback

The translation service first attempts the optional AI4Bharat IndicTrans2 model. If its packages are not installed or the model cannot load, it uses the same local Ollama model configured for chat (`OLLAMA_MODEL`, default `qwen2.5:3b`). Therefore, basic translation does not require installing the optional IndicTrans2 dependencies, but Ollama must be running. Translation is English-to-Indic and should be reviewed for accuracy.
