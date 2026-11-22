import React,{useEffect,useMemo,useState}from"react";
import{MapContainer,TileLayer,Marker,Polyline,Popup,useMap}from"react-leaflet";

const destinations=[
{name:"Mysuru Palace",lat:12.3052,lng:76.6552,address:"Mysuru Palace, Mysuru, Karnataka"},
{name:"Chamundi Hill",lat:12.2746,lng:76.6737,address:"Chamundi Hill, Mysuru, Karnataka"},
{name:"Mysuru Zoo",lat:12.3008,lng:76.6677,address:"Mysuru Zoo, Mysuru, Karnataka"},
{name:"St. Philomena's Cathedral",lat:12.3176,lng:76.6497,address:"St Philomena's Cathedral, Mysuru, Karnataka"},
{name:"Srirangapatna",lat:12.4224,lng:76.6936,address:"Srirangapatna, Karnataka"},
{name:"Ranganathittu Bird Sanctuary",lat:12.4245,lng:76.6570,address:"Ranganathittu Bird Sanctuary, Karnataka"},
{name:"Brindavan Gardens (KRS)",lat:12.4244,lng:76.5722,address:"Brindavan Gardens, KRS, Karnataka"},
{name:"Nanjangud Temple",lat:12.1176,lng:76.6835,address:"Srikanteshwara Temple, Nanjangud, Karnataka"},
{name:"Talakadu",lat:12.1915,lng:77.0270,address:"Talakadu, Karnataka"},
{name:"Shivanasamudra Falls",lat:12.3010,lng:77.1700,address:"Shivanasamudra Falls, Karnataka"},
{name:"Bengaluru",lat:12.9716,lng:77.5946,address:"Bengaluru, Karnataka"}
];
const km=(a,b,c,d)=>{const r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,z=Math.sin(x/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)**2;return 6371*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))};
const modes=[{id:"car",label:"Car",profile:"driving",icon:"🚗"},{id:"bike",label:"Bike",profile:"driving",icon:"🏍️"},{id:"walk",label:"Walk",profile:"foot",icon:"🚶"},{id:"bus",label:"Bus",profile:"transit",icon:"🚌"}];
function FitRoute({points}){const map=useMap();useEffect(()=>{if(points.length>1)map.fitBounds(points,{padding:[35,35]});else if(points.length===1)map.setView(points[0],13)},[map,points]);return null}
export default function Travel({location}){
const[origin,setOrigin]=useState({lat:Number(location?.lat)||12.2958,lng:Number(location?.lng)||76.6394,label:location?.label||"Mysuru"});
const[destination,setDestination]=useState(destinations[0].name),[mode,setMode]=useState("car"),[gps,setGps]=useState(false),[route,setRoute]=useState([]),[routeInfo,setRouteInfo]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState("");
const target=destinations.find(x=>x.name===destination)||destinations[0];
const straight=km(origin.lat,origin.lng,target.lat,target.lng);
const points=useMemo(()=>route.length?route:[[origin.lat,origin.lng],[target.lat,target.lng]],[route,origin.lat,origin.lng,target.lat,target.lng]);
useEffect(()=>{setOrigin({lat:Number(location?.lat)||12.2958,lng:Number(location?.lng)||76.6394,label:location?.label||"Mysuru"})},[location?.lat,location?.lng,location?.label]);
function useGps(){if(!navigator.geolocation){setError("This browser does not support GPS.");return}navigator.geolocation.getCurrentPosition(p=>{setOrigin({lat:p.coords.latitude,lng:p.coords.longitude,label:"Current GPS location"});setGps(true);setError("")},()=>setError("Location permission was denied. Allow location access in your browser and try again."),{enableHighAccuracy:true,timeout:15000,maximumAge:30000})}
async function findRoute(){
 setLoading(true);setError("");setRoute([]);setRouteInfo(null);
 const selected=modes.find(x=>x.id===mode);
 if(selected.profile==="transit"){setLoading(false);return}
 try{
  const url="https://router.project-osrm.org/route/v1/"+selected.profile+"/"+origin.lng+","+origin.lat+";"+target.lng+","+target.lat+"?overview=full&geometries=geojson";
  const response=await fetch(url);if(!response.ok)throw new Error("Route service is unavailable.");
  const data=await response.json();const best=data.routes?.[0];if(!best)throw new Error("No route was found for this journey.");
  const line=best.geometry.coordinates.map(([lng,lat])=>[lat,lng]);setRoute(line);setRouteInfo({distance:(best.distance/1000).toFixed(1),minutes:Math.round(best.duration/60)});
 }catch(e){setError(e.message||"Could not load the route.");}
 finally{setLoading(false)}
}
const mapsUrl="https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(origin.lat+","+origin.lng)+"&destination="+encodeURIComponent(target.address)+"&travelmode="+(mode==="bus"?"transit":mode==="walk"?"walking":mode==="bike"?"bicycling":"driving");
const rideUrl="https://m.uber.com/ul/?action=setPickup&pickup[latitude]="+origin.lat+"&pickup[longitude]="+origin.lng+"&dropoff[latitude]="+target.lat+"&dropoff[longitude]="+target.lng;
return <main className="page-v2 ht-page travel-page">
<div className="page-intro"><div><span className="ht-kicker">MYSURU JOURNEY & LOCAL TRANSPORT</span><h2>Choose your route.<br/><em>Travel with confidence.</em></h2><p>Use GPS for your pickup point, choose a destination and view a route on the map. Compare road, walking and public-transit directions.</p></div><div className="intro-side"><b>GPS</b><span>location-aware<br/>journey planner</span></div></div>
<section className="ht-travel"><div className="ht-heading"><div><small>ROUTE PLANNER</small><h2>Where do you want to go?</h2><p>Travel from your current location or the saved TravelMate location to a Mysuru attraction or nearby destination.</p></div></div>
<div className="ht-form-grid"><label>Pickup location<div className="travel-pickup"><input readOnly value={origin.label+" · "+origin.lat.toFixed(4)+", "+origin.lng.toFixed(4)}/><button type="button" className="outline-button" onClick={useGps}>Use GPS</button></div></label><label>Destination<select value={destination} onChange={e=>{setDestination(e.target.value);setRoute([]);setRouteInfo(null)}}>{destinations.map(x=><option key={x.name} value={x.name}>{x.name}</option>)}</select></label></div>
<div className="ht-modes">{modes.map(x=><button type="button" key={x.id} className={mode===x.id?"active":""} aria-pressed={mode===x.id} onClick={()=>{setMode(x.id);setRoute([]);setRouteInfo(null)}}><span>{x.icon}</span>{x.label}</button>)}</div>
<div className="ht-actions"><button type="button" className="solid-button" onClick={findRoute} disabled={loading}>{loading?"Finding route…":"Show route on map"}</button><a className="outline-button" href={mapsUrl} target="_blank" rel="noreferrer">Open turn-by-turn directions ↗</a></div>
{mode==="bus"&&<p className="ht-note">Bus routes and live schedules are not supplied by the map-routing service. Open Google Maps transit directions for available public-transport options.</p>}
{error&&<p role="alert" className="ht-note">{error}</p>}
<div className="travel-map-wrap"><MapContainer center={[origin.lat,origin.lng]} zoom={12} scrollWheelZoom style={{height:"420px",width:"100%",borderRadius:"12px"}}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Marker position={[origin.lat,origin.lng]}><Popup>Pickup: {origin.label}</Popup></Marker><Marker position={[target.lat,target.lng]}><Popup>Drop: {target.name}</Popup></Marker>{route.length>1&&<Polyline positions={route} pathOptions={{color:"#a4123f",weight:5}}/>}<FitRoute points={points}/></MapContainer></div>
<div className="ht-estimate"><div><small>STRAIGHT-LINE DISTANCE</small><strong>{straight.toFixed(1)} km</strong></div><div><small>ROUTE DISTANCE</small><strong>{routeInfo?routeInfo.distance+" km":"See map"}</strong></div><div><small>ROUTE TIME</small><strong>{routeInfo?Math.floor(routeInfo.minutes/60)+"h "+routeInfo.minutes%60+"m":"Live estimate"}</strong></div><p>Route time and distance are estimates from OpenStreetMap routing. Actual travel time depends on traffic, road conditions, stops and transport schedules.</p></div>
</section>
<section className="ht-section local-travel-section"><div className="ht-heading"><div><small>LOCAL AUTO, TAXI & BIKE RIDES</small><h2>From your pickup to your drop</h2><p>GPS pickup and destination details can be passed to a supported ride provider. Final fare, driver availability and booking confirmation are handled by that provider.</p></div></div>
<div className="local-travel-grid"><article><span>01</span><h3>Auto-rickshaw</h3><p>For short city trips. Check the displayed fare and confirm the ride in the provider app.</p><a href="https://www.rapido.bike/" target="_blank" rel="noreferrer">Open Rapido ↗</a></article><article><span>02</span><h3>Taxi / cab</h3><p>For airport transfers, family travel and longer journeys. Pickup and drop coordinates are ready to use.</p><a href={rideUrl} target="_blank" rel="noreferrer">Continue with Uber ↗</a></article><article><span>03</span><h3>Bike taxi</h3><p>For eligible short trips where a bike-taxi provider operates. Check local availability and safety requirements.</p><a href="https://www.rapido.bike/" target="_blank" rel="noreferrer">Check Rapido ↗</a></article></div>
<p className="ht-disclaimer">TravelMate does not dispatch drivers or confirm ride bookings. Provider links open their own service; review the pickup, destination, fare and safety details before confirming.</p>
</section>
</main>}
