# TravelMate

**AI-Powered Smart Tourism Management System with Location-Aware Recommendations and Multilingual Travel Assistance**

TravelMate is a React + Vite tourism website with a Node.js + Express API, MongoDB storage and a local Python/Ollama AI service. It includes separate Home, Places, Hotels, Travel, Events, AI Assistant and Planner pages.

The assistant uses local Ollama models. Website translation uses prepared dictionaries first and local Ollama TranslateGemma for remaining English-to-Indic text. No paid cloud AI or translation API is required.

## Requirements

- Node.js 18 or newer
- MongoDB Community Server
- Python 3.10 or 3.11 recommended
- Ollama for local chatbot and AI translation

## Open the project in VS Code

Open the repository folder containing `backend`, `travelmate-frontend` and `python-service`. Example:

`C:\Projects\Tourism\Tourism-New`

To update an existing clone:

```powershell
git pull origin main
```

## One-time local AI setup

Install Ollama from https://ollama.com/download/windows, then download both models:

```powershell
ollama pull qwen2.5:3b
ollama pull translategemma:4b
```

Keep Ollama running while using the AI assistant or local AI translation.

## Run TravelMate

Start MongoDB Community Server first. Keep each service running in its own VS Code terminal.

### Terminal 1 — Backend

```powershell
cd C:\Projects\Tourism\Tourism-New\backend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run dev
```

Keep your existing `backend/.env` and JWT secret. Verify these local settings are present:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=travelmate
PYTHON_AI_URL=http://127.0.0.1:8001
```

Backend health: http://localhost:5000/api/health

### Terminal 2 — Python AI service

```powershell
cd C:\Projects\Tourism\Tourism-New\python-service
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8001
```

If the virtual environment does not exist yet, create it once before activation:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Python API docs: http://127.0.0.1:8001/docs

### Terminal 3 — Frontend

```powershell
cd C:\Projects\Tourism\Tourism-New\travelmate-frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Main pages

- `/` — Home
- `/places` — nearby attractions, radius search and map routes
- `/hotels` — KSTDC Mayura hotel listings
- `/travel` — intercity journey estimates and Mysuru local transport guidance
- `/events` — events and internal booking requests
- `/ai` — local AI travel assistant
- `/planner` — saved places and booking requests

Hotels and travel estimates are informational. They do not confirm room availability, fares, tickets or transport bookings.

## Translation notes

Prepared dictionaries translate common labels and selected content immediately. Remaining English interface text is sent to the local Python service, which uses `translategemma:4b`. The chatbot uses `qwen2.5:3b`. Translation is English-to-Indic and should be reviewed for important names, addresses and travel details.

## Troubleshooting

- **MongoDB connection error:** start MongoDB Community Server and restart the backend.
- **Python assistant unavailable:** start Ollama and the Python API; verify `PYTHON_AI_URL=http://127.0.0.1:8001` in `backend/.env`.
- **Translation model unavailable:** run `ollama pull translategemma:4b`.
- **Chatbot model unavailable:** run `ollama pull qwen2.5:3b`.
- **Frontend cannot reach API:** keep the backend on port 5000 and frontend on port 5173.

Never commit `.env` files, passwords, API keys, or real user data.
