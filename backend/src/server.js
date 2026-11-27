import "dotenv/config";
import express from "express";import cors from "cors";import bcrypt from "bcryptjs";import jwt from "jsonwebtoken";
import {connectDatabase,closeDatabase,collection,isMongo,memoryStore} from "./db.js";import {distanceKm,makeId,safeUser} from "./utils.js";import {requireAuth} from "./middleware/auth.js";import {translateTexts,SUPPORTED_TARGETS} from "./translate.js";import {livePlacesConfigured,liveEventsConfigured,searchLivePlaces,searchLiveEvents} from "./liveData.js";
const app=express(),PORT=Number(process.env.PORT||5000),FRONTEND_URL=process.env.FRONTEND_URL||"http://localhost:5173",JWT_SECRET=process.env.JWT_SECRET||"travelmate-local-development-secret";
const allowedOrigins=FRONTEND_URL.split(",").map(x=>x.trim()).filter(Boolean);
app.use(cors({origin:(origin,callback)=>{if(!origin||allowedOrigins.includes(origin))return callback(null,true);return callback(new Error("CORS origin not allowed."));},methods:["GET","POST","PUT","DELETE","OPTIONS"],allowedHeaders:["Content-Type","Authorization"]}));app.use(express.json({limit:"1mb"}));
function data(n){return isMongo()?collection(n):memoryStore()[n]} async function findOne(n,f){const c=data(n);if(isMongo())return c.findOne(f);return c.find(x=>Object.entries(f).every(([k,v])=>x[k]===v))||null} async function findMany(n,f={}){const c=data(n);if(isMongo())return c.find(f).toArray();return c.filter(x=>Object.entries(f).every(([k,v])=>x[k]===v))} async function insertOne(n,v){const c=data(n);if(isMongo()){const r=await c.insertOne(v);return {...v,_id:r.insertedId}}c.push(v);return v} async function deleteOne(n,f){const c=data(n);if(isMongo())return c.deleteOne(f);const i=c.findIndex(x=>Object.entries(f).every(([k,v])=>x[k]===v));if(i>=0)c.splice(i,1);return{deletedCount:i>=0?1:0}} async function updateOne(n,f,u){const c=data(n);if(isMongo()){const result=await c.updateOne(f,{$set:u});return result.matchedCount?c.findOne(f):null;}const item=c.find(x=>Object.entries(f).every(([k,v])=>x[k]===v));if(item)Object.assign(item,u);return item||null;}
function token(u){return jwt.sign({id:u.id,name:u.name,email:u.email},JWT_SECRET,{expiresIn:"7d"})}
function eventIsLive(e,now=new Date()){
  if(!e.startAt||!e.endAt)return false;
  const start=new Date(e.startAt),end=new Date(e.endAt);
  return Number.isFinite(start.getTime())&&Number.isFinite(end.getTime())&&start<=now&&now<=end;
}
async function geocodeReverse(lat,lng){
  const url="https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat="+encodeURIComponent(lat)+"&lon="+encodeURIComponent(lng)+"&zoom=16&addressdetails=1";
  const response=await fetch(url,{headers:{"User-Agent":"TravelMate/1.0"}});
  if(!response.ok)throw new Error("Reverse location service unavailable.");
  const data=await response.json();
  const a=data.address||{};
  const shortName=[a.suburb||a.neighbourhood||a.village||a.town||a.city||a.county,a.state].filter(Boolean).join(", ");
  return {label:data.display_name||shortName||"Current GPS location",shortName,lat:Number(lat),lng:Number(lng)};
}
async function geocodeLocation(query){
  const url="https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q="+encodeURIComponent(query);
  const response=await fetch(url,{headers:{"User-Agent":"TravelMate/1.0"}});
  if(!response.ok)throw new Error("Location search service unavailable.");
  const rows=await response.json();
  return rows.map(x=>({label:x.display_name,lat:Number(x.lat),lng:Number(x.lon),type:x.type}));
}

