# TravelMate Backend

Express + MongoDB backend for the **AI-Powered Smart Tourism Management System with Location-Aware Recommendations and Multilingual Travel Assistance**.

## Features

- JWT authentication and bcrypt password hashing
- MongoDB persistence with an in-memory fallback for demos
- Nearby place search, events, booking requests and user trip planner
- Python/Ollama assistant integration with current TravelMate place/event context
- Prepared website translations and local Python/Ollama translation fallback

## Run locally on Windows

1. Install Node.js 18 or newer and MongoDB Community Server.
2. Start MongoDB Community Server.
3. Copy `.env.example` to `.env` only if you do not already have a local `.env` file.
4. Set a private random `JWT_SECRET` and verify the local settings:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=travelmate
PYTHON_AI_URL=http://127.0.0.1:8001
```

Then run:

```powershell
npm install
npm run dev
```

The API runs at http://localhost:5000. Health check: http://localhost:5000/api/health.

## Website translation

The frontend applies prepared dictionaries first. Remaining English interface text is sent in batches to `POST /api/translate`; the backend forwards the request to the local Python service at `PYTHON_AI_URL`. Python uses the locally installed Ollama TranslateGemma model. No Google Cloud Translation account or paid translation API is required.

Keep Ollama and the Python service running for AI translation. If the Python service is unavailable, prepared dictionary translations continue to work, but unmatched text may remain in English.

## Optional Python assistant

Install Ollama and pull `qwen2.5:3b`, then run the Python service using [the Python service guide](../python-service/README.md). The backend sends the user's selected language, recent chat turns and a limited set of nearby place/event records to Python.

## Frontend

Run the frontend from `../travelmate-frontend` in a separate terminal. See the root README for the full startup steps.

## Data and safety

The backend seeds example Mysuru places and events when those collections are empty. External live-place/event APIs are optional. Never commit `.env`, passwords, JWT secrets, API keys, or user data.
