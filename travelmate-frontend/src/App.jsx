import React,{useEffect,useMemo,useState} from "react";
import {Routes,Route,NavLink,Link,useNavigate} from "react-router-dom";
import {MapContainer,TileLayer,Marker,Circle,useMap} from "react-leaflet";
import {places,events} from "./data";
import {translations} from "./i18n";

const defaultLocation={lat:12.2958,lng:76.6394,label:"Mysuru"};
const radii=[50,100,150,200];

function distanceKm(a,b,c,d){const R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,z=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return 2*R*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))}
function Recenter({center}){const map=useMap();useEffect(()=>map.setView(center,12),[map,center]);return null}

export default function App(){
 const[language,setLanguage]=useState(localStorage.getItem("language")||"English");
 const[theme,setTheme]=useState(localStorage.getItem("theme")||"light");
 const[location,setLocation]=useState(()=>JSON.parse(localStorage.getItem("location")||"null")||defaultLocation);
 const[live,setLive]=useState(false);
 const[user,setUser]=useState(()=>JSON.parse(localStorage.getItem("tmUser")||"null"));
 const[users,setUsers]=useState(()=>JSON.parse(localStorage.getItem("tmUsers")||"[]"));
 const[planner,setPlanner]=useState(()=>JSON.parse(localStorage.getItem("tmPlanner")||"[]"));
 const[bookings,setBookings]=useState(()=>JSON.parse(localStorage.getItem("tmBookings")||"[]"));
 const[bookingEvent,setBookingEvent]=useState(null);
 const t=translations[language] || translations.English;

 useEffect(()=>localStorage.setItem("language",language),[language]);
 useEffect(()=>localStorage.setItem("theme",theme),[theme]);
 useEffect(()=>localStorage.setItem("location",JSON.stringify(location)),[location]);
 useEffect(()=>localStorage.setItem("tmUser",JSON.stringify(user)),[user]);
 useEffect(()=>localStorage.setItem("tmUsers",JSON.stringify(users)),[users]);
 useEffect(()=>localStorage.setItem("tmPlanner",JSON.stringify(planner)),[planner]);
 useEffect(()=>localStorage.setItem("tmBookings",JSON.stringify(bookings)),[bookings]);

 useEffect(()=>{
   if(!live||!navigator.geolocation)return;
   const watchId=navigator.geolocation.watchPosition(
     p=>setLocation({lat:p.coords.latitude,lng:p.coords.longitude,label:t.live}),
     ()=>setLive(false),
     {enableHighAccuracy:true,maximumAge:5000,timeout:10000}
   );
   return()=>navigator.geolocation.clearWatch(watchId);
 },[live,t.live]);

 function startGps(){
   if(!navigator.geolocation){alert("GPS is not supported by this browser.");return}
   navigator.geolocation.getCurrentPosition(
     p=>{setLocation({lat:p.coords.latitude,lng:p.coords.longitude,label:t.live});setLive(true)},
     ()=>alert("Location permission was denied.")
   );
 }
 function add(item,type){if(!planner.some(x=>x.id===item.id&&x.type===type))setPlanner(x=>[...x,{...item,type}])}
 function remove(id,type){setPlanner(x=>x.filter(i=>!(i.id===id&&i.type===type)))}
 function logout(){setUser(null);localStorage.removeItem("tmUser")}

 function saveBooking(item){
   setBookings(x=>[...x,{...item,id:"TM-"+Date.now(),userEmail:user.email}]);
   setBookingEvent(null);
 }

 return <div className={`app theme-${theme}`}>
   <Header t={t} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} user={user} logout={logout}/>
   <Routes>
     <Route path="/" element={<Home t={t} location={location} live={live} startGps={startGps}/>}/>
     <Route path="/places" element={<Places t={t} location={location} live={live} startGps={startGps} add={add}/>}/>
     <Route path="/events" element={<Events t={t} location={location} user={user} add={add} openBooking={setBookingEvent}/>}/>
     <Route path="/ai" element={<Assistant t={t} location={location}/>}/>
     <Route path="/planner" element={<Planner t={t} planner={planner} bookings={bookings} remove={remove}/>}/>
     <Route path="/login" element={<Auth t={t} users={users} setUsers={setUsers} setUser={setUser} loginMode/>}/>
     <Route path="/signup" element={<Auth t={t} users={users} setUsers={setUsers} setUser={setUser}/>}/>
   </Routes>
   {bookingEvent&&<BookingModal t={t} event={bookingEvent} user={user} close={()=>setBookingEvent(null)} save={saveBooking}/>}
   <footer>TravelMate • Smart Tourism Management System • Explore • Events • AI • Plan • Book</footer>
 </div>
}

