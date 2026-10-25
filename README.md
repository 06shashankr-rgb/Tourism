# TravelMate

**AI-Powered Smart Tourism Management System with Location-Aware Recommendations and Multilingual Travel Assistance**

TravelMate uses a React + Vite frontend, Node.js + Express backend, MongoDB, and an optional local Python service for the tourism chatbot and sentence translation.

## Requirements

- Node.js 18 or newer
- MongoDB Community Server installed and running
- Python 3.10 or 3.11 for the optional Python service
- Internet for package installation; optional IndicTrans2 model downloads are large

## Open the correct folder in VS Code

Open the inner project folder, not the outer parent folder:

`C:\\Projects\\Tourism\\Tourism`

In VS Code, choose **File → Open Folder** and select that folder. The Explorer should show `backend`, `travelmate-frontend`, and `python-service` at the same level.

If you already cloned the project, update it from a terminal opened at that folder:

```powershell
git pull origin main
```

## Start TravelMate

Keep each service running in its own VS Code terminal. Use **Terminal → New Terminal** to create each terminal.

### Terminal 1 — Backend

```powershell
cd C:\\Projects\\Tourism\\Tourism\\backend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run dev
```

Make sure `backend/.env` contains the local database settings:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=travelmate
PYTHON_AI_URL=http://127.0.0.1:8001
```

Do not overwrite an existing `.env` if you have already configured it. Make sure MongoDB Community Server is running. A successful backend start prints `Connected to MongoDB.` and `TravelMate API running at http://localhost:5000`.

Health check: http://localhost:5000/api/health

### Terminal 2 — Frontend

```powershell
cd C:\\Projects\\Tourism\\Tourism\\travelmate-frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually http://localhost:5173. Keep the backend and frontend terminals open.

### Terminal 3 — Optional Python chatbot

Start this only if you want the separate Python chatbot service:

```powershell
cd C:\\Projects\\Tourism\\Tourism\\python-service
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8001
```

API documentation: http://127.0.0.1:8001/docs

If PowerShell blocks virtual-environment activation, you can run the environment's Python directly instead:
` .\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt ` and
` .\\.venv\\Scripts\\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8001 `.

The Node backend uses the Python chatbot when `PYTHON_AI_URL=http://127.0.0.1:8001` is set in `backend/.env` and the Python service is running. Otherwise, the Node backend falls back to its built-in assistant.

## Languages and translation

The website currently has prepared interface translations for **English, Kannada, Hindi, Tamil, and Telugu**. The language selector is not a universal automatic translator: text without a matching dictionary entry can remain in English. The translator module has been fixed so switching between supported languages restores the original text before applying the next language.

The separate Python `/translate` endpoint uses optional AI4Bharat IndicTrans2. It is not required to run the website or chatbot, and it is not automatically used to translate every page. See [python-service/README.md](python-service/README.md) and `python-service/requirements-translation.txt` for optional model setup. Model downloads can be large and memory-intensive on an 8 GB laptop.

## Database and live data

MongoDB Compass is a GUI client, not the database server. The backend uses local MongoDB at `mongodb://127.0.0.1:27017`, database `travelmate`. Sample places and events are available locally. Live places/events integrations require optional external API keys.

## Troubleshooting

- **`MongoDB URI not set`:** check that `backend/.env` exists and contains `MONGODB_URI=mongodb://127.0.0.1:27017`.
- **MongoDB connection error:** start MongoDB Community Server, then restart the backend with `Ctrl+C` and `npm run dev`.
- **Port already in use:** close the other process or stop the previous terminal running the same service.
- **Frontend cannot reach API:** keep the backend running on port 5000 and the frontend on port 5173.
- **Python service not running:** this is optional; the backend should fall back to its built-in assistant.

Do not commit `.env` files, passwords, API keys, or real user data. This is a local development setup and does not deploy the website publicly.