app.get("/api/health",(_q,r)=>r.json({ok:true,service:"TravelMate API",database:isMongo()?"mongodb":"memory",translation:{provider:"Local Ollama TranslateGemma + prepared dictionaries",configured:true,pythonService:process.env.PYTHON_AI_URL||"http://127.0.0.1:8001",paidCloud:false,localLanguages:22,preparedLanguages:5},assistant:{configured:true,pythonService:process.env.PYTHON_AI_URL||"http://127.0.0.1:8001",provider:"Local Python + Ollama with TravelMate place/event context"},liveData:{places:livePlacesConfigured(),events:liveEventsConfigured()}}));
app.post("/api/auth/signup",async(q,r)=>{try{const name=String(q.body.name||"").trim(),email=String(q.body.email||"").trim().toLowerCase(),password=String(q.body.password||"");if(!name||!email||password.length<6)return r.status(400).json({message:"Name, email and a password of at least 6 characters are required."});if(await findOne("users",{email}))return r.status(409).json({message:"Email already registered."});const u={id:makeId("USER"),name,email,passwordHash:await bcrypt.hash(password,12),createdAt:new Date().toISOString()};await insertOne("users",u);r.status(201).json({token:token(u),user:safeUser(u)})}catch(e){console.error(e);r.status(500).json({message:"Could not create account."})}});
app.post("/api/auth/login",async(q,r)=>{try{const email=String(q.body.email||"").trim().toLowerCase(),password=String(q.body.password||""),u=await findOne("users",{email});if(!u||!(await bcrypt.compare(password,u.passwordHash)))return r.status(401).json({message:"Invalid email or password."});r.json({token:token(u),user:safeUser(u)})}catch(e){console.error(e);r.status(500).json({message:"Could not sign in."})}});
app.get("/api/auth/me",requireAuth,async(q,r)=>{const u=await findOne("users",{id:q.user.id});if(!u)return r.status(404).json({message:"User not found."});r.json({user:safeUser(u)})});
app.get("/api/location/reverse",async(q,r)=>{try{const lat=Number(q.query.lat),lng=Number(q.query.lng);if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return r.status(400).json({message:"Valid GPS coordinates are required."});r.json(await geocodeReverse(lat,lng))}catch(e){console.error(e);r.status(503).json({message:e.message||"Could not resolve your GPS area."})}});
app.get("/api/location/search",async(q,r)=>{try{const query=String(q.query.q||"").trim();if(query.length<2)return r.status(400).json({message:"Enter at least 2 characters."});r.json(await geocodeLocation(query))}catch(e){console.error(e);r.status(503).json({message:e.message||"Location search failed."})}});
app.get("/api/places",async(q,r)=>{try{const lat=Number(q.query.lat),lng=Number(q.query.lng),radius=Number(q.query.radius||25),search=String(q.query.search||"").trim().toLowerCase(),category=String(q.query.category||"").trim().toLowerCase(),languageCode=String(q.query.languageCode||"en");if(Number.isFinite(lat)&&Number.isFinite(lng)&&livePlacesConfigured()&&!search&&!category){try{const live=await searchLivePlaces({lat,lng,radius,languageCode});if(live?.length){const curated=await findMany("places");const names=new Set(curated.map(p=>String(p.name).toLowerCase()));const merged=[...curated,...live.filter(p=>!names.has(String(p.name).toLowerCase()))];return r.json(merged.map(p=>({...p,distance:distanceKm(lat,lng,p.lat,p.lng)})).filter(p=>Number.isFinite(p.distance)&&p.distance<=radius).sort((a,b)=>a.distance-b.distance))}}catch(e){console.error("Live places fallback:",e.message)}}let all=await findMany("places");if(search)all=all.filter(p=>String(p.name).toLowerCase().includes(search)||String(p.description).toLowerCase().includes(search));if(category)all=all.filter(p=>String(p.category).toLowerCase()===category);const out=Number.isFinite(lat)&&Number.isFinite(lng)?all.map(p=>({...p,distance:distanceKm(lat,lng,p.lat,p.lng)})).filter(p=>p.distance<=radius).sort((a,b)=>a.distance-b.distance):all;r.json(out)}catch(e){console.error(e);r.status(500).json({message:"Could not load places."})}});
app.get("/api/events",async(q,r)=>{try{const lat=Number(q.query.lat),lng=Number(q.query.lng),radius=Number(q.query.radius||10),search=String(q.query.search||"").trim(),live=String(q.query.live||"")==="true",locationLabel=String(q.query.locationLabel||"Mysuru"),language=String(q.query.language||"en");if(Number.isFinite(lat)&&Number.isFinite(lng)&&live&&liveEventsConfigured()){try{const current=await searchLiveEvents({lat,lng,locationLabel,language});return r.json((current||[]).filter(e=>{if(Number.isFinite(e.lat)&&Number.isFinite(e.lng)){e.distance=distanceKm(lat,lng,e.lat,e.lng);return e.distance<=radius}return true}).sort((a,b)=>(a.distance||0)-(b.distance||0)))}catch(e){console.error("Live events fallback:",e.message)}}let all=await findMany("events");if(search)all=all.filter(e=>String(e.name).toLowerCase().includes(search.toLowerCase())||String(e.venue).toLowerCase().includes(search.toLowerCase())||String(e.description).toLowerCase().includes(search.toLowerCase()));if(live)all=all.filter(e=>eventIsLive(e));const out=Number.isFinite(lat)&&Number.isFinite(lng)?all.map(e=>({...e,distance:distanceKm(lat,lng,e.lat,e.lng),isLive:eventIsLive(e)})).filter(e=>e.distance<=radius).sort((a,b)=>a.distance-b.distance):all.map(e=>({...e,isLive:eventIsLive(e)}));r.json(out)}catch(e){console.error(e);r.status(500).json({message:"Could not load events."})}});

