import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDatabase, closeDatabase, collection, isMongo, memoryStore } from "./db.js";
import { distanceKm, makeId, safeUser } from "./utils.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "1mb" }));

function data(name) {
  return isMongo() ? collection(name) : memoryStore()[name];
}

async function findOne(name, filter) {
  const c = data(name);
  if (isMongo()) return c.findOne(filter);
  return c.find(item => Object.entries(filter).every(([k, v]) => item[k] === v)) || null;
}

async function findMany(name, filter = {}) {
  const c = data(name);
  if (isMongo()) return c.find(filter).toArray();
  return c.filter(item => Object.entries(filter).every(([k, v]) => item[k] === v));
}

async function insertOne(name, value) {
  const c = data(name);
  if (isMongo()) {
    const result = await c.insertOne(value);
    return { ...value, _id: result.insertedId };
  }
  c.push(value);
  return value;
}

async function deleteOne(name, filter) {
  const c = data(name);
  if (isMongo()) return c.deleteOne(filter);
  const index = c.findIndex(item => Object.entries(filter).every(([k, v]) => item[k] === v));
  if (index >= 0) c.splice(index, 1);
  return { deletedCount: index >= 0 ? 1 : 0 };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "TravelMate API", database: isMongo() ? "mongodb" : "memory" });
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || password.length < 6) {
      return res.status(400).json({ message: "Name, email and a password of at least 6 characters are required." });
    }

    if (await findOne("users", { email })) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const user = {
      id: makeId("USER"),
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      createdAt: new Date().toISOString()
    };

    await insertOne("users", user);
    res.status(201).json({ token: signToken(user), user: safeUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await findOne("users", { email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json({ token: signToken(user), user: safeUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not sign in." });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await findOne("users", { id: req.user.id });
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ user: safeUser(user) });
});

app.get("/api/places", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 200);

    const all = await findMany("places");
    const result = Number.isFinite(lat) && Number.isFinite(lng)
      ? all.map(p => ({ ...p, distance: distanceKm(lat, lng, p.lat, p.lng) }))
          .filter(p => p.distance <= radius)
          .sort((a, b) => a.distance - b.distance)
      : all;

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load places." });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 200);
    const all = await findMany("events");

    const result = Number.isFinite(lat) && Number.isFinite(lng)
      ? all.map(e => ({ ...e, distance: distanceKm(lat, lng, e.lat, e.lng) }))
          .filter(e => e.distance <= radius)
          .sort((a, b) => a.distance - b.distance)
      : all;

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load events." });
  }
});

app.get("/api/planner", requireAuth, async (req, res) => {
  const items = await findMany("planner", { userId: req.user.id });
  res.json(items);
});

app.post("/api/planner", requireAuth, async (req, res) => {
  const { item, type } = req.body;
  if (!item?.id || !type) return res.status(400).json({ message: "Item and type are required." });

  const exists = await findOne("planner", { userId: req.user.id, itemId: String(item.id), type });
  if (exists) return res.status(409).json({ message: "Already in your planner." });

  const saved = {
    id: makeId("PLAN"),
    userId: req.user.id,
    itemId: String(item.id),
    type,
    item,
    createdAt: new Date().toISOString()
  };

  await insertOne("planner", saved);
  res.status(201).json(saved);
});

app.delete("/api/planner/:type/:itemId", requireAuth, async (req, res) => {
  const result = await deleteOne("planner", {
    userId: req.user.id,
    type: req.params.type,
    itemId: String(req.params.itemId)
  });
  if (!result.deletedCount) return res.status(404).json({ message: "Planner item not found." });
  res.json({ ok: true });
});

app.get("/api/bookings", requireAuth, async (req, res) => {
  const items = await findMany("bookings", { userId: req.user.id });
  res.json(items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
});

app.post("/api/bookings", requireAuth, async (req, res) => {
  const { eventId, eventName, date, time, venue, tickets, total, name, email, sourceUrl } = req.body;
  if (!eventId || !eventName || !tickets || !email) {
    return res.status(400).json({ message: "Event, ticket count and contact email are required." });
  }

  const booking = {
    id: makeId("BOOK"),
    userId: req.user.id,
    eventId: String(eventId),
    eventName,
    date,
    time,
    venue,
    tickets: Number(tickets),
    total: Number(total || 0),
    name,
    email,
    sourceUrl,
    status: "confirmed",
    createdAt: new Date().toISOString()
  };

  await insertOne("bookings", booking);
  res.status(201).json(booking);
});

app.post("/api/assistant", async (req, res) => {
  try {
    const question = String(req.body.question || "").trim().toLowerCase();
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);

    if (!question) return res.status(400).json({ message: "Question is required." });

    if (question.includes("place") || question.includes("near") || question.includes("visit")) {
      const places = await findMany("places");
      const ranked = Number.isFinite(lat) && Number.isFinite(lng)
        ? places.map(p => ({ ...p, distance: distanceKm(lat, lng, p.lat, p.lng) })).sort((a, b) => a.distance - b.distance)
        : places;
      const top = ranked.slice(0, 3);
      return res.json({
        answer: top.map(p => `${p.name}${p.distance !== undefined ? ` (${p.distance.toFixed(1)} km)` : ""}`).join(", ") + "."
      });
    }

    if (question.includes("event")) {
      const events = await findMany("events");
      return res.json({ answer: events.slice(0, 3).map(e => `${e.name} at ${e.venue}`).join("; ") + "." });
    }

    if (question.includes("book")) {
      return res.json({ answer: "Open Events, select an event, sign in, choose tickets, and confirm the booking. External live-event links are also provided." });
    }

    if (question.includes("plan") || question.includes("itinerary")) {
      return res.json({ answer: "Open Places, add destinations to Planner, then open Planner to review your saved itinerary and bookings." });
    }

    res.json({ answer: "I can help with nearby tourist places, local events, bookings and trip planning. Try asking about places near you or nearby events." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "AI assistant is temporarily unavailable." });
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: "API route not found." });
});

await connectDatabase();

const server = app.listen(PORT, () => {
  console.log(`TravelMate API running at http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  await closeDatabase();
  server.close(() => process.exit(0));
});
