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
app.post("/api/translate",async(q,r)=>{
  const requested=Array.isArray(q.body?.texts)?q.body.texts:[q.body?.text];
  const texts=requested.map(value=>typeof value==="string"?value.trim():"");
  const targetLanguage=typeof q.body?.targetLanguage==="string"?q.body.targetLanguage.trim():"";
  if(!texts.length||texts.length>50||texts.some(text=>!text)||!targetLanguage)
    return r.status(400).json({error:"Provide 1–50 non-empty texts and a targetLanguage."});
  if(texts.some(text=>text.length>1500)||texts.reduce((sum,text)=>sum+text.length,0)>30000)
    return r.status(413).json({error:"Translation batch is too large."});
  const indicCodes={"as":"asm_Beng","bn":"ben_Beng","gu":"guj_Gujr","hi":"hin_Deva","kn":"kan_Knda","ml":"mal_Mlym","mr":"mar_Deva","mai":"mai_Deva","mni-Mtei":"mni_Mtei","ne":"npi_Deva","or":"ory_Orya","pa":"pan_Guru","sa":"san_Deva","ta":"tam_Taml","te":"tel_Telu","ur":"urd_Arab"};
  if(targetLanguage==="en")return r.json({success:true,targetLanguage,translations:texts,provider:"identity"});
  if(!indicCodes[targetLanguage])
    return r.status(422).json({error:"This language is not supported by the free local IndicTrans2 model. Prepared translations still work where available."});
  const pythonUrl=process.env.PYTHON_AI_URL?.trim();
  if(!pythonUrl)
    return r.status(503).json({error:"Local translation service is not configured. Start the TravelMate Python service on port 8001."});
  try{
    const pythonResponse=await fetch(pythonUrl.replace(/\/+$/, "")+"/translate-batch",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({texts,source:"eng_Latn",target:indicCodes[targetLanguage]}),
      signal:AbortSignal.timeout(120000)
    });
    const pythonData=await pythonResponse.json().catch(()=>({}));
    if(!pythonResponse.ok)
      return r.status(pythonResponse.status||503).json({error:pythonData.detail||"Local IndicTrans2 translation failed."});
    if(!Array.isArray(pythonData.translations)||pythonData.translations.length!==texts.length||pythonData.translations.some(value=>typeof value!=="string"||!value.trim()))
      return r.status(502).json({error:"Local translation returned an incomplete batch."});
    return r.json({success:true,targetLanguage,translations:pythonData.translations,provider:"IndicTrans2-local"});
  }catch(error){
    console.error("Local IndicTrans2 translation error:",error.message);
    return r.status(503).json({error:"Local translation service is unavailable. Check that Python is running and the IndicTrans2 model dependencies are installed."});
  }
});

app.post("/api/assistant",async(q,r)=>{
  const question=String(q.body.question||"").trim();
  const lat=Number(q.body.lat),lng=Number(q.body.lng);
  const location=String(q.body.location||"Mysuru").trim().slice(0,120);
  const language=String(q.body.language||"English").slice(0,40);
  const history=Array.isArray(q.body.history)?q.body.history.slice(-8).map(m=>({role:m.role,content:String(m.content||"").slice(0,2000)})).filter(m=>["user","assistant"].includes(m.role)&&m.content):[];
  if(!question)return r.status(400).json({message:"Question is required."});

  let places=[],events=[];
  try{
    const allPlaces=await findMany("places");
    places=allPlaces.map(p=>({...p,distance:Number.isFinite(lat)&&Number.isFinite(lng)?distanceKm(lat,lng,Number(p.lat),Number(p.lng)):undefined}))
      .sort((a,b)=>(a.distance??999999)-(b.distance??999999)).slice(0,8)
      .map(p=>({id:p.id,name:p.name,category:p.category,description:p.description,imageUrl:p.imageUrl,distance:p.distance,lat:p.lat,lng:p.lng}));
    const allEvents=await findMany("events");
    events=allEvents.map(e=>({...e,distance:Number.isFinite(lat)&&Number.isFinite(lng)?distanceKm(lat,lng,Number(e.lat),Number(e.lng)):undefined}))
      .sort((a,b)=>(a.distance??999999)-(b.distance??999999)).slice(0,8)
      .map(e=>({id:e.id,name:e.name,category:e.category,venue:e.venue,description:e.description,imageUrl:e.imageUrl,date:e.date,startAt:e.startAt,endAt:e.endAt,price:e.price,distance:e.distance,sourceUrl:e.sourceUrl}));
  }catch(error){console.warn("Could not build AI context from app data:",error.message)}

  const context={places,events,notes:"Only use these supplied records as TravelMate database facts. Distances are approximate when present."};
  const pythonUrl=process.env.PYTHON_AI_URL?.trim();
  if(pythonUrl){
    try{
      const response=await fetch(pythonUrl.replace(/\/$/,"")+"/chat",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:question,location,language,context,history}),
        signal:AbortSignal.timeout(95000)
      });
      const data=await response.json().catch(()=>({}));
      if(response.ok&&data.reply){const lower=question.toLowerCase();const eventIntent=["event","festival","concert","show","parade","programme"].some(word=>lower.includes(word));const placeIntent=["place","places","visit","tourist","attraction","nature","food","restaurant","temple","museum"].some(word=>lower.includes(word));const relevantItems=eventIntent&&!placeIntent?events.slice(0,4):placeIntent&&!eventIntent?places.slice(0,4):[...places.slice(0,2),...events.slice(0,2)];return r.json({answer:data.reply,provider:data.provider||"python-local",warning:data.warning||undefined,items:relevantItems});}
      console.warn("Python assistant returned a non-success response:",data.detail||response.status);
    }catch(error){console.warn("Python assistant unavailable; using app-data fallback:",error.message)}
  }

  const lower=question.toLowerCase();
  if(["event","festival","concert","show"].some(w=>lower.includes(w))){
    return r.json({answer:events.length?events.slice(0,4).map(e=>`${e.name} at ${e.venue||"venue not listed"}${e.date?" ("+e.date+")":""}`).join("; ")+". Confirm dates with the organiser.":"I couldn't find event records in TravelMate's current data.",provider:"travelmate-data",items:events.slice(0,4)});
  }
  if(["place","near","visit","tourist","attraction"].some(w=>lower.includes(w))){
    return r.json({answer:places.length?places.slice(0,4).map(p=>`${p.name}${Number.isFinite(p.distance)?` (${p.distance.toFixed(1)} km)`:""}`).join(", ")+". Check current opening hours before visiting.":"No matching place records are available in the current TravelMate data.",provider:"travelmate-data",items:places.slice(0,4)});
  }
  if(["plan","itinerary","trip"].some(w=>lower.includes(w))){
    return r.json({answer:`I can help plan a trip around ${location}. Tell me your trip length, budget, interests, and preferred pace. TravelMate currently has ${places.length} place records and ${events.length} event records available for suggestions.`,provider:"travelmate-data",items:[...places.slice(0,2),...events.slice(0,2)]});
  }
  return r.json({answer:`I can help with destinations, events, and itineraries for ${location}. For richer conversational AI, start the Python service and local Ollama model. I can currently reference ${places.length} places and ${events.length} events from TravelMate.`,provider:"travelmate-data",items:places.slice(0,4)});
});
app.use((_q,r)=>r.status(404).json({message:"API route not found."}));
await connectDatabase();const server=app.listen(PORT,()=>console.log(`TravelMate API running at http://localhost:${PORT}`));process.on("SIGINT",async()=>{await closeDatabase();server.close(()=>process.exit(0))});