app.get("/api/personalization",requireAuth,async(q,r)=>{
  const preferences=await findOne("userPreferences",{userId:q.user.id});
  const favorites=await findMany("favorites",{userId:q.user.id});
  const feedback=await findMany("feedback",{userId:q.user.id});
  r.json({preferences:preferences?.interests||[],favorites,feedback});
});
app.put("/api/personalization/preferences",requireAuth,async(q,r)=>{
  const allowed=["Heritage","Nature","Adventure","Food","Culture","Spiritual","Wildlife","Shopping","Family"];
  const interests=Array.isArray(q.body?.interests)?[...new Set(q.body.interests.map(x=>String(x)))].filter(x=>allowed.includes(x)).slice(0,allowed.length):[];
  const existing=await findOne("userPreferences",{userId:q.user.id});
  const value={userId:q.user.id,interests,updatedAt:new Date().toISOString()};
  if(existing)await updateOne("userPreferences",{userId:q.user.id},value);else await insertOne("userPreferences",value);
  r.json({interests});
});
app.get("/api/personalization/history",requireAuth,async(q,r)=>{const history=await findMany("recommendationHistory",{userId:q.user.id});r.json(history.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,30))});
app.get("/api/personalization/favorites",requireAuth,async(q,r)=>r.json(await findMany("favorites",{userId:q.user.id})));
app.post("/api/personalization/favorites",requireAuth,async(q,r)=>{
  const place=q.body?.place;
  if(!place?.id||!place?.name)return r.status(400).json({message:"A valid place is required."});
  const filter={userId:q.user.id,placeId:String(place.id)};
  const existing=await findOne("favorites",filter);
  if(existing)return r.status(200).json(existing);
  const saved={id:makeId("FAV"),...filter,place:{id:String(place.id),name:String(place.name),category:String(place.category||""),description:String(place.description||""),lat:Number(place.lat),lng:Number(place.lng)},createdAt:new Date().toISOString()};
  await insertOne("favorites",saved);r.status(201).json(saved);
});
app.delete("/api/personalization/favorites/:placeId",requireAuth,async(q,r)=>{
  const result=await deleteOne("favorites",{userId:q.user.id,placeId:String(q.params.placeId)});
  if(!result.deletedCount)return r.status(404).json({message:"Favourite not found."});
  r.json({ok:true});
});
app.post("/api/personalization/feedback",requireAuth,async(q,r)=>{
  const placeId=String(q.body?.placeId||"").trim(),rating=Number(q.body?.rating),comment=String(q.body?.comment||"").trim().slice(0,1000);
  if(!placeId||!Number.isInteger(rating)||rating<1||rating>5)return r.status(400).json({message:"Choose a place and a rating from 1 to 5."});
  const place=await findOne("places",{id:placeId});
  const favorite=await findOne("favorites",{userId:q.user.id,placeId});
  const value={id:makeId("FDB"),userId:q.user.id,placeId,placeName:String(q.body?.placeName||place?.name||"Place").slice(0,120),rating,comment,createdAt:new Date().toISOString()};
  await insertOne("feedback",value);r.status(201).json(value);
});
app.get("/api/personalization/recommendations",requireAuth,async(q,r)=>{
  const [pref,favorites,feedback,planner,allPlaces]=await Promise.all([
    findOne("userPreferences",{userId:q.user.id}),findMany("favorites",{userId:q.user.id}),
    findMany("feedback",{userId:q.user.id}),findMany("planner",{userId:q.user.id}),findMany("places")
  ]);
  const interests=pref?.interests||[],favoriteIds=new Set(favorites.map(x=>x.placeId));
  const rated=new Map(feedback.map(x=>[x.placeId,x.rating]));
  const visited=new Set(planner.filter(x=>x.type==="place").map(x=>x.itemId));
  const keywordMap={Heritage:["heritage","palace","historical","architecture","fort"],Nature:["nature","park","lake","garden","hill"],Adventure:["adventure","activity","amusement","trek"],Food:["food","market","restaurant","cafe"],Culture:["culture","museum","art","festival","craft"],Spiritual:["temple","church","cathedral","spiritual"],Wildlife:["wildlife","zoo","bird","animal"],Shopping:["market","shopping","bazaar"],Family:["family","park","zoo","amusement"]};
  const recommendations=allPlaces.map(place=>{
    const text=[place.name,place.category,place.description].join(" ").toLowerCase();
    const matched=interests.filter(interest=>(keywordMap[interest]||[interest.toLowerCase()]).some(word=>text.includes(word)));
    const rating=rated.get(String(place.id));
    let score=matched.length*4+(favoriteIds.has(String(place.id))?2:0)+(rating>=4?3:rating<=2?-2:0)-(visited.has(String(place.id))?5:0);
    if(!interests.length&&rating==null)score=Number(place.rating||0);
    return {...place,recommendationScore:score,reasons:matched.length?matched:["Popular nearby destination"],userRating:rating||null};
  }).filter(x=>!visited.has(String(x.id))).sort((a,b)=>b.recommendationScore-a.recommendationScore).slice(0,8);
  const now=new Date().toISOString();
  if(recommendations.length)await Promise.all(recommendations.map(place=>insertOne("recommendationHistory",{id:makeId("REC"),userId:q.user.id,placeId:String(place.id),placeName:place.name,score:place.recommendationScore,createdAt:now})));
  r.json({recommendations,interests,favoriteCount:favorites.length,feedbackCount:feedback.length});
});