function Header({t,language,setLanguage,theme,setTheme,user,logout}){
 return <header className="header">
  <Link className="logo" to="/">✦ TravelMate</Link>
  <nav><NavLink to="/">{t.home}</NavLink><NavLink to="/places">{t.places}</NavLink><NavLink to="/events">{t.events}</NavLink><NavLink to="/ai">{t.ai}</NavLink><NavLink to="/planner">{t.planner}</NavLink></nav>
  <div className="controls">
   <select value={language} onChange={e=>setLanguage(e.target.value)}>{Object.keys(translations).map(x=><option key={x}>{x}</option>)}</select>
   <select value={theme} onChange={e=>setTheme(e.target.value)}><option value="light">{t.light}</option><option value="dark">{t.dark}</option><option value="nature">{t.nature}</option><option value="sunset">{t.sunset}</option></select>
   {user?<><span className="user">{user.name}</span><button className="small ghost" onClick={logout}>{t.logout}</button></>:<><Link className="small ghost" to="/login">{t.signIn}</Link><Link className="small" to="/signup">{t.signUp}</Link></>}
  </div>
 </header>
}

function Home({t,location,live,startGps}){
 const nav=useNavigate();
 return <main className="hero"><div><small>SMART TOURISM • AI • MULTILINGUAL</small><h1>{t.homeTitle}</h1><p>{t.homeText}</p>
  <button onClick={startGps}>📍 {t.gps}</button><button className="light" onClick={()=>nav("/places")}>{t.explore}</button>
  <div className="location"><i className={live?"live-dot":""}></i>{live?t.locationUpdating:location.label}<br/><small>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</small></div>
 </div><div className="hero-card"><h2>🧭 TravelMate</h2><div className="features"><span>📍 GPS nearby places</span><span>🎟️ Location events</span><span>🤖 AI assistant</span><span>🗺️ Trip planner</span><span>🌐 5 languages</span><span>🎫 Booking</span></div></div></main>
}

function Places({t,location,live,startGps,add}){
 const[radius,setRadius]=useState(50),[search,setSearch]=useState("");
 const nearby=useMemo(()=>places.map(p=>({...p,distance:distanceKm(location.lat,location.lng,p.lat,p.lng)})).filter(p=>p.distance<=radius&&p.name.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>a.distance-b.distance),[location,radius,search]);
 return <main className="page"><small>EXPLORE</small><h2>{t.nearby}</h2><div className="toolbar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}/><select value={radius} onChange={e=>setRadius(+e.target.value)}>{radii.map(r=><option key={r} value={r}>{r} km</option>)}</select><button onClick={startGps}>{live?"🟢":"📍"} {t.gps}</button></div>
 <div className="map-layout"><MapContainer className="map" center={[location.lat,location.lng]} zoom={12}><Recenter center={[location.lat,location.lng]}/><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Circle center={[location.lat,location.lng]} radius={radius*1000}/>{nearby.map(p=><Marker key={p.id} position={[p.lat,p.lng]}/>)}</MapContainer>
 <div className="cards">{nearby.length?nearby.map(p=><article className="card" key={p.id}><div className="image">{p.category}</div><div className="content"><h3>{p.name}</h3><p>{p.description}</p><span>📍 {p.distance.toFixed(1)} km • ★ {p.rating} • ₹{p.price}</span><button onClick={()=>add(p,"place")}>{t.add}</button></div></article>):<div className="empty">{t.noPlaces}</div>}</div></div></main>
}

function Events({t,location,user,add,openBooking}){
 const[radius,setRadius]=useState(50);
 const nearPlaces=useMemo(()=>places.filter(p=>distanceKm(location.lat,location.lng,p.lat,p.lng)<=radius),[location,radius]);
 const ids=new Set(nearPlaces.map(p=>p.id));
 const nearEvents=events.filter(e=>ids.has(e.placeId)).map(e=>({...e,distance:distanceKm(location.lat,location.lng,e.lat,e.lng)})).sort((a,b)=>a.distance-b.distance);
 return <main className="page"><small>EVENTS</small><h2>{t.eventsNear}</h2><div className="toolbar"><select value={radius} onChange={e=>setRadius(+e.target.value)}>{radii.map(r=><option key={r} value={r}>{r} km</option>)}</select><span className="pill">📍 {nearPlaces.length} {t.places}</span></div>
 <div className="cards three">{nearEvents.length?nearEvents.map(e=><article className="card" key={e.id}><div className="event-image">EVENT</div><div className="content"><h3>{e.name}</h3><p>{e.description}</p><p>📍 {e.venue}<br/>📅 {e.date} • {e.time}</p><span>📏 {e.distance.toFixed(1)} km • ₹{e.price} • {e.seats} {t.tickets}</span><div><button onClick={()=>user?openBooking(e):alert(t.loginRequired)}>{t.book}</button><button className="light" onClick={()=>add(e,"event")}>{t.add}</button></div><a className="external" href={e.sourceUrl} target="_blank" rel="noreferrer">{t.external} ↗</a><small className="source">{t.source}: {e.source}</small></div></article>):<div className="empty">{t.noEvents}</div>}</div></main>
}

