import { MongoClient } from "mongodb";
import { seedPlaces, seedEvents } from "./data.js";
const memory={users:[],planner:[],bookings:[],places:[...seedPlaces],events:[...seedEvents]};
let client=null,database=null;
export async function connectDatabase(){const uri=process.env.MONGODB_URI?.trim();if(!uri){console.log("MongoDB URI not set. Using in-memory development storage.");return;}client=new MongoClient(uri);await client.connect();database=client.db(process.env.MONGODB_DB||"travelmate");if(await database.collection("places").countDocuments()===0)await database.collection("places").insertMany(seedPlaces);if(await database.collection("events").countDocuments()===0)await database.collection("events").insertMany(seedEvents);console.log("Connected to MongoDB.");}
export function isMongo(){return Boolean(database)} export function collection(name){return database?.collection(name)||null} export function memoryStore(){return memory}
export async function closeDatabase(){if(client)await client.close()}