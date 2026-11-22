import React,{useEffect,useMemo,useState}from"react";
import{MapContainer,TileLayer,Marker,Polyline,Popup,useMap}from"react-leaflet";
import{api}from"./api";

const destinations=[
{name:"Mysuru Palace",lat:12.3052,lng:76.6552,address:"Mysuru Palace, Mysuru, Karnataka"},
{name:"Chamundi Hill",lat:12.2746,lng:76.6737,address:"Chamundi Hill, Mysuru, Karnataka"},
{name:"Mysuru Zoo",lat:12.3008,lng:76.6677,address:"Mysuru Zoo, Mysuru, Karnataka"},
{name:"St. Philomena's Cathedral",lat:12.3176,lng:76.6497,address:"St. Philomena's Cathedral, Mysuru, Karnataka"},
{name:"Srirangapatna",lat:12.4224,lng:76.6936,address:"Srirangapatna, Mandya, Karnataka"},
{name:"Ranganathittu Bird Sanctuary",lat:12.4245,lng:76.6570,address:"Ranganathittu Bird Sanctuary, Mandya, Karnataka"},
{name:"Brindavan Gardens (KRS)",lat:12.4244,lng:76.5722,address:"Brindavan Gardens, KRS, Karnataka"},
{name:"Nanjangud Temple",lat:12.1176,lng:76.6835,address:"Srikanteshwara Temple, Nanjangud, Karnataka"},
{name:"Talakadu",lat:12.1915,lng:77.0270,address:"Talakadu, Karnataka"},
{name:"Shivanasamudra Falls",lat:12.3010,lng:77.1700,address:"Shivanasamudra Falls, Karnataka"}
];
const modes=[{id:"car",label:"Car",icon:"🚗",profile:"driving"},{id:"bike",label:"Bike",icon:"🏍️",profile:"bike"},{id:"walk",label:"Walk",icon:"🚶",profile:"foot"},{id:"bus",label:"Bus",icon:"🚌",profile:"transit"}];
const km=(a,b,c,d)=>{const r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,z=Math.sin(x/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)**2;return 6371*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))};
function FitRoute({points}){const map=useMap();useEffect(()=>{if(points.length>1)map.fitBounds(points,{padding:[35,35]});else if(points.length===1)map.setView(points[0],13)},[map,points]);return null}

