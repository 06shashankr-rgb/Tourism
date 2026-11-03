import "dotenv/config";
import express from "express";import cors from "cors";import bcrypt from "bcryptjs";import jwt from "jsonwebtoken";
import {connectDatabase,closeDatabase,collection,isMongo,memoryStore} from "./db.js";import {distanceKm,makeId,safeUser} from "./utils.js";import {requireAuth} from "./middleware/auth.js";import {livePlacesConfigured,liveEventsConfigured,searchLivePlaces,searchLiveEvents} from "./liveData.js";
const app=express(),PORT=Number(process.env.PORT||5000),FRONTEND_URL=process.env.FRONTEND_URL||"http://localhost:5173",JWT_SECRET=process.env.JWT_SECRET||"travelmate-local-development-secret";
const allowedOrigins=FRONTEND_URL.split(",").map(x=>x.trim()).filter(Boolean);
app.use(cors({origin:(origin,callback)=>{if(!origin||allowedOrigins.includes(origin))return callback(null,true);return callback(new Error("CORS origin not allowed."));},methods:["GET","POST","DELETE","OPTIONS"],allowedHeaders:["Content-Type","Authorization"]}));app.use(express.json({limit:"1mb"}));
function data(n){return isMongo()?collection(n):memoryStore()[n]} async function findOne(n,f){const c=data(n);if(isMongo())return c.findOne(f);return c.find(x=>Object.entries(f).every(([k,v])=>x[k]===v))||null} async function findMany(n,f={}){const c=data(n);if(isMongo())return c.find(f).toArray();return c.filter(x=>Object.entries(f).every(([k,v])=>x[k]===v))} async function insertOne(n,v){const c=data(n);if(isMongo()){const r=await c.insertOne(v);return {...v,_id:r.insertedId}}c.push(v);return v} async function deleteOne(n,f){const c=data(n);if(isMongo())return c.deleteOne(f);const i=c.findIndex(x=>Object.entries(f).every(([k,v])=>x[k]===v));if(i>=0)c.splice(i,1);return{deletedCount:i>=0?1:0}}
function token(u){return jwt.sign({id:u.id,name:u.name,email:u.email},JWT_SECRET,{expiresIn:"7d"})}
function eventIsLive(e,now=new Date()){
  if(!e.startAt||!e.endAt)return false;
  const start=new Date(e.startAt),end=new Date(e.endAt);
  return Number.isFinite(start.getTime())&&Number.isFinite(end.getTime())&&start<=now&&now<=end;
}
async function geocodeLocation(query){
  const url="https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q="+encodeURIComponent(query);
  const response=await fetch(url,{headers:{"User-Agent":"TravelMate/1.0"}});
  if(!response.ok)throw new Error("Location search service unavailable.");
  const rows=await response.json();
  return rows.map(x=>({label:x.display_name,lat:Number(x.lat),lng:Number(x.lon),type:x.type}));
}