app.get("/api/planner",requireAuth,async(q,r)=>r.json(await findMany("planner",{userId:q.user.id})));
app.post("/api/planner",requireAuth,async(q,r)=>{const {item,type}=q.body;if(!item?.id||!type)return r.status(400).json({message:"Item and type are required."});if(await findOne("planner",{userId:q.user.id,itemId:String(item.id),type}))return r.status(409).json({message:"Already in your planner."});const x={id:makeId("PLAN"),userId:q.user.id,itemId:String(item.id),type,item,createdAt:new Date().toISOString()};await insertOne("planner",x);r.status(201).json(x)});
app.delete("/api/planner/:type/:itemId",requireAuth,async(q,r)=>{const x=await deleteOne("planner",{userId:q.user.id,type:q.params.type,itemId:String(q.params.itemId)});if(!x.deletedCount)return r.status(404).json({message:"Planner item not found."});r.json({ok:true})});
app.get("/api/rides",requireAuth,async(q,r)=>{const x=await findMany("rideRequests",{userId:q.user.id});r.json(x.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))))});
app.delete("/api/rides/:id",requireAuth,async(q,r)=>{try{const filter={id:q.params.id,userId:q.user.id};const ride=await findOne("rideRequests",filter);if(!ride)return r.status(404).json({message:"Ride request not found."});if(ride.status!=="cancelled")await updateOne("rideRequests",filter,{status:"cancelled",cancelledAt:new Date().toISOString()});await deleteOne("rideRequests",filter);r.json({ok:true,removed:true})}catch(e){console.error(e);r.status(500).json({message:"Could not cancel and remove ride request."})}});
app.delete("/api/rides/:id/remove",requireAuth,async(q,r)=>{try{const result=await deleteOne("rideRequests",{id:q.params.id,userId:q.user.id,status:"cancelled"});if(!result.deletedCount)return r.status(404).json({message:"Cancelled ride request not found."});r.json({ok:true})}catch(e){console.error(e);r.status(500).json({message:"Could not remove cancelled ride request."})}});
app.post("/api/rides",requireAuth,async(q,r)=>{const b=q.body||{},pickup=b.pickup||{},drop=b.drop||{};if(!Number.isFinite(Number(pickup.lat))||!Number.isFinite(Number(pickup.lng))||!Number.isFinite(Number(drop.lat))||!Number.isFinite(Number(drop.lng))||!["auto","taxi","bike"].includes(b.rideType))return r.status(400).json({message:"Valid pickup, destination and ride type are required."});const x={id:makeId("RIDE"),userId:q.user.id,pickup,drop,rideType:b.rideType,distanceKm:Number(b.distanceKm)||null,estimatedFare:Number.isFinite(Number(b.estimatedFare))?Number(b.estimatedFare):null,currency:"INR",status:"request_received",driverAssigned:false,createdAt:new Date().toISOString()};await insertOne("rideRequests",x);r.status(201).json(x)});
app.get("/api/bookings",requireAuth,async(q,r)=>{const x=await findMany("bookings",{userId:q.user.id});r.json(x.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))))});
app.post("/api/bookings",requireAuth,async(q,r)=>{const b=q.body;if(!b.eventId||!b.eventName||!b.tickets||!b.email)return r.status(400).json({message:"Event, ticket count and contact email are required."});const x={id:makeId("BOOK"),userId:q.user.id,eventId:String(b.eventId),eventName:b.eventName,date:b.date,time:b.time,venue:b.venue,tickets:Number(b.tickets),total:Number(b.total||0),name:b.name,email:b.email,sourceUrl:b.sourceUrl,status:"request_received",createdAt:new Date().toISOString()};await insertOne("bookings",x);r.status(201).json(x)});
app.delete("/api/bookings/:id/remove",requireAuth,async(q,r)=>{try{const result=await deleteOne("bookings",{id:q.params.id,userId:q.user.id,status:"cancelled"});if(!result.deletedCount)return r.status(404).json({message:"Cancelled booking not found."});r.json({ok:true})}catch(e){console.error(e);r.status(500).json({message:"Could not remove cancelled booking."})}});
app.delete("/api/bookings/:id",requireAuth,async(q,r)=>{try{const filter={id:q.params.id,userId:q.user.id};const existing=await findOne("bookings",filter);if(!existing)return r.status(404).json({message:"Booking not found."});if(existing.status!=="cancelled")await updateOne("bookings",filter,{status:"cancelled",cancelledAt:new Date().toISOString()});await deleteOne("bookings",filter);r.json({ok:true,removed:true})}catch(e){console.error(e);r.status(500).json({message:"Could not cancel and remove booking."})}});

