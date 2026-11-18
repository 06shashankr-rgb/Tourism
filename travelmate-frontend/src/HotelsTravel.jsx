import React,{useMemo,useState}from"react";

const hotels=[
 {id:"hoysala",name:"Hotel Mayura Hoysala",city:"Mysuru",area:"Mysuru city centre",lat:12.3152,lng:76.6438,tier:"KSTDC premium",description:"Government-run KSTDC stay in Mysuru, convenient for the palace, railway station and city attractions.",url:"https://kstdc.co/hotels/hotel-mayura-hoysala-mysuru/"},
 {id:"riverview",name:"Hotel Mayura Riverview",city:"Srirangapatna",area:"River Cauvery, Srirangapatna",lat:12.4224,lng:76.6936,tier:"KSTDC premium",description:"KSTDC property beside the Cauvery, useful for Srirangapatna and the Mysuru–KRS circuit.",url:"https://kstdc.co/mayura-hotels/"},
 {id:"kauvery",name:"Hotel Mayura Kauvery",city:"KRS / Brindavan Gardens",area:"Krishna Raja Sagara",lat:12.4244,lng:76.5722,tier:"KSTDC budget",description:"KSTDC stay near Brindavan Gardens and the KRS dam.",url:"https://kstdc.co/mayura-hotels/"},
 {id:"valleyview",name:"Hotel Mayura Valleyview",city:"Madikeri, Kodagu",area:"Madikeri",lat:12.4200,lng:75.7390,tier:"KSTDC premium",description:"KSTDC property in Madikeri for travellers exploring Kodagu / Coorg.",url:"https://kstdc.co/mayura-hotels/"}
];
const origins=[
 {name:"Mysuru",lat:12.2958,lng:76.6394},
 {name:"Bengaluru",lat:12.9716,lng:77.5946},
 {name:"Madikeri (Kodagu)",lat:12.4200,lng:75.7390},
 {name:"Mangaluru",lat:12.9141,lng:74.8560},
 {name:"Hassan",lat:13.0068,lng:76.0996},
 {name:"Ooty",lat:11.4102,lng:76.6950},
 {name:"Other / enter coordinates",lat:null,lng:null}
];
const km=(a,b,c,d)=>{const r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,z=Math.sin(x/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)**2;return 6371*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))};
const money=n=>"₹"+Math.round(n).toLocaleString("en-IN");
export default function HotelsTravel({location}){
 const [origin,setOrigin]=useState("Bengaluru"),[mode,setMode]=useState("car"),[custom,setCustom]=useState(""),[destination,setDestination]=useState("Mysuru");
 const selected=origins.find(x=>x.name===origin)||origins[0];
 const from=origin==="Other / enter coordinates"?null:selected;
 const destinationCoords=destination==="Mysuru"?{lat:12.2958,lng:76.6394}:destination==="Madikeri (Kodagu)"?{lat:12.4200,lng:75.7390}:{lat:12.4224,lng:76.6936};
 const distance=from?km(from.lat,from.lng,destinationCoords.lat,destinationCoords.lng):null;
 const routeDistance=distance===null?null:Math.round(distance*1.12);
 const estimates=routeDistance===null?null:({
 car:{time:Math.round(routeDistance/55*60),cost:routeDistance*13,detail:"Private car / self-drive estimate"},
 bus:{time:Math.round(routeDistance/42*60),cost:routeDistance*1.65,detail:"Indicative public-bus fare range; confirm with the operator"},
 train:{time:Math.round(routeDistance/50*60),cost:routeDistance*1.15,detail:"Indicative rail fare; service and class availability vary"},
 bike:{time:Math.round(routeDistance/40*60),cost:routeDistance*3.2,detail:"Two-wheeler fuel estimate"}
 })[mode]);
 const hotelRows=useMemo(()=>hotels.map(h=>({...h,distance:km(location?.lat??12.2958,location?.lng??76.6394,h.lat,h.lng)})).sort((a,b)=>a.distance-b.distance),[location?.lat,location?.lng]);
 const routeNotes=origin==="Bengaluru"&&destination==="Mysuru"?["Road: Bengaluru → Ramanagara → Mandya → Mysuru via NH 275 (about 140 km; around 3.5 hours, official district guide).","Bus: frequent intercity services are available; check current departure and fare with the bus operator.","Train: check current Bengaluru–Mysuru services and timings before departure."]:origin==="Madikeri (Kodagu)"&&destination==="Mysuru"?["Road: Madikeri → Kushalnagara → Hunsur → Mysuru (about 120 km; around 2 hours 45 minutes, official district guide).","Bus: check current Madikeri–Mysuru service timings and seat availability with the operator."]:["Use the road distance and time estimate as a planning guide only. Check live traffic, public transport schedules and fares before travelling."];
 return <main className="page-v2 ht-page">
  <div className="page-intro"><div><span>STAYS & JOURNEYS</span><h2>Stay well.<br/><em>Travel smarter.</em></h2><p>Explore Karnataka Tourism Development Corporation (KSTDC) Mayura stays near your selected location and plan a journey to Mysuru or nearby destinations.</p></div><div className="intro-side"><b>02</b><span>travel tools<br/>in one place</span></div></div>
  <section className="ht-section"><div className="ht-heading"><div><small>GOVERNMENT-MANAGED STAYS</small><h2>KSTDC Mayura hotels</h2><p>Sorted by distance from your saved or GPS location. Rates and room availability must be confirmed with KSTDC.</p></div><a className="outline-button" href="https://kstdc.co/mayura-hotels/" target="_blank" rel="noreferrer">Official KSTDC hotel list ↗</a></div>
   <div className="ht-hotel-grid">{hotelRows.map(h=><article className="ht-hotel" key={h.id}><div className="ht-hotel-top"><span>{h.tier}</span><b>{h.distance.toFixed(1)} km away</b></div><div className="ht-hotel-body"><h3>{h.name}</h3><small>{h.city} · {h.area}</small><p>{h.description}</p><a href={h.url} target="_blank" rel="noreferrer">View official details / booking ↗</a></div></article>)}</div>
  </section>
  <section className="ht-section ht-travel"><div className="ht-heading"><div><small>YOUR JOURNEY PLANNER</small><h2>How will you travel?</h2><p>Plan a trip to Mysuru with transport options and indicative distance, time and cost estimates. This is TravelMate's own planner—not a connection to Rapido, Uber or other ride-hailing apps.</p></div></div>
   <div className="ht-form-grid"><label>Starting from<select value={origin} onChange={e=>setOrigin(e.target.value)}>{origins.map(o=><option key={o.name}>{o.name}</option>)}</select></label><label>Destination<select value={destination} onChange={e=>setDestination(e.target.value)}><option>Mysuru</option><option>Madikeri (Kodagu)</option><option>Srirangapatna</option></select></label></div>
   {origin==="Other / enter coordinates"&&<p className="ht-note">For a custom starting point, use the Places page to set your location with GPS first. This planner currently uses the listed city starting points.</p>}
   <div className="ht-modes">{[["car","Car / taxi","🚗"],["bus","Bus","🚌"],["train","Train","🚆"],["bike","Bike","🏍️"]].map(([id,label,emoji])=><button key={id} className={mode===id?"active":""} onClick={()=>setMode(id)}><span>{emoji}</span>{label}</button>)}</div>
   {estimates?<div className="ht-estimate"><div><small>APPROX. ROAD DISTANCE</small><strong>{routeDistance} km</strong></div><div><small>ESTIMATED TIME</small><strong>{Math.floor(estimates.time/60)}h {estimates.time%60}m</strong></div><div><small>INDICATIVE COST</small><strong>{money(estimates.cost)}{mode==="car"?"*":""}</strong></div><p>{estimates.detail}. These are planning estimates, not live quotes, ticket prices or a confirmed vehicle booking. Actual routes, traffic, fares and schedules may differ.</p></div>:<div className="ht-note">Choose one of the listed starting cities to calculate an estimate.</div>}
   <div className="ht-route-notes"><h3>Route guidance</h3>{routeNotes.map((n,i)=><p key={i}>• {n}</p>)}</div>
   <div className="ht-actions"><a className="solid-button" href={"https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(origin==="Other / enter coordinates"?"Mysuru":origin)+"&destination="+encodeURIComponent(destination==="Mysuru"?"Mysuru, Karnataka":destination==="Madikeri (Kodagu)"?"Madikeri, Kodagu, Karnataka":"Srirangapatna, Karnataka")} target="_blank" rel="noreferrer">Open route map ↗</a><span>*Car estimate assumes a generic per-kilometre planning rate, not a provider quote.</span></div>
  </section>
 </main>
}