function BookingModal({t,event,user,close,save}){
 const[tickets,setTickets]=useState(1),[name,setName]=useState(user?.name||""),[email,setEmail]=useState(user?.email||"");
 const total=tickets*event.price;
 function submit(e){e.preventDefault();save({eventId:event.id,eventName:event.name,date:event.date,time:event.time,venue:event.venue,tickets,total,name,email});alert(t.bookingSaved)}
 return <div className="overlay"><div className="modal"><button className="x" onClick={close}>×</button><small>{t.book}</small><h2>{event.name}</h2><p>{event.venue} • {event.date} • {event.time}</p><form onSubmit={submit}><label>{t.name}<input required value={name} onChange={e=>setName(e.target.value)}/></label><label>{t.email}<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>{t.tickets}<input type="number" min="1" max={event.seats} value={tickets} onChange={e=>setTickets(+e.target.value)}/></label><div className="total"><span>{t.total}</span><b>₹{total}</b></div><button type="submit">{t.confirm}</button><a className="external center" href={event.sourceUrl} target="_blank" rel="noreferrer">{t.external} ↗</a></form></div></div>
}

function Auth({t,users,setUsers,setUser,loginMode=false}){
 const nav=useNavigate(),[mode,setMode]=useState(loginMode?"login":"signup"),[form,setForm]=useState({name:"",email:"",password:"",confirm:""});
 function submit(e){e.preventDefault();const email=form.email.trim().toLowerCase();if(mode==="signup"){if(form.password!==form.confirm)return alert("Passwords do not match.");if(users.some(u=>u.email===email))return alert("Email already registered.");const u={name:form.name,email,password:form.password};setUsers(x=>[...x,u]);setUser(u);nav("/")}else{const u=users.find(x=>x.email===email&&x.password===form.password);if(!u)return alert("Invalid email or password.");setUser(u);nav("/")}}
 return <main className="auth-page"><form className="auth-card" onSubmit={submit}><div className="auth-tabs"><button type="button" className={mode==="login"?"active":""} onClick={()=>setMode("login")}>{t.signIn}</button><button type="button" className={mode==="signup"?"active":""} onClick={()=>setMode("signup")}>{t.signUp}</button></div><h2>{mode==="login"?t.signIn:t.create}</h2>{mode==="signup"&&<label>{t.name}<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}<label>{t.email}<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>{t.password}<input required type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>{mode==="signup"&&<label>{t.confirmPassword}<input required type="password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})}/></label>}<button type="submit">{mode==="login"?t.signIn:t.signUp}</button></form></main>
}

function Assistant({t,location}){
 const[q,setQ]=useState(""),[messages,setMessages]=useState([t.aiWelcome||t.homeText]);
 function ask(){if(!q.trim())return;const s=q.toLowerCase();let a=t.bookingQuestion;if(s.includes("place")||s.includes("near"))a=places.map(p=>({...p,d:distanceKm(location.lat,location.lng,p.lat,p.lng)})).sort((a,b)=>a.d-b.d).slice(0,3).map(p=>p.name+" ("+p.d.toFixed(1)+" km)").join(", ");else if(s.includes("event"))a=t.eventsNear;else if(s.includes("plan"))a=t.itinerary;setMessages(x=>[...x,"You: "+q,a]);setQ("")}
 return <main className="page narrow"><small>AI TRAVEL ASSISTANT</small><h2>{t.ai}</h2><div className="chips"><button onClick={()=>setQ(t.nearQuestion)}>{t.nearQuestion}</button><button onClick={()=>setQ(t.eventQuestion)}>{t.eventQuestion}</button><button onClick={()=>setQ(t.planQuestion)}>{t.planQuestion}</button></div><div className="chat">{messages.map((m,i)=><div className={i%2?"message user":"message"} key={i}>{m}</div>)}<div className="chat-input"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder={t.aiPlaceholder}/><button onClick={ask}>{t.ask}</button></div></div></main>
}

function Planner({t,planner,bookings,remove}){
 return <main className="page"><small>TRIP PLANNER</small><h2>{t.itinerary}</h2>{planner.length?planner.map(x=><article className="planner" key={x.type+x.id}><div><span>{x.type}</span><h3>{x.name}</h3><p>{x.description}</p></div><button className="danger" onClick={()=>remove(x.id,x.type)}>{t.remove}</button></article>):<div className="empty">{t.noPlan}</div>}<section className="booking-history"><h3>{t.bookings}</h3>{bookings.length?bookings.map(b=><div className="booking-row" key={b.id}><span><b>{b.eventName}</b><br/>{b.date} • {b.tickets} {t.tickets}</span><b>₹{b.total}</b></div>):<p>{t.noBookings}</p>}</section></main>
}