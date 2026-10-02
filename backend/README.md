# TravelMate Backend

Express + MongoDB backend for the Smart Tourism Management System.

## Features

- JWT authentication
- bcrypt password hashing
- Places and nearby-distance search
- Events and booking links
- User bookings
- User trip planner
- Rule-based AI travel assistant
- MongoDB Atlas support
- In-memory development fallback when MONGODB_URI is empty

## Run

1. Copy .env.example to .env.
2. Set JWT_SECRET.
3. Optionally set MONGODB_URI for persistent MongoDB storage.
4. Run npm install.
5. Run npm run dev.

The API runs on http://localhost:5000 by default.

## Main endpoints

GET  /api/health
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
GET  /api/places
GET  /api/events
GET  /api/planner
POST /api/planner
DELETE /api/planner/:type/:itemId
GET  /api/bookings
POST /api/bookings
POST /api/assistant