app.get("/api/health",(_q,r)=>r.json({ok:true,service:"TravelMate API",database:isMongo()?"mongodb":"memory",translation:{provider:process.env.PYTHON_AI_URL?"Local IndicTrans2 + prepared dictionaries":"Prepared dictionaries only",configured:Boolean(process.env.PYTHON_AI_URL),paidCloud:false,localLanguages:16,preparedLanguages:5},liveData:{places:livePlacesConfigured(),events:liveEventsConfigured()}}));
app.post("/api/auth/signup",async(q,r)=>{try{const name=String(q.body.name||"").trim(),email=String(q.body.email||"").trim().toLowerCase(),password=String(q.body.password||"");if(!name||!email||password.length<6)return r.status(400).json({message:"Name, email and a password of at least 6 characters are required."});if(await findOne("users",{email}))return r.status(409).json({message:"Email already registered."});const u={id:makeId("USER"),name,email,passwordHash:await bcrypt.hash(password,12),createdAt:new Date().toISOString()};await insertOne("users",u);r.status(201).json({token:token(u),user:safeUser(u)})}catch(e){console.error(e);r.status(500).json({message:"Could not create account."})}});
app.post("/api/auth/login",async(q,r)=>{try{const email=String(q.body.email||"").trim().toLowerCase(),password=String(q.body.password||""),u=await findOne("users",{email});if(!u||!(await bcrypt.compare(password,u.passwordHash)))return r.status(401).json({message:"Invalid email or password."});r.json({token:token(u),user:safeUser(u)})}catch(e){console.error(e);r.status(500).json({message:"Could not sign in."})}});
app.get("/api/auth/me",requireAuth,async(q,r)=>{const u=await findOne("users",{id:q.user.id});if(!u)return r.status(404).json({message:"User not found."});r.json({user:safeUser(u)})});
app.get("/api/location/search",async(q,r)=>{try{const query=String(q.query.q||"").trim();if(query.length<2)return r.status(400).json({message:"Enter at least 2 characters."});r.json(await geocodeLocation(query))}catch(e){console.error(e);r.status(503).json({message:e.message||"Location search failed."})}});
app.get("/api/places",async(q,r)=>{try{const lat=Number(q.query.lat),lng=Number(q.query.lng),radius=Number(q.query.radius||25),search=String(q.query.search||"").trim().toLowerCase(),category=String(q.query.category||"").trim().toLowerCase(),languageCode=String(q.query.languageCode||"en");if(Number.isFinite(lat)&&Number.isFinite(lng)&&livePlacesConfigured()&&!search&&!category){try{const live=await searchLivePlaces({lat,lng,radius,languageCode});if(live?.length)return r.json(live)}catch(e){console.error("Live places fallback:",e.message)}}let all=await findMany("places");if(search)all=all.filter(p=>String(p.name).toLowerCase().includes(search)||String(p.description).toLowerCase().includes(search));if(category)all=all.filter(p=>String(p.category).toLowerCase()===category);const out=Number.isFinite(lat)&&Number.isFinite(lng)?all.map(p=>({...p,distance:distanceKm(lat,lng,p.lat,p.lng)})).filter(p=>p.distance<=radius).sort((a,b)=>a.distance-b.distance):all;r.json(out)}catch(e){console.error(e);r.status(500).json({message:"Could not load places."})}});
app.get("/api/events",async(q,r)=>{try{const lat=Number(q.query.lat),lng=Number(q.query.lng),radius=Number(q.query.radius||25),search=String(q.query.search||"").trim(),live=String(q.query.live||"")==="true",locationLabel=String(q.query.locationLabel||"Mysuru"),language=String(q.query.language||"en");if(Number.isFinite(lat)&&Number.isFinite(lng)&&live&&liveEventsConfigured()){try{const current=await searchLiveEvents({lat,lng,locationLabel,language});return r.json((current||[]).filter(e=>{if(Number.isFinite(e.lat)&&Number.isFinite(e.lng)){e.distance=distanceKm(lat,lng,e.lat,e.lng);return e.distance<=radius}return true}).sort((a,b)=>(a.distance||0)-(b.distance||0)))}catch(e){console.error("Live events fallback:",e.message)}}let all=await findMany("events");if(search)all=all.filter(e=>String(e.name).toLowerCase().includes(search.toLowerCase())||String(e.venue).toLowerCase().includes(search.toLowerCase())||String(e.description).toLowerCase().includes(search.toLowerCase()));if(live)all=all.filter(e=>eventIsLive(e));const out=Number.isFinite(lat)&&Number.isFinite(lng)?all.map(e=>({...e,distance:distanceKm(lat,lng,e.lat,e.lng),isLive:eventIsLive(e)})).filter(e=>e.distance<=radius).sort((a,b)=>a.distance-b.distance):all.map(e=>({...e,isLive:eventIsLive(e)}));r.json(out)}catch(e){console.error(e);r.status(500).json({message:"Could not load events."})}});
app.get("/api/planner",requireAuth,async(q,r)=>r.json(await findMany("planner",{userId:q.user.id})));
app.post("/api/planner",requireAuth,async(q,r)=>{const {item,type}=q.body;if(!item?.id||!type)return r.status(400).json({message:"Item and type are required."});if(await findOne("planner",{userId:q.user.id,itemId:String(item.id),type}))return r.status(409).json({message:"Already in your planner."});const x={id:makeId("PLAN"),userId:q.user.id,itemId:String(item.id),type,item,createdAt:new Date().toISOString()};await insertOne("planner",x);r.status(201).json(x)});
app.delete("/api/planner/:type/:itemId",requireAuth,async(q,r)=>{const x=await deleteOne("planner",{userId:q.user.id,type:q.params.type,itemId:String(q.params.itemId)});if(!x.deletedCount)return r.status(404).json({message:"Planner item not found."});r.json({ok:true})});
app.get("/api/bookings",requireAuth,async(q,r)=>{const x=await findMany("bookings",{userId:q.user.id});r.json(x.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))))});
app.post("/api/bookings",requireAuth,async(q,r)=>{const b=q.body;if(!b.eventId||!b.eventName||!b.tickets||!b.email)return r.status(400).json({message:"Event, ticket count and contact email are required."});const x={id:makeId("BOOK"),userId:q.user.id,eventId:String(b.eventId),eventName:b.eventName,date:b.date,time:b.time,venue:b.venue,tickets:Number(b.tickets),total:Number(b.total||0),name:b.name,email:b.email,sourceUrl:b.sourceUrl,status:"confirmed",createdAt:new Date().toISOString()};await insertOne("bookings",x);r.status(201).json(x)});

