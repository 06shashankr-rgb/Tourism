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

## Website-wide Google Cloud Translation

The React frontend now sends untranslated visible page text, button labels, headings, placeholders, and accessibility labels to the backend in batches when a visitor changes the language. Existing prepared Kannada, Hindi, Tamil, and Telugu translations are used immediately; other selected languages use Google Cloud Translation when configured. Newly rendered UI text is translated as the visitor navigates and interacts with the site.

The backend exposes `POST /api/translate` and accepts batches:

```json
{
  "texts": ["Welcome to Mysuru", "Explore nearby places"],
  "targetLanguage": "kn"
}
```

The response contains a `translations` array in the same order. Batches are limited to 80 text strings and 30,000 total characters. The frontend sends smaller batches to keep requests manageable. Supported language availability depends on Google Cloud Translation for the requested language code; a dropdown option does not guarantee that Google's provider supports it.

### Enable it locally

1. Enable the Cloud Translation API in your Google Cloud project and configure billing and API permissions.
2. Copy `.env.example` to `.env` and set `GCP_PROJECT_ID`.
3. Configure Google Application Default Credentials. For local development, set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account JSON key stored outside this repository. In production, use the hosting platform's workload identity where possible.
4. Run `npm install` and restart the backend.
5. Start the frontend and select a language. If the translation service is unavailable, the frontend keeps the prepared dictionary translations and leaves unmatched text in its original language.

Google Cloud Translation can incur charges based on the amount of text translated. Avoid committing service-account JSON keys, `.env` files, API secrets, or user data. The website caches translated strings in the current browser session to avoid repeatedly translating identical text.

## Optional Python assistant

Install Ollama and pull `qwen2.5:3b`, then run the Python service in another terminal using [../python-service/README.md](../python-service/README.md). Set `PYTHON_AI_URL=http://127.0.0.1:8001` in `.env`. The backend sends the user's selected language, recent chat turns, and a limited set of place/event records to Python. If Python is unavailable, Node returns a limited data-backed fallback. If Ollama is unavailable, Python clearly labels its rule-based fallback.

## Frontend

Run the frontend from `../travelmate-frontend` in a separate terminal. See the root README for the full startup order.

## Data and safety

The backend seeds example Mysuru places and events when those collections are empty. External live-place/event APIs are optional. Never commit `.env`, passwords, JWT secrets, API keys, or user data to GitHub.
