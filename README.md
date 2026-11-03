# TravelMate

**AI-Powered Smart Tourism Management System with Location-Aware Recommendations and Multilingual Travel Assistance**

TravelMate contains a React + Vite frontend, Node.js + Express backend, MongoDB persistence, and a Python hybrid AI assistant. The assistant uses a local Ollama model for natural conversation and receives place/event context from the TravelMate backend. A local IndicTrans2 model is the primary translation engine for English-to-Indic website text, with optional local Ollama fallback.

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

## Languages and translation

The language selector shows language names in English, including **Kannada, Tamil, Telugu, Hindi, Malayalam, Bengali, Gujarati** and other supported Indian languages.

TravelMate uses two local translation layers:

1. **Prepared dictionaries:** important labels and common place/event content are translated immediately for English, Kannada, Hindi, Tamil and Telugu.
2. **Local AI translation:** untranslated visible page text is sent from React to the Node backend and then to the Python service. Python first tries the optional AI4Bharat IndicTrans2 model. If its dependencies or model are unavailable, it falls back to the already-running local Ollama model (default `qwen2.5:3b`). Temporary translation failures are retried by the frontend.

No paid cloud translation API is used. The local models translate from English into supported Indic languages; they do not guarantee every language direction or perfect translation quality. The model may take time to translate a page, especially on a CPU-only laptop. Review translations before using them for official information.

### Install IndicTrans2 on Windows using WSL2 (recommended)

The IndicTransToolkit used by the Hugging Face IndicTrans2 model is documented for Linux/macOS and is not officially supported on native Windows. Run the Python translation service inside Ubuntu on WSL2; the React and Node services can remain on Windows.

1. Install WSL2 and Ubuntu from an Administrator PowerShell terminal:

```powershell
wsl --install -d Ubuntu
```

Restart Windows if prompted, open Ubuntu from the Start menu, and create your Linux username/password.

2. In the Ubuntu terminal, install Python tools:

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip git
cd /mnt/c/Projects/Tourism/python-service
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
```

3. Install CPU-only PyTorch and IndicTrans2 dependencies:

```bash
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
python -m pip install -r requirements.txt
```

4. Start the Python API inside Ubuntu, listening on all WSL interfaces:

```bash
export TRANSLATION_FALLBACK=none
python -m uvicorn app:app --host 0.0.0.0 --port 8001
```

Windows can usually reach this WSL service at `http://127.0.0.1:8001` through WSL localhost forwarding. Keep the Ubuntu terminal open. In `backend/.env` on Windows, keep `PYTHON_AI_URL=http://127.0.0.1:8001`.

5. Open the health endpoint in your Windows browser: http://127.0.0.1:8001/health. The first translation request downloads and caches the model. Confirm the response reports `translation.indicTrans2Ready: true` after the model loads.

6. Test a Kannada translation from a Windows PowerShell terminal:

```powershell
$body = @{
    texts = @("Welcome to Mysuru", "Find tourist places near me")
    source = "eng_Latn"
    target = "kan_Knda"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8001/translate-batch" -ContentType "application/json" -Body $body
```

Use `hin_Deva` for Hindi, `tam_Taml` for Tamil, and other supported target codes for the remaining languages. If Windows cannot reach the WSL API, check that Uvicorn is still running and that WSL2 localhost forwarding is enabled.

IndicTrans2 runs locally after its initial model download. It does not require a paid translation API or an NVIDIA GPU. CPU translation can be slow, and the model needs available RAM and disk space.
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