export default function Travel({location}){
const[origin,setOrigin]=useState({lat:Number(location?.lat)||12.2958,lng:Number(location?.lng)||76.6394,label:location?.label||"Mysuru"});
const[target,setTarget]=useState(destinations[0]);
const[destinationQuery,setDestinationQuery]=useState(destinations[0].name);
const[suggestions,setSuggestions]=useState([]);
const[mode,setMode]=useState("car");
const[rideType,setRideType]=useState("auto");
const[route,setRoute]=useState([]);
const[routeInfo,setRouteInfo]=useState(null);
const[loading,setLoading]=useState(false);
const[searching,setSearching]=useState(false);
const[error,setError]=useState("");
const[notice,setNotice]=useState("");
const straight=km(origin.lat,origin.lng,target.lat,target.lng);
const points=useMemo(()=>route.length?route:[[origin.lat,origin.lng],[target.lat,target.lng]],[route,origin.lat,origin.lng,target.lat,target.lng]);

useEffect(()=>{setOrigin({lat:Number(location?.lat)||12.2958,lng:Number(location?.lng)||76.6394,label:location?.label||"Mysuru"})},[location?.lat,location?.lng,location?.label]);

async function searchDestination(value){
 setDestinationQuery(value);setError("");setNotice("");
 const match=destinations.find(x=>x.name.toLowerCase()===value.trim().toLowerCase());
 if(match){setTarget(match);setSuggestions([]);setRoute([]);setRouteInfo(null);return}
 if(value.trim().length<3){setSuggestions([]);return}
 setSearching(true);
 try{const rows=await api.locationSearch(value.trim());setSuggestions(rows.slice(0,5))}
 catch(e){setError("Could not search for this destination. "+e.message)}
 finally{setSearching(false)}
}
function chooseSuggestion(item){
 const next={name:item.label.split(",").slice(0,2).join(", "),address:item.label,lat:Number(item.lat),lng:Number(item.lng)};
 setTarget(next);setDestinationQuery(next.name);setSuggestions([]);setRoute([]);setRouteInfo(null);setNotice("Destination selected.");
}
function useGps(){
 if(!navigator.geolocation){setError("This browser does not support GPS.");return}
 setNotice("Waiting for location permission…");
 navigator.geolocation.getCurrentPosition(p=>{
  setOrigin({lat:p.coords.latitude,lng:p.coords.longitude,label:"Current GPS location"});
  setRoute([]);setRouteInfo(null);setError("");setNotice("GPS pickup location updated.");
 },()=>{setNotice("");setError("Location permission was denied. Allow location access in your browser and try again.")},{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
}
async function findRoute(){
 setLoading(true);setError("");setNotice("");setRoute([]);setRouteInfo(null);
 const selected=modes.find(x=>x.id===mode);
 if(selected.profile==="transit"){
  setLoading(false);
  setNotice("Public-transport route details open in Google Maps. Bus routes and live timings are not available from the free map-routing service.");
  return;
 }
 try{
  const base=selected.profile==="bike"?"https://routing.openstreetmap.de/routed-bike/route/v1/driving/":selected.profile==="foot"?"https://routing.openstreetmap.de/routed-foot/route/v1/driving/":"https://router.project-osrm.org/route/v1/driving/";
  const url=base+origin.lng+","+origin.lat+";"+target.lng+","+target.lat+"?overview=full&geometries=geojson";
  const response=await fetch(url);
  if(!response.ok)throw new Error("The route service is unavailable.");
  const data=await response.json();const best=data.routes?.[0];
  if(!best?.geometry?.coordinates?.length)throw new Error("No route was found. Try another destination.");
  setRoute(best.geometry.coordinates.map(([lng,lat])=>[lat,lng]));
  setRouteInfo({distance:(best.distance/1000).toFixed(1),minutes:Math.round(best.duration/60)});
 }catch(e){setError(e.message||"Could not load the route.")}
 finally{setLoading(false)}
}
const googleMode=mode==="bus"?"transit":mode==="walk"?"walking":mode==="bike"?"bicycling":"driving";
const mapsUrl="https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(origin.lat+","+origin.lng)+"&destination="+encodeURIComponent(target.address||target.name)+"&travelmode="+googleMode;
const uberUrl="https://m.uber.com/ul/?action=setPickup&pickup[latitude]="+origin.lat+"&pickup[longitude]="+origin.lng+"&dropoff[latitude]="+target.lat+"&dropoff[longitude]="+target.lng;
const rideLabel=rideType==="auto"?"Auto-rickshaw":rideType==="taxi"?"Taxi / cab":"Bike taxi";
const rideProviderUrl=rideType==="taxi"?uberUrl:"https://www.rapido.bike/";
const rideProviderLabel=rideType==="taxi"?"Continue with Uber ↗":"Continue with Rapido ↗";
return <main className="page-v2 ht-page travel-page">
 <div className="page-intro"><div><span className="ht-kicker">MYSURU JOURNEY & LOCAL TRANSPORT</span><h2>Choose your route.<br/><em>Travel with confidence.</em></h2><p>Set a pickup point with GPS, search for any destination and view available route guidance on the map.</p></div><div className="intro-side"><b>GPS</b><span>location-aware<br/>journey planner</span></div></div>
 <section className="ht-travel"><div className="ht-heading"><div><small>ROUTE PLANNER</small><h2>Plan your journey</h2><p>Choose car, bike, walking or public transport. Route estimates are supplied by OpenStreetMap-based services.</p></div></div>
  <div className="ht-form-grid">
   <label>Pickup location<div className="travel-pickup"><input readOnly value={origin.label+" · "+origin.lat.toFixed(4)+", "+origin.lng.toFixed(4)}/><button type="button" className="outline-button" onClick={useGps}>Use current GPS</button></div></label>
   <label>Destination<input value={destinationQuery} onChange={e=>searchDestination(e.target.value)} placeholder="Search a place or address" autoComplete="off"/>{searching&&<small>Searching…</small>}{suggestions.length>0&&<div className="travel-suggestions">{suggestions.map((s,i)=><button type="button" key={s.label+i} onClick={()=>chooseSuggestion(s)}>{s.label}</button>)}</div>}</label>
  </div>
  <div className="ht-modes">{modes.map(x=><button type="button" key={x.id} className={mode===x.id?"active":""} aria-pressed={mode===x.id} onClick={()=>{setMode(x.id);setRoute([]);setRouteInfo(null);setNotice("");setError("")}}><span>{x.icon}</span>{x.label}</button>)}</div>
  <div className="ht-actions"><button type="button" className="solid-button" onClick={findRoute} disabled={loading}>{loading?"Finding route…":"Show route on map"}</button><a className="outline-button" href={mapsUrl} target="_blank" rel="noreferrer">Open turn-by-turn directions ↗</a></div>
  {mode==="bus"&&<p className="ht-note">Bus routing and live schedules depend on local transit data. Use Google Maps for current public-transport options.</p>}
  {notice&&<p className="ht-note" role="status">{notice}</p>}{error&&<p className="ht-note" role="alert">{error}</p>}
  <div className="travel-map-wrap"><MapContainer center={[origin.lat,origin.lng]} zoom={12} scrollWheelZoom style={{height:"420px",width:"100%",borderRadius:"12px"}}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Marker position={[origin.lat,origin.lng]}><Popup>Pickup: {origin.label}</Popup></Marker><Marker position={[target.lat,target.lng]}><Popup>Drop: {target.name}</Popup></Marker>{route.length>1&&<Polyline positions={route} pathOptions={{color:"#a4123f",weight:5}}/>}<FitRoute points={points}/></MapContainer></div>
  <div className="ht-estimate"><div><small>STRAIGHT-LINE DISTANCE</small><strong>{straight.toFixed(1)} km</strong></div><div><small>ROUTE DISTANCE</small><strong>{routeInfo?routeInfo.distance+" km":mode==="bus"?"Use transit directions":"Not calculated"}</strong></div><div><small>ROUTE TIME</small><strong>{routeInfo?Math.floor(routeInfo.minutes/60)+"h "+routeInfo.minutes%60+"m":mode==="bus"?"Check live schedule":"Not calculated"}</strong></div><p>Distance and duration are estimates, not live traffic or guaranteed travel times.</p></div>
 </section>
 <section className="ht-section local-travel-section"><div className="ht-heading"><div><small>LOCAL AUTO, TAXI & BIKE RIDES</small><h2>Request a pickup-to-drop ride</h2><p>Choose a ride type and continue to a supported provider with your GPS pickup and selected destination details.</p></div></div>
  <div className="ht-modes">{[{id:"auto",label:"Auto-rickshaw",icon:"🛺"},{id:"taxi",label:"Taxi",icon:"🚕"},{id:"bike",label:"Bike taxi",icon:"🏍️"}].map(x=><button type="button" key={x.id} className={rideType===x.id?"active":""} onClick={()=>setRideType(x.id)}><span>{x.icon}</span>{x.label}</button>)}</div>
  <div className="local-travel-grid"><article><span>Pickup</span><h3>{origin.label}</h3><p>{origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}</p></article><article><span>Drop</span><h3>{target.name}</h3><p>{target.address||target.name}</p></article><article><span>Ride type</span><h3>{rideLabel}</h3><p>Estimated straight-line distance: {straight.toFixed(1)} km</p></article></div>
  <div className="ht-actions"><a className="solid-button" href={rideProviderUrl} target="_blank" rel="noreferrer">{rideProviderLabel}</a></div>
  <p className="ht-disclaimer">TravelMate can share route details with provider links, but it does not dispatch drivers, calculate provider fares or confirm a ride. Actual auto, taxi and bike-taxi availability depends on the provider and local service area. Review the pickup and drop in the provider app before confirming.</p>
 </section>
</main>
}
