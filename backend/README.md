# TravelMate Backend

Express + MongoDB backend for the **AI-Powered Smart Tourism Management System with Location-Aware Recommendations and Multilingual Travel Assistance**.

## Features

- JWT authentication and bcrypt password hashing
- MongoDB persistence (with an in-memory fallback for demos)
- Nearby place search, events, booking records and user trip planner
- Hybrid assistant route: forwards current place/event data and chat history to the local Python/Ollama model, with a clearly labelled fallback
- Prepared website translations; optional Python IndicTrans2 translation service

## Run locally on Windows

1. Install Node.js 18 or newer and MongoDB Community Server.
2. In MongoDB Compass, confirm the local connection works at `mongodb://127.0.0.1:27017`.
3. In this folder, copy `.env.example` to `.env`. Keep the local MongoDB URI and set a long random `JWT_SECRET`.
4. Open a terminal here and run:

   ```powershell
   npm install
   npm run dev
   ```

The API runs at http://localhost:5000. Check http://localhost:5000/api/health.

## Optional Google Cloud Translation API

The backend exposes `POST /api/translate` for translating a short text string into a supported language. The endpoint accepts JSON such as:

```json
{ "text": "Welcome to Mysuru", "targetLanguage": "kn" }
```

The target language is a Google Translate language code (for example, `kn` Kannada, `ta` Tamil, `te` Telugu, `hi` Hindi, `ml` Malayalam, `bn` Bengali, or `en` English). Text is limited to 5,000 characters per request. The endpoint is available only when Google Cloud Translation is configured.

To enable it:

1. Enable the Cloud Translation API in your Google Cloud project and configure billing/permissions.
2. Set `GCP_PROJECT_ID` in your local `.env`.
3. Configure Google Application Default Credentials. For local development, set `GOOGLE_APPLICATION_CREDENTIALS` to the path of a service-account JSON key stored outside the repository; production should use the hosting platform's workload identity where possible.
4. Run `npm install` and restart the backend.

Do not commit service-account JSON keys, `.env` files, API secrets, or user data. Google Cloud Translation may incur charges. This endpoint provides translation on request; it does not automatically translate every frontend component until the frontend is explicitly wired to call it.

## Optional Python assistant

Install Ollama and pull `qwen2.5:3b`, then run the Python service in another terminal using [../python-service/README.md](../python-service/README.md). Set `PYTHON_AI_URL=http://127.0.0.1:8001` in `.env`. The backend sends the user's selected language, recent chat turns, and a limited set of place/event records to Python. If Python is unavailable, Node returns a limited data-backed fallback. If Ollama is unavailable, Python clearly labels its rule-based fallback.

## Frontend

Run the frontend from `../travelmate-frontend` in a separate terminal. See the root README for the full startup order.

## Data and safety

The backend seeds example Mysuru places and events when those collections are empty. External live-place/event APIs are optional. Never commit `.env`, passwords, JWT secrets, API keys, or user data to GitHub.
