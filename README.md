# TravelMate

**AI-Powered Smart Tourism Management System with Location-Aware Recommendations and Multilingual Travel Assistance**

TravelMate contains a React + Vite frontend, Node.js + Express backend, MongoDB persistence, and a Python hybrid AI assistant. The assistant uses a local Ollama model for natural conversation and receives place/event context from the TravelMate backend. A separate IndicTrans2 endpoint can optionally translate sentences.

## Requirements

- Node.js 18 or newer
- MongoDB Community Server installed and running
- Python 3.10 or 3.11
- Ollama for local generative AI (no paid API key needed)
- Internet for initial package and model downloads

## Open the correct folder in VS Code

Open the project root folder containing `backend`, `travelmate-frontend`, and `python-service`. For the fresh clone described in this guide, that is:

`C:\Projects\Tourism\Tourism-New`

To update a clone, open a terminal at the project root and run:

```powershell
git pull origin main
```

## One-time setup: install the local AI model

1. Install Ollama for Windows from https://ollama.com/download/windows
2. In a terminal, run:

   ```powershell
   ollama pull qwen2.5:3b
   ```

3. Verify the model works:

   ```powershell
   ollama run qwen2.5:3b
   ```

   Ask it a question, then type `/bye`. The Ollama Windows app usually keeps its local API running at `http://127.0.0.1:11434`. If it is not running, start the app or run `ollama serve` in a separate terminal.

The Python service defaults to `OLLAMA_MODEL=qwen2.5:3b`. To use another model, set `$env:OLLAMA_MODEL="your-model-name"` in the Python terminal before starting the service.

## Start TravelMate

Run each service in a separate VS Code terminal and keep those terminals open.

### Terminal 1 — Backend

```powershell
cd C:\Projects\Tourism\Tourism-New\backend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run dev
```

Make sure `backend/.env` contains these local settings. Keep any existing JWT secret and do not overwrite an already configured `.env` file:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=travelmate
PYTHON_AI_URL=http://127.0.0.1:8001
```

Start MongoDB Community Server first. A successful backend start prints `Connected to MongoDB.` and `TravelMate API running at http://localhost:5000`.

Backend health check: http://localhost:5000/api/health

### Terminal 2 — Frontend

```powershell
cd C:\Projects\Tourism\Tourism-New\travelmate-frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually http://localhost:5173.

### Terminal 3 — Python hybrid AI service

```powershell
cd C:\Projects\Tourism\Tourism-New\python-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8001
```

If PowerShell blocks virtual environment activation, use the environment executable directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8001
```

Python API docs: http://127.0.0.1:8001/docs

The Node backend forwards the user's question, selected language, recent conversation turns, and a limited context of nearby place/event records to Python. Python uses Ollama for open-ended replies. If Ollama is unavailable, it returns an explicitly labelled rule-based fallback. The model does not actually create bookings or modify the planner; those actions remain in the website.

## Languages and translation — free local setup

TravelMate uses a **two-layer translation approach**:

1. **Prepared translations first:** the built-in dictionaries translate important interface labels and common TravelMate content in English, Kannada, Hindi, Tamil and Telugu. These work immediately and do not need a translation server.
2. **Local AI translation for remaining text:** the React translator sends untranslated visible text to the Node backend. The backend forwards it to the Python service, which runs the free AI4Bharat IndicTrans2 model on this computer. Translations are cached in the browser for the current session.

**No paid cloud translation API is used by this website flow.** The backend translation endpoint uses only the local Python service. Leave any old `GCP_PROJECT_ID` setting blank; the translation route does not call Google Cloud Translation.

### Install the optional local translation model

1. Start with the Python environment steps above and install the lightweight service requirements.
2. Install CPU PyTorch using the official selector: https://pytorch.org/get-started/locally/
3. In the activated `python-service` environment, run:

   ```powershell
   pip install -r requirements-translation.txt
   ```

4. Start the Python service at `http://127.0.0.1:8001`. The IndicTrans2 model downloads the first time a translation is requested; after that it runs locally. The initial model download requires internet and storage. CPU translation can be slow and uses significant RAM.
5. Keep `PYTHON_AI_URL=http://127.0.0.1:8001` in `backend/.env`, then restart the backend and frontend.

The local IndicTrans2 path supports Assamese, Bengali, Gujarati, Hindi, Kannada, Malayalam, Marathi, Maithili, Manipuri, Nepali, Odia, Punjabi, Sanskrit, Tamil, Telugu and Urdu. Bhojpuri and Mizo are shown in the language selector but are not supported by this local model; those pages use prepared translations where available and otherwise retain English text. English, Kannada, Hindi, Tamil and Telugu have prepared interface dictionaries.

### Test translation

With all three services running, open:

- Backend health: http://localhost:5000/api/health
- Python health: http://127.0.0.1:8001/health
- Python API docs: http://127.0.0.1:8001/docs

In the Python docs, test `POST /translate-batch` with:

```json
{
  "texts": ["Welcome to TravelMate", "Explore nearby places"],
  "source": "eng_Latn",
  "target": "kan_Knda"
}
```

Then open TravelMate, choose Kannada (or another locally supported language), and check the navigation, page headings, buttons, form placeholders, image alt text, and text that loads after navigation. Change back to English and confirm the original text returns.


## IndicTrans2 website translation

The language dropdown displays the language names in English. The website uses local dictionary translations first and then requests English-to-Indic batch translations for remaining visible UI text through the Node backend and Python IndicTrans2 service.

Supported language names in the selector: Assamese, Bengali, Bodo, Dogri, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santali, Sindhi, Tamil, Telugu and Urdu, plus English.

The configured distilled checkpoint is English-to-Indic only. Indic-to-Indic and Indic-to-English require their corresponding IndicTrans2 checkpoints and separate model configuration; the current selector does not mean every direction is supported.

To enable the website translation engine, first start all three services as described above. Then open a fourth VS Code terminal, activate the Python virtual environment and install the optional translation packages. Install the compatible CPU version of PyTorch first from https://pytorch.org/get-started/locally/ .

```powershell
cd C:\Projects\Tourism\Tourism-New\python-service
.\.venv\Scripts\Activate.ps1
pip install -r requirements-translation.txt
```

Restart the Python service after installation. The first translation request downloads the model, so it needs internet and can require several GB of disk space and RAM. On an 8 GB laptop, test cautiously; translation may be slow or run out of memory. The local dictionary translations continue to work for the strings already included even when the IndicTrans2 model is not installed.

For details and the batch endpoint test, see [python-service/README.md](python-service/README.md).

## Database and live data

MongoDB Compass is a GUI client, not the database server. The backend uses `mongodb://127.0.0.1:27017`, database `travelmate`. Sample places and events are available locally. Live places/events integrations require optional external API keys.

## Troubleshooting

- **`MongoDB URI not set`:** check `backend/.env` contains `MONGODB_URI=mongodb://127.0.0.1:27017`.
- **MongoDB connection error:** start MongoDB Community Server, then restart the backend.
- **AI reply says local model is unavailable:** start Ollama and run `ollama pull qwen2.5:3b`.
- **Python assistant unavailable:** make sure Terminal 3 is running and `PYTHON_AI_URL=http://127.0.0.1:8001` is in `backend/.env`.
- **Frontend cannot reach API:** keep the backend on port 5000 and frontend on port 5173.
- **Port already in use:** stop the other process running that service before restarting.

Never commit `.env` files, passwords, API keys, or real user data. This is local development setup and does not deploy the website publicly.
