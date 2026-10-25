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

## Languages and translation

The website has prepared interface dictionaries for English, Kannada, Hindi, Tamil and Telugu. Text missing from those dictionaries may remain in English. AI replies are prompted to use the selected language, but language quality depends on the local model and is not guaranteed to be perfect.

The separate Python `/translate` endpoint uses optional AI4Bharat IndicTrans2. It is not required for the chatbot and is not automatically applied to every page. See [python-service/README.md](python-service/README.md) and `python-service/requirements-translation.txt` for setup. Model downloads can be large and memory-intensive, especially on laptops with 8 GB RAM.

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
