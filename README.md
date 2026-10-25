# TravelMate

**AI-Powered Smart Tourism Management System with Location-Aware Recommendations and Multilingual Travel Assistance**

This repository contains the existing React + Vite frontend, Node.js + Express backend, MongoDB persistence layer, and an optional local Python assistant/IndicTrans2 translation service.

## Requirements

- Node.js 18+
- MongoDB Community Server installed and running locally
- Python 3.10 or 3.11 recommended for the optional Python service
- Internet for package installation and optional first-time model downloads

## Start the project on Windows

Open three terminals in VS Code.

### Terminal 1 — Backend + MongoDB

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

The example environment points to local MongoDB at `mongodb://127.0.0.1:27017`, database `travelmate`. Edit `.env` and set `JWT_SECRET` to a long random value before using accounts. Never commit `.env`.

Check http://localhost:5000/api/health.

### Terminal 2 — Frontend

```powershell
cd travelmate-frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally http://localhost:5173).

### Terminal 3 — Optional Python assistant

```powershell
cd python-service
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8001
```

The Node backend uses the Python assistant when `PYTHON_AI_URL=http://127.0.0.1:8001` is present in `backend/.env`. If the Python service is not running, the Node backend uses its fallback assistant.

## Offline Indian-language translation

The frontend already includes prepared interface translations. For translating new text, see [python-service/README.md](python-service/README.md) and the optional `requirements-translation.txt`. IndicTrans2 is not installed by the lightweight default setup; model downloads can be large and memory-intensive on an 8 GB laptop. Start with the chatbot, then install/test translation separately.

## Database

MongoDB Compass is a GUI for your local server; it is not the database server itself. Use `mongodb://127.0.0.1:27017`. The backend creates/uses the `travelmate` database and seeds sample `places` and `events` if empty. User, planner, and booking documents are saved as the application uses those features.

## Important

- This setup is for local development. It does not automatically publish the website to a public hosting provider.
- Live places/events integrations need their optional API keys; the app includes local sample data.
- Do not commit secrets or real user information.