// Google Cloud Translation API. Credentials are loaded through Application Default
// Credentials (GOOGLE_APPLICATION_CREDENTIALS locally, or the runtime identity in production).
// Google Cloud Translation supports single and batched website text translation.
// Free local IndicTrans2 translation proxy. No paid cloud API is used.
app.post("/api/translate", async (q, r) => {
  const texts = Array.isArray(q.body?.texts) ? q.body.texts : [];
  const target = String(q.body?.target || "").trim();
  const supportedTargets = new Set([
    "asm_Beng", "ben_Beng", "brx_Deva", "doi_Deva", "guj_Gujr",
    "hin_Deva", "kan_Knda", "mai_Deva", "mal_Mlym", "mni_Mtei",
    "mar_Deva", "npi_Deva", "ory_Orya", "pan_Guru", "san_Deva",
    "tam_Taml", "tel_Telu", "urd_Arab"
  ]);

  if (!texts.length || texts.length > 50 ||
      texts.some(value => typeof value !== "string" || !value.trim() || value.length > 1500)) {
    return r.status(400).json({ message: "Provide 1–50 non-empty text strings (maximum 1,500 characters each)." });
  }
  if (texts.reduce((total, value) => total + value.length, 0) > 30000) {
    return r.status(413).json({ message: "Translation batch is too large." });
  }
  if (target === "eng_Latn") {
    return r.json({ translations: texts, source: "eng_Latn", target, provider: "identity" });
  }
  if (!supportedTargets.has(target)) {
    return r.status(422).json({ message: "This target language is not supported by the configured local IndicTrans2 model." });
  }

  const pythonUrl = process.env.PYTHON_AI_URL?.trim();
  if (!pythonUrl) {
    return r.status(503).json({ message: "Local translation is not configured. Start the TravelMate Python service on port 8001." });
  }
  try {
    const response = await fetch(pythonUrl.replace(/\\/$/, "") + "/translate-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, source: "eng_Latn", target }),
      signal: AbortSignal.timeout(180000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return r.status(response.status || 503).json({ message: data.detail || "Local IndicTrans2 translation failed." });
    }
    if (!Array.isArray(data.translations) || data.translations.length !== texts.length ||
        data.translations.some(value => typeof value !== "string" || !value.trim())) {
      return r.status(502).json({ message: "Local translation returned an incomplete batch." });
    }
    return r.json({ ...data, provider: "IndicTrans2-local" });
  } catch (error) {
    console.error("Local IndicTrans2 translation error:", error.message);
    return r.status(503).json({ message: "Local translation service is unavailable. Check that Python is running and the IndicTrans2 model dependencies are installed." });
  }
});
app.use((_q,r)=>r.status(404).json({message:"API route not found."}));
await connectDatabase();const server=app.listen(PORT,()=>console.log(`TravelMate API running at http://localhost:${PORT}`));process.on("SIGINT",async()=>{await closeDatabase();server.close(()=>process.exit(0))});