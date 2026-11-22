import { MongoClient } from "mongodb";
import { seedPlaces, seedEvents } from "./data.js";
const memory={users:[],planner:[],bookings:[],rideRequests:[],places:[...seedPlaces],events:[...seedEvents]};
let client=null,database=null;
export async function connectDatabase(){const uri=process.env.MONGODB_URI?.trim();if(!uri){console.log("MongoDB URI not set. Using in-memory development storage.");return;}client=new MongoClient(uri);await client.connect();database=client.db(process.env.MONGODB_DB||"travelmate");if(seedPlaces.length)await database.collection("places").bulkWrite(seedPlaces.map(place=>({updateOne:{filter:{id:place.id},update:{$set:place},upsert:true}})));if(seedEvents.length)await database.collection("events").bulkWrite(seedEvents.map(event=>({updateOne:{filter:{id:event.id},update:{$set:event},upsert:true}})));console.log("Connected to MongoDB; Mysuru place and event seed records are synchronized.");}
export function isMongo(){return Boolean(database)} export function collection(name){return database?.collection(name)||null} export function memoryStore(){return memory}
export async function closeDatabase(){if(client)await client.close()}