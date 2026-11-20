import React,{useMemo,useState}from"react";
const locations=[
{name:"Mysuru",lat:12.2958,lng:76.6394},{name:"Bengaluru",lat:12.9716,lng:77.5946},{name:"Madikeri (Kodagu)",lat:12.4200,lng:75.7390},{name:"Mangaluru",lat:12.9141,lng:74.8560},{name:"Hassan",lat:13.0068,lng:76.0996},{name:"Ooty",lat:11.4102,lng:76.6950},{name:"Srirangapatna",lat:12.4224,lng:76.6936}];
const km=(a,b,c,d)=>{const r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,z=Math.sin(x/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)**2;return 6371*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))};
const money=n=>"₹"+Math.round(n).toLocaleString("en-IN");
const modes=[["car","Car / taxi","🚗"],["bus","Bus","🚌"],["train","Train","🚆"],["bike","Two-wheeler","🏍️"]];
export default function Travel({location}){
const[origin,setOrigin]=useState("Current saved location"),[destination,setDestination]=useState("Mysuru"),[mode,setMode]=useState("car");
const from=origin==="Current saved location"?{lat:Number(location?.lat)||12.2958,lng:Number(location?.lng)||76.6394,name:location?.label||"Saved location"}:locations.find(x=>x.name===origin);
const to=locations.find(x=>x.name===destination);
const distance=from&&to?km(from.lat,from.lng,to.lat,to.lng):0,roadDistance=Math.round(distance*1.12);
const estimates=useMemo(()=>({car:{time:Math.round(roadDistance/55*60),cost:roadDistance*13,detail:"Private car / self-drive planning estimate"},bus:{time:Math.round(roadDistance/42*60),cost:roadDistance*1.65,detail:"Indicative public-bus estimate; confirm with the operator"},train:{time:Math.round(roadDistance/50*60),cost:roadDistance*1.15,detail:"Indicative rail estimate; check route, class and service availability"},bike:{time:Math.round(roadDistance/40*60),cost:roadDistance*3.2,detail:"Two-wheeler fuel estimate"}}[mode]),[roadDistance,mode]);
const originText=origin==="Current saved location"?(from.lat+","+from.lng):origin;
const routeUrl="https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(originText)+"&destination="+encodeURIComponent(destination+", Karnataka");
return <main className="page-v2 ht-page travel-page">
<div className="page-intro"><div><span className="ht-kicker">PLAN YOUR JOURNEY</span><h2>Getting there.<br/><em>Getting around.</em></h2><p>Plan a journey to Mysuru or nearby destinations, compare simple transport estimates and find practical local travel guidance.</p></div><div className="intro-side"><b>01</b><span>journey<br/>planner</span></div></div>
<section className="ht-travel"><div className="ht-heading"><div><small>INTERCITY JOURNEY PLANNER</small><h2>Where are you travelling?</h2><p>Choose a starting point, destination and travel mode to see an approximate distance, journey time and cost.</p></div></div>
<div className="ht-form-grid"><label>Starting from<select value={origin} onChange={e=>setOrigin(e.target.value)}><option>Current saved location</option>{locations.map(x=><option key={x.name}>{x.name}</option>)}</select></label><label>Destination<select value={destination} onChange={e=>setDestination(e.target.value)}>{locations.map(x=><option key={x.name}>{x.name}</option>)}</select></label></div>
<p className="ht-note">Starting point: {from.name||location?.label||"Saved location"} · Estimates are based on approximate straight-line distance converted to a road-distance guide.</p>
<div className="ht-modes">{modes.map(([id,label,emoji])=><button type="button" key={id} className={mode===id?"active":""} aria-pressed={mode===id} onClick={()=>setMode(id)}><span>{emoji}</span>{label}</button>)}</div>
<div className="ht-estimate"><div><small>APPROX. ROAD DISTANCE</small><strong>{roadDistance} km</strong></div><div><small>ESTIMATED TIME</small><strong>{Math.floor(estimates.time/60)}h {estimates.time%60}m</strong></div><div><small>INDICATIVE COST</small><strong>{money(estimates.cost)}{mode==="car"?"*":""}</strong></div><p>{estimates.detail}. This is a planning estimate, not a live fare, ticket price or confirmed booking. Actual routes, traffic, fares and schedules may differ.</p></div>
<div className="ht-actions"><a className="solid-button" href={routeUrl} target="_blank" rel="noreferrer">View route on map ↗</a><span>*Car estimate uses a generic per-kilometre planning rate, not a provider quote.</span></div></section>
<section className="ht-section local-travel-section"><div className="ht-heading"><div><small>LOCAL TRANSPORT IN MYSURU</small><h2>Move around like a local</h2><p>Choose the transport that suits the distance, time and comfort you need.</p></div></div><div className="local-travel-grid">
<article><span>01</span><h3>City buses</h3><p>Useful for regular routes across Mysuru. Check the latest route, stop and timetable information before boarding.</p><a href="https://mitra.ksrtc.in/" target="_blank" rel="noreferrer">KSRTC information ↗</a></article>
<article><span>02</span><h3>Auto-rickshaws</h3><p>Convenient for short trips and last-mile travel. Confirm the fare or meter before starting your journey.</p></article>
<article><span>03</span><h3>Taxi and cabs</h3><p>Useful for airport transfers, family travel and longer trips. Compare the fare shown by the provider before confirming.</p></article>
<article><span>04</span><h3>Walk and cycle</h3><p>For nearby attractions and short distances, walking or cycling can be a practical way to explore the city.</p></article>
</div></section>
<p className="ht-disclaimer">TravelMate provides independent planning guidance only. It does not connect to ride-hailing services, issue tickets or book transport.</p>
</main>}