// Hybrid AI assistant: combines the local Python/Ollama model with TravelMate data.
app.post("/api/assistant", async (q, r) => {
  const question = String(q.body?.question || "").trim();
  if (!question) return r.status(400).json({ message: "Question is required." });
  if (question.length > 2000) return r.status(413).json({ message: "Question is too long." });

  const lat = Number(q.body?.lat);
  const lng = Number(q.body?.lng);
  const location = String(q.body?.location || "Mysuru").slice(0, 120);
  const language = String(q.body?.language || "English").slice(0, 40);
  const history = Array.isArray(q.body?.history)
    ? q.body.history.slice(-8).map(item => ({
        role: item?.role,
        content: String(item?.content || "").slice(0, 2000)
      })).filter(item => ["user", "assistant"].includes(item.role) && item.content)
    : [];

  let places = [];
  let events = [];
  try {
    const allPlaces = await findMany("places");
    places = allPlaces.map(place => ({
      ...place,
      distance: Number.isFinite(lat) && Number.isFinite(lng)
        ? distanceKm(lat, lng, Number(place.lat), Number(place.lng))
        : undefined
    })).sort((a, b) => (a.distance ?? 999999) - (b.distance ?? 999999))
      .slice(0, 10)
      .map(({ id, name, category, description, distance, lat: placeLat, lng: placeLng, rating, price }) => ({
        id, name, category, description, distance, lat: placeLat, lng: placeLng, rating, price
      }));

    const allEvents = await findMany("events");
    events = allEvents.map(event => ({
      ...event,
      distance: Number.isFinite(lat) && Number.isFinite(lng)
        ? distanceKm(lat, lng, Number(event.lat), Number(event.lng))
        : undefined
    })).sort((a, b) => (a.distance ?? 999999) - (b.distance ?? 999999))
      .slice(0, 10)
      .map(({ id, name, venue, description, date, time, price, distance, sourceUrl, category }) => ({
        id, name, venue, description, date, time, price, distance, sourceUrl, category
      }));
  } catch (error) {
    console.warn("TravelMate assistant context could not be loaded:", error.message);
  }

  const hotels = [
    { name: "Hotel Mayura Hoysala", location: "Mysuru", type: "KSTDC premium", officialUrl: "https://kstdc.co/hotels/hotel-mayura-hoysala-mysuru/" },
    { name: "Hotel Mayura Valleyview", location: "Madikeri, Kodagu", type: "KSTDC premium", officialUrl: "https://kstdc.co/hotels/hotel-mayura-valley-view-madikeri/" },
    { name: "Hotel Mayura Riverview", location: "Srirangapatna, Mandya", type: "KSTDC premium", officialUrl: "https://kstdc.co/mayura-hotels/" },
    { name: "Hotel Mayura Kauvery", location: "KRS / Brindavan Gardens", type: "KSTDC budget", officialUrl: "https://kstdc.co/mayura-hotels/" },
    { name: "Hotel Mayura Talakavery", location: "Bhagamandala, Kodagu", type: "KSTDC budget", officialUrl: "https://kstdc.co/mayura-hotels/" }
  ];
  const context = {
    places,
    events,
    hotels,
    notes: "Use only these records for claims about TravelMate data. Do not invent hotel availability, room rates, opening hours, ticket availability or booking confirmations. Refer users to the official hotel URL for current rates and availability."
  };
  const pythonUrl = (process.env.PYTHON_AI_URL || "http://127.0.0.1:8001").trim();
  if (pythonUrl) {
    try {
      const response = await fetch(pythonUrl.replace(/\/$/, "") + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, location, language, context, history }),
        signal: AbortSignal.timeout(130000)
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.reply) {
        return r.json({
          answer: data.reply,
          provider: data.provider || "python-local",
          warning: data.warning || undefined,
          items: places.slice(0, 4)
        });
      }
      console.warn("Python assistant returned an error:", data.detail || response.status);
    } catch (error) {
      console.warn("Python assistant unavailable; using data fallback:", error.message);
    }
  }

  const lower = question.toLowerCase();
  if (/(event|festival|concert|show)/.test(lower)) {
    const answer = events.length
      ? "TravelMate event records: " + events.slice(0, 5).map(event =>
          event.name + " at " + (event.venue || "venue not listed") +
          (event.date ? " (" + event.date + ")" : "")
        ).join("; ") + ". Please confirm current dates and ticket information with the organiser."
      : "I could not find event records in TravelMate's current data for " + location + ".";
    return r.json({ answer, provider: "travelmate-data-fallback", items: events.slice(0, 4) });
  }
  if (/(place|near|visit|tourist|attraction|sightseeing)/.test(lower)) {
    const answer = places.length
      ? "Places in TravelMate's current data: " + places.slice(0, 5).map(place =>
          place.name + (Number.isFinite(place.distance) ? " (" + place.distance.toFixed(1) + " km)" : "")
        ).join(", ") + ". Check official sources for current opening hours."
      : "No matching place records are available in TravelMate's current data.";
    return r.json({ answer, provider: "travelmate-data-fallback", items: places.slice(0, 4) });
  }
  return r.json({
    answer: "I can help plan trips, find places and explore events in " + location +
      ". The local AI service is not connected right now. Start the Python service and Ollama for natural conversations.",
    provider: "travelmate-data-fallback",
    items: places.slice(0, 4)
  });
});

// Free local Ollama TranslateGemma translation proxy. No paid cloud API is used.
app.post("/api/translate", async (q, r) => {
  const texts = Array.isArray(q.body?.texts) ? q.body.texts : [];
  const target = String(q.body?.target || "").trim();
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
  if (!SUPPORTED_TARGETS[target]) {
    return r.status(422).json({ message: "This target language is not supported." });
  }

  try {
    const { translations, providers } = await translateTexts(texts, target);
    if (translations.every(value => value === null)) {
      return r.status(503).json({ message: "No translation provider is available. Check your internet connection, or start the Python service and Ollama for offline translation." });
    }
    return r.json({ translations, source: "eng_Latn", target, provider: providers.join("+") });
  } catch (error) {
    console.error("Translation error:", error.message);
    return r.status(503).json({ message: "Translation failed." });
  }
});
app.use((_q,r)=>r.status(404).json({message:"API route not found."}));
await connectDatabase();const server=app.listen(PORT,()=>console.log(`TravelMate API running at http://localhost:${PORT}`));process.on("SIGINT",async()=>{await closeDatabase();server.close(()=>process.exit(0))});