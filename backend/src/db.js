import { MongoClient } from "mongodb";
import { seedPlaces, seedEvents } from "./data.js";

const memory = {
  users: [],
  planner: [],
  bookings: [],
  places: [...seedPlaces],
  events: [...seedEvents]
};

let client = null;
let database = null;

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.log("MongoDB URI not set. Using in-memory development storage.");
    return;
  }

  client = new MongoClient(uri);
  await client.connect();
  database = client.db(process.env.MONGODB_DB || "travelmate");
  console.log("Connected to MongoDB.");
  await seedMongo();
}

async function seedMongo() {
  const places = database.collection("places");
  const events = database.collection("events");

  if (await places.countDocuments() === 0) {
    await places.insertMany(seedPlaces);
  }
  if (await events.countDocuments() === 0) {
    await events.insertMany(seedEvents);
  }
}

export function isMongo() {
  return Boolean(database);
}

export function collection(name) {
  return database?.collection(name) ?? null;
}

export function memoryStore() {
  return memory;
}

export async function closeDatabase() {
  if (client) await client.close();
}