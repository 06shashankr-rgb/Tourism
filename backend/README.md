# TravelMate Backend

Express + MongoDB backend for the **AI-Powered Smart Tourism Management System with Location-Aware Recommendations and Multilingual Travel Assistance**.

## Features

- JWT authentication and bcrypt password hashing
- MongoDB persistence (with an in-memory fallback for demos)
- Nearby place search, events, booking records and user trip planner
- Node.js assistant fallback plus optional local Python assistant
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

## Optional Python assistant

Run the service in a second terminal using the instructions in [../python-service/README.md](../python-service/README.md). Set `PYTHON_AI_URL=http://127.0.0.1:8001` in `.env` to use it. If Python is not running, the Node.js assistant automatically falls back to its built-in tourism responses.

## Frontend

Run the frontend from `../travelmate-frontend` in a separate terminal. See the root README for the full startup order.

## Data and safety

The backend seeds example Mysuru places and events when those collections are empty. External live-place/event APIs are optional. Never commit `.env`, passwords, JWT secrets, API keys, or user data to GitHub.
