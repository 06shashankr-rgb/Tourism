import React,{useEffect,useMemo,useState}from"react";
import{Routes,Route,NavLink,Link,useNavigate,useLocation}from"react-router-dom";
import{MapContainer,TileLayer,Marker,Circle,useMap}from"react-leaflet";
import{translations}from"./translations";
import { startWebsiteTranslator } from "./translator";
import{api}from"./api";
import{places as localPlaces,events as localEvents}from"./data";

const defaultLocation={lat:12.2958,lng:76.6394,label:"Mysuru"};
const radii=[0.5,1,2,5,10,15,25,50,100,200];
const eventRadii=[0.5,1,2,5,10];
function readStoredJson(key,fallback){try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback}catch{return fallback}}
const images={
"Mysore Palace":"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mysore_Palace_Morning.jpg/1280px-Mysore_Palace_Morning.jpg",
"Chamundi Hill":"https://www.tripplannersindia.com/assets/blog/images/placestovisitinmysore/Chamundi_Hills.webp",
"Brindavan Gardens":"https://etimg.etb2bimg.com/photo/112049626.cms",
"St. Philomena's Cathedral":"https://www.travel4pictures.com/img/s/v-10/p3463335904-4.jpg",
"Karanji Lake":"https://images.mindtrip.ai/attractions/7f1f/6177/6697/a047/21dd/8029/6a3b/c75b",
"Mysuru Railway Museum":"https://shop.museumsofindia.org/sites/default/files/2017-11/ES-506.jpg"
};
const iconPaths={compass:"M12 2l3.1 7.9L23 13l-7.9 3.1L12 24l-3.1-7.9L1 13l7.9-3.1L12 2z",pin:"M12 22s7-6.1 7-12a7 7 0 10-14 0c0 5.9 7 12 7 12z",spark:"M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z",arrow:"M5 12h13M13 6l6 6-6 6",calendar:"M5 4h14v16H5zM8 2v4M16 2v4M5 9h14",map:"M3 6l6-3 6 3 6-3v18l-6 3-6-3-6 3V6z",user:"M20 21a8 8 0 00-16 0M12 13a4 4 0 100-8 4 4 0 000 8z"};
function Icon({name,size=18}){return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[name]||iconPaths.spark}/></svg>}
function distanceKm(a,b,c,d){const R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,z=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return 2*R*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))}
function Recenter({center}){const map=useMap();useEffect(()=>map.setView(center,13),[map,center]);return null}
function placeImage(name,imageUrl,category=""){
  const raw=String(name||"").trim();
  // Prefer curated attraction photos, then a record's own photo, then a relevant category fallback.
  if(images[raw])return images[raw];
  for(const dict of Object.values(translations)){
    for(const [english,translated] of Object.entries(dict||{})){
      if(typeof translated==="string"&&translated===raw&&images[english])return images[english];
    }
  }
  if(typeof imageUrl==="string"&&/^https?:\/\//i.test(imageUrl))return imageUrl;
  const subject=(raw+" "+category).toLowerCase();
  if(/hill|mountain|nature|forest|lake|waterfall|garden|park|bird/.test(subject))return "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=85";
  if(/temple|palace|heritage|church|cathedral|museum|fort|monument|historic/.test(subject))return "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=85";
  if(/food|restaurant|cuisine|market|shopping|cafe/.test(subject))return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85";
  if(/beach|sea|coast|island/.test(subject))return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85";
  if(/event|festival|music|concert|parade|culture|dance|sport/.test(subject))return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85";
  return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85";
}

function placeImageStyle(name,imageUrl,category=""){
  const primary=placeImage(name,imageUrl,category);
  // CSS paints the second layer underneath the first, so it remains visible if
  // a remote attraction photo is unavailable or blocked by the browser.
  const fallback="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";
  return {backgroundImage:"url('"+primary+"'), url('"+fallback+"')"};
}

export default function App(){
const {pathname}=useLocation();const isAuthPage=pathname==="/login"||pathname==="/signup";
const[language,setLanguage]=useState(localStorage.getItem("language")||"English"),[theme,setTheme]=useState(localStorage.getItem("theme")==="dark"?"dark":"light"),[location,setLocation]=useState(()=>readStoredJson("location",defaultLocation)||defaultLocation),[live,setLive]=useState(false),[user,setUser]=useState(()=>readStoredJson("tmUser",null)),[places,setPlaces]=useState([]),[events,setEvents]=useState([]),[planner,setPlanner]=useState([]),[bookings,setBookings]=useState([]),[bookingEvent,setBookingEvent]=useState(null),[loading,setLoading]=useState(true),[locationQuery,setLocationQuery]=useState(""),[locationSuggestions,setLocationSuggestions]=useState([]),[searchingLocation,setSearchingLocation]=useState(false);
const t=translations[language]||translations.English;
useEffect(()=>{startWebsiteTranslator(language)},[language]);
const languageCodes={English:"en",Assamese:"as",Bengali:"bn",Bodo:"brx",Dogri:"doi",Gujarati:"gu",Hindi:"hi",Kannada:"kn",Kashmiri:"ks",Konkani:"kok",Maithili:"mai",Malayalam:"ml",Manipuri:"mni",Marathi:"mr",Nepali:"ne",Odia:"or",Punjabi:"pa",Sanskrit:"sa",Santali:"sat",Sindhi:"sd",Tamil:"ta",Telugu:"te",Urdu:"ur"};
function changeLanguage(next){setLanguage(next);localStorage.setItem("language",next)}
async function searchLocation(query=locationQuery){const value=query.trim();if(value.length<2)return;setSearchingLocation(true);try{const rows=await api.locationSearch(value);setLocationSuggestions(rows)}catch(e){alert(e.message)}finally{setSearchingLocation(false)}}
function chooseLocation(place){const next={lat:Number(place.lat),lng:Number(place.lng),label:place.label};setLocation(next);setLocationQuery(place.label.split(",").slice(0,2).join(", "));setLocationSuggestions([]);setLive(false)}
useEffect(()=>localStorage.setItem("theme",theme),[theme]);useEffect(()=>localStorage.setItem("location",JSON.stringify(location)),[location]);
useEffect(()=>{let active=true;setLoading(true);Promise.all([api.places({lat:location.lat,lng:location.lng,radius:200,languageCode:languageCodes[language]||"en"}),api.events({lat:location.lat,lng:location.lng,radius:10,live:false,locationLabel:location.label,language:languageCodes[language]||"en"})]).then(([p,e])=>{if(active){setPlaces(p.length?p:localPlaces);setEvents(e.length?e:localEvents)}}).catch(()=>{if(active){setPlaces(localPlaces.map(p=>({...p,distance:distanceKm(location.lat,location.lng,p.lat,p.lng)})));setEvents(localEvents.map(e=>({...e,distance:distanceKm(location.lat,location.lng,e.lat,e.lng)})))}}).finally(()=>active&&setLoading(false));return()=>{active=false}},[location.lat,location.lng,language]);
useEffect(()=>{if(!user)return;Promise.all([api.planner(),api.bookings()]).then(([p,b])=>{setPlanner(p.map(x=>({...x.item,type:x.type})));setBookings(b)}).catch(console.error)},[user]);
useEffect(()=>{const refresh=()=>api.events({lat:location.lat,lng:location.lng,radius:10,live:true,locationLabel:location.label,language:languageCodes[language]||"en"}).then(setEvents).catch(console.error);const id=setInterval(refresh,60000);return()=>clearInterval(id)},[location.lat,location.lng,location.label,language]);
useEffect(()=>{const token=localStorage.getItem("tmToken");if(token)api.me().then(x=>setUser(x.user)).catch(()=>{localStorage.removeItem("tmToken");localStorage.removeItem("tmUser");setUser(null)})},[]);
useEffect(()=>{if(!live||!navigator.geolocation)return;const id=navigator.geolocation.watchPosition(p=>setLocation({lat:p.coords.latitude,lng:p.coords.longitude,label:"Live location"}),()=>setLive(false),{enableHighAccuracy:true,maximumAge:5000,timeout:10000});return()=>navigator.geolocation.clearWatch(id)},[live]);
function startGps(){if(!navigator.geolocation)return alert("GPS is not supported by this browser.");navigator.geolocation.getCurrentPosition(p=>{setLocation({lat:p.coords.latitude,lng:p.coords.longitude,label:"Live location"});setLive(true)},()=>alert("Location permission was denied."))}
async function add(item,type){if(!user)return alert(t.loginRequired);try{await api.addPlanner(item,type);setPlanner(x=>x.some(i=>i.id===item.id&&i.type===type)?x:[...x,{...item,type}])}catch(e){alert(e.message)}}
async function remove(id,type){try{await api.removePlanner(type,id);setPlanner(x=>x.filter(i=>!(i.id===id&&i.type===type)))}catch(e){alert(e.message)}}
function logout(){localStorage.removeItem("tmToken");localStorage.removeItem("tmUser");setUser(null);setPlanner([]);setBookings([])}
async function saveBooking(item){try{const b=await api.createBooking(item);setBookings(x=>[b,...x]);setBookingEvent(null);alert(t.bookingSaved)}catch(e){alert(e.message)}}
function onAuth(result){localStorage.setItem("tmToken",result.token);localStorage.setItem("tmUser",JSON.stringify(result.user));setUser(result.user)}
return <div className={"app theme-"+theme}>{!isAuthPage&&<Header t={t} language={language} setLanguage={changeLanguage} theme={theme} setTheme={setTheme} user={user} logout={logout}/>}<Routes>
<Route path="/" element={<Home t={t} location={location} live={live} startGps={startGps} places={places}/>}/><Route path="/places" element={<Places t={t} location={location} live={live} startGps={startGps} add={add} places={places} loading={loading}/>}/><Route path="/events" element={<Events t={t} location={location} user={user} add={add} openBooking={setBookingEvent} events={events} loading={loading}/>}/><Route path="/ai" element={<Assistant t={t} location={location} language={language}/>}/><Route path="/planner" element={<Planner t={t} planner={planner} bookings={bookings} remove={remove}/>}/><Route path="/login" element={<Auth t={t} mode="login" onAuth={onAuth}/>}/><Route path="/signup" element={<Auth t={t} mode="signup" onAuth={onAuth}/>}/></Routes>{bookingEvent&&<BookingModal t={t} event={bookingEvent} user={user} close={()=>setBookingEvent(null)} save={saveBooking}/>}{!isAuthPage&&<footer><div><b>TravelMate</b><span>{t.footerTitle}</span></div><span>{t.footerTag}</span><span>© 2026 TravelMate</span></footer>}</div>
}

function Header({t,language,setLanguage,theme,setTheme,user,logout}){const nav=[["/",t.home],["/places",t.navExplore],["/events",t.navEvents],["/ai",t.navAssistant],["/planner",t.navPlanner]];return <header className="header"><Link className="brand" to="/"><span className="brand-mark">T</span><span>Travel<span>Mate</span></span></Link><nav className="main-nav">{nav.map(([path,label])=><NavLink key={path} to={path} end={path==="/"}>{label}</NavLink>)}</nav><div className="header-actions"><select className="language-select" aria-label="Language" value={language} onChange={e=>setLanguage(e.target.value)} data-no-translate>
<option value="English">English</option>
<option value="Assamese">Assamese</option>
<option value="Bengali">Bengali</option>
<option value="Bodo">Bodo</option>
<option value="Dogri">Dogri</option>
<option value="Gujarati">Gujarati</option>
<option value="Hindi">Hindi</option>
<option value="Kannada">Kannada</option>
<option value="Kashmiri">Kashmiri</option>
<option value="Konkani">Konkani</option>
<option value="Maithili">Maithili</option>
<option value="Malayalam">Malayalam</option>
<option value="Manipuri">Manipuri</option>
<option value="Marathi">Marathi</option>
<option value="Nepali">Nepali</option>
<option value="Odia">Odia</option>
<option value="Punjabi">Punjabi</option>
<option value="Sanskrit">Sanskrit</option>
<option value="Santali">Santali</option>
<option value="Sindhi">Sindhi</option>
<option value="Tamil">Tamil</option>
<option value="Telugu">Telugu</option>
<option value="Urdu">Urdu</option>
</select><button className="theme-button" aria-label="Toggle dark mode" onClick={()=>setTheme(theme==="light"?"dark":"light")}>🌙</button>{user?<div className="account-menu"><span className="avatar">{user.name?.charAt(0)?.toUpperCase()||"U"}</span><span className="account-name">{user.name}</span><button className="outline-button" onClick={logout}>{t.logout}</button></div>:<div className="auth-links"><Link className="outline-button" to="/login">{t.signIn}</Link><Link className="solid-button" to="/signup">{t.signUp}</Link></div>}</div></header>}

function Home({t,location,live,startGps,places}){const nav=useNavigate(),featured=places.slice(0,3);return <main><section className="hero-v2"><div className="hero-v2-copy"><div className="overline"><span></span>{t.heroOverline}</div><h1>{t.heroTitle}<br/><i>{t.heroTitleAccent}</i></h1><p>{t.heroText}</p><div className="hero-cta"><button className="solid-button large" onClick={()=>nav("/places")}>{t.startExploring} <Icon name="arrow"/></button><button className="outline-button large" onClick={startGps}><Icon name="pin"/> {t.useLocation}</button></div><div className="hero-location"><span className={live?"pulse":""}></span><b>{live?t.live:"Mysuru"}</b><small>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</small></div></div><div className="hero-collage"><div className="hero-main-image" style={placeImageStyle("Mysore Palace")}><span>01 / {t.heritageCategory}</span><b>Mysore Palace</b></div><div className="hero-side-image" style={placeImageStyle("Chamundi Hill")}><span>02 / {t.natureCategory}</span><b>Chamundi Hill</b></div><div className="hero-note"><strong>TravelMate</strong><span>{t.heroNote}</span></div></div></section><section className="stat-band"><div><strong>01</strong><span>{t.stat1}</span><small>{t.stat1a}</small></div><div><strong>02</strong><span>{t.stat2}</span><small>{t.stat2a}</small></div><div><strong>03</strong><span>{t.stat3}</span><small>{t.stat3a}</small></div><div><strong>04</strong><span>{t.stat4}</span><small>{t.stat4a}</small></div></section><section className="home-section"><div className="section-title"><div><span>{t.discoverFirst}</span><h2>{t.placesWorth}</h2></div><Link to="/places">{t.viewAll} <Icon name="arrow" size={15}/></Link></div><div className="feature-grid">{featured.length?featured.map((p,i)=><Link to="/places" className={"feature-card "+(i===0?"featured":"")} key={p.id} style={placeImageStyle(p.name,p.imageUrl,p.category)}><div className="feature-shade"></div><div className="feature-card-content"><small>{String(p.category).toUpperCase()}</small><h3>{p.name}</h3><span>{p.distance!==undefined?p.distance.toFixed(1)+" km away":t.nearby} <Icon name="arrow" size={14}/></span></div></Link>):<div className="loading-block">Loading destinations...</div>}</div></section><section className="manifesto"><div className="manifesto-number">TM</div><div><span>{t.idea}</span><h2>{t.lessSearch}<br/><em>{t.moreExperience}</em></h2></div><p>{t.manifesto}</p></section></main>}

function Places({t,location,live,startGps,add,places,loading}){const[radius,setRadius]=useState(10),[search,setSearch]=useState(""),[category,setCategory]=useState("All");const categories=["All",...new Set(places.map(p=>p.category).filter(Boolean))];const nearby=useMemo(()=>places.map(p=>({...p,distance:Number.isFinite(Number(p.distance))?Number(p.distance):distanceKm(location.lat,location.lng,Number(p.lat),Number(p.lng))})).filter(p=>Number.isFinite(p.distance)&&p.distance<=radius).filter(p=>String(p.name||"").toLowerCase().includes(search.toLowerCase())).filter(p=>category==="All"||p.category===category).sort((a,b)=>a.distance-b.distance),[places,location,radius,search,category]);return <main className="page-v2"><div className="page-intro"><div><span>01 / {t.navExplore.toUpperCase()}</span><h2>{t.findYour}<br/><em>{t.nextPlace}</em></h2><p>{t.placesIntro}</p></div><div className="intro-side"><b>{nearby.length}</b><span>{t.destinations}<br/>{t.inRange}</span></div></div><div className="explore-toolbar"><div className="search-field"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}/></div><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x} value={x}>{x==="All"?(t.all||x):x}</option>)}</select><select value={radius} onChange={e=>setRadius(+e.target.value)}>{radii.map(x=><option key={x} value={x}>{x<1?x*1000+" m":x+" km"}</option>)}</select><button className="outline-button" onClick={startGps}><Icon name="pin"/> {live?t.locationOn:t.useGps}</button></div><div className="explore-layout"><div className="map-shell"><MapContainer className="map-v2" center={[location.lat,location.lng]} zoom={13}><Recenter center={[location.lat,location.lng]}/><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Circle center={[location.lat,location.lng]} radius={radius*1000}/>{nearby.filter(p=>Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))).map(p=><Marker key={p.id} position={[Number(p.lat),Number(p.lng)]}/>)}</MapContainer><div className="map-caption"><span><i></i> {t.searchRadius}</span><span>{location.label}</span></div></div><div className="destination-list">{loading?<div className="loading-block">Loading destinations...</div>:nearby.length?nearby.map((p,index)=><DestinationCard key={p.id} p={p} index={index} add={add} t={t}/>):<div className="empty-v2">{t.noPlaces}</div>}</div></div></main>}

function DestinationCard({p,index,add,t}){return <article className="destination-card"><div className="destination-image" style={{backgroundImage:"url("+placeImage(p.name,p.imageUrl,p.category)+")"}}><span>0{index+1}</span><b>{p.distance.toFixed(1)} km</b></div><div className="destination-body"><div><small>{String(p.category).toUpperCase()}</small><h3>{p.name}</h3></div><p>{p.description}</p><div className="destination-footer"><span>{t.rating} {p.rating}</span><span>{p.price===0?t.free:"₹"+p.price}</span><button onClick={()=>add(p,"place")}>{t.add} <Icon name="arrow" size={13}/></button>{p.websiteUrl&&<a className="place-book-link" href={p.websiteUrl} target="_blank" rel="noreferrer">{t.visitBook}</a>}</div></div></article>}

function Events({t,location,user,add,openBooking,events,loading}){const[radius,setRadius]=useState(5);const near=events.map(e=>({...e,distance:Number.isFinite(Number(e.distance))?Number(e.distance):distanceKm(location.lat,location.lng,Number(e.lat),Number(e.lng))})).filter(e=>Number.isFinite(e.distance)&&e.distance<=radius).sort((a,b)=>a.distance-b.distance);return <main className="page-v2"><div className="page-intro"><div><span>02 / {t.navEvents.toUpperCase()}</span><h2>{t.eventsTitle}<br/><em>{t.aroundYou}</em></h2><p>{t.eventsIntro}</p></div><div className="intro-side"><b>{near.length}</b><span>{t.mysuruListings}</span></div></div><div className="events-toolbar"><span className="live-now"><i></i> {t.mysuruListings}</span><span>{t.searchRadius}</span>{eventRadii.map(r=><button key={r} className={radius===r?"selected":""} onClick={()=>setRadius(r)}>{r<1?r*1000+" m":r+" km"}</button>)}</div><div className="event-grid">{loading?<div className="loading-block">{t.loading}</div>:near.length?near.map((e,i)=><article className="event-card-v2" key={e.id}><div className="event-index">0{i+1}</div><div className="event-date"><span>{String(e.date||"").slice(0,3).toUpperCase()}</span><b>{String(e.date||"").slice(-2)}</b></div><div className="event-image" role="img" aria-label={e.name} style={placeImageStyle(e.name,e.imageUrl,e.category)}/><div className="event-copy"><small>{e.category||"MYSURU EVENT"} / {e.venue} / {e.distance.toFixed(1)} KM</small><h3>{e.name}</h3><p>{e.description}</p><div><span>{e.time||"See listing"}</span><span>{e.price===0?"Free":e.price?"₹"+e.price:"See listing"}</span><span>{e.bookable?"Booking available":"Event details"}</span></div></div><div className="event-actions"><button className="solid-button" onClick={()=>user?openBooking(e):alert(t.loginRequired)}>Book on TravelMate</button><button className="outline-button" onClick={()=>add(e,"event")}>{t.save||"Save"}</button>{e.sourceUrl&&<a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">Official booking / details <Icon name="arrow" size={13}/></a>}</div></article>):<div className="empty-v2">{t.noEvents}</div>}</div></main>}

function BookingModal({t,event,user,close,save}){const[tickets,setTickets]=useState(1),[name,setName]=useState(user?.name||""),[email,setEmail]=useState(user?.email||"");const total=tickets*event.price;function submit(e){e.preventDefault();save({eventId:event.id,eventName:event.name,date:event.date,time:event.time,venue:event.venue,tickets,total,name,email,sourceUrl:event.sourceUrl})}return <div className="overlay"><div className="modal-v2"><button className="modal-close" onClick={close}>×</button><div className="modal-kicker">TRAVELMATE / BOOKING</div><h2>{event.name}</h2><p>{event.venue} · {event.date} · {event.time}</p><form onSubmit={submit}><label>{t.name}<input required value={name} onChange={e=>setName(e.target.value)}/></label><label>{t.email}<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>{t.tickets}<input type="number" min="1" max={Number(event.seats)>0?event.seats:undefined} value={tickets} onChange={e=>setTickets(Math.max(1,Number(e.target.value)||1))}/></label><div className="modal-total"><span>Total</span><b>₹{total}</b></div><p className="booking-note">Your booking request will be saved in your TravelMate account. Ticket issuance and online payment are not connected yet.</p><button className="solid-button large" type="submit">{t.confirm}</button>{event.sourceUrl&&<a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">Visit official government booking / details <Icon name="arrow" size={14}/></a>}</form></div></div>}

function Assistant({t,location,language}){
const[q,setQ]=useState(""),[messages,setMessages]=useState([{role:"ai",text:t.aiWelcome}]),[results,setResults]=useState([]),[busy,setBusy]=useState(false),[provider,setProvider]=useState("");
async function ask(value=q){
  const prompt=String(value||"").trim();
  if(!prompt||busy)return;
  const previous=messages.filter(m=>m.role==="user"||m.role==="ai").slice(-8).map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text}));
  setMessages(x=>[...x,{role:"user",text:prompt}]);
  setQ("");setBusy(true);setProvider("");setResults([]);
  try{
    const response=await api.assistant(prompt,location,language,previous);
    setMessages(x=>[...x,{role:"ai",text:response.answer||"I couldn't prepare an answer. Please try again."}]);
    setResults(Array.isArray(response.items)?response.items:[]);
    setProvider(response.provider||"TravelMate AI");
  }catch(error){
    setMessages(x=>[...x,{role:"ai",text:"I couldn't connect to the TravelMate assistant. Check that the backend is running, then try again. Details: "+error.message}]);
    setProvider("connection issue");
  }finally{setBusy(false)}
}
function resetChat(){setMessages([{role:"ai",text:t.aiWelcome}]);setResults([]);setProvider("");setQ("")}
const suggestions=[t.nearQuestion,t.eventQuestion,t.planQuestion,t.bookingQuestion,"Find nature and food experiences"];
return <main className="page-v2 ai-page">
  <div className="ai-header">
    <div className="ai-heading-copy"><span>03 / AI ASSISTANT</span><h2>{t.aiTitle}<br/><em>{t.aiAccent}</em></h2><p>{t.aiIntro}</p><small className="ai-provider-note"><i/> TravelMate destination guide · {location.label} · {language}</small></div>
    <div className="ai-visual" aria-label="Travel inspiration photographs">
      <div className="ai-visual-main"><img src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=85" alt="Indian heritage architecture" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=900&q=80"}}/><span>DESTINATIONS</span></div>
      <div className="ai-visual-side"><div><img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=85" alt="Nature travel landscape" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=500&q=80"}}/><span>NATURE</span></div><div><img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=500&q=85" alt="Cultural event lights" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80"}}/><span>EVENTS</span></div></div>
    </div>
  </div>
  <section className="ai-prompt-section"><div className="ai-section-heading"><div><span>PLAN WITH A LITTLE HELP</span><h3>What would you like to discover?</h3></div><small>Choose a suggestion or ask your own question</small></div><div className="suggestions">{suggestions.map((s,i)=><button key={s} onClick={()=>ask(s)} disabled={busy}><span className="suggestion-number">0{i+1}</span>{s}<Icon name="arrow" size={13}/></button>)}</div></section>
  <div className="chat-v2">
    <div className="chat-top"><div><span className="chat-live-dot"/><b>{t.conversation}</b><small>{t.locationContext}: {location.label}</small></div><button className="chat-reset" onClick={resetChat} disabled={busy}>New conversation ↺</button></div>
    <div className="messages-v2" aria-live="polite">{messages.map((m,i)=><div className={"chat-message "+m.role} key={i}><span>{m.role==="ai"?"TRAVELMATE":"YOU"}</span><p>{m.text}</p></div>)}{busy&&<div className="chat-message ai"><span>TRAVELMATE</span><p>Thinking…</p></div>}</div>
    <div className="chat-compose"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!busy&&ask()} placeholder={t.aiPlaceholder} disabled={busy} aria-label={t.aiPlaceholder}/><button className="solid-button" onClick={()=>ask()} disabled={busy||!q.trim()}>{busy?"Thinking…":t.askTravelMate}<Icon name="arrow" size={14}/></button></div>
    <div className="ai-compose-hint">Ask about nearby attractions, events, food, transport, budgets or day-by-day itineraries.</div>
    {provider&&<div className="ai-provider-status">Response source: {provider}</div>}
  </div>
  {results.length>0&&<section className="ai-results"><div className="subhead"><h3>{t.aiResults}</h3><span>{results.length}</span></div><div className="feature-grid">{results.map((p,i)=><article className="feature-card" key={p.id||p.name||i} style={placeImageStyle(p.name||p.eventName,p.imageUrl,p.category||p.type)}><div className="feature-shade"/><div className="feature-card-content"><small>{String(p.category||p.type||"TRAVELMATE").toUpperCase()}</small><h3>{p.name||p.eventName}</h3><span>{p.distance!==undefined&&Number.isFinite(Number(p.distance))?Number(p.distance).toFixed(1)+" km":p.venue||""}</span></div></article>)}</div></section>}
</main>
}

function Planner({t,planner,bookings,remove}){return <main className="page-v2"><div className="page-intro"><div><span>04 / {t.navPlanner.toUpperCase()}</span><h2>{t.yourTrip}<br/><em>{t.yourWay}</em></h2><p>{t.plannerIntro}</p></div><div className="intro-side"><b>{planner.length}</b><span>{t.saved}<br/>{t.items}</span></div></div><div className="planner-layout"><section><div className="subhead"><h3>{t.savedJourney}</h3><span>{planner.length} {t.items}</span></div>{planner.length?planner.map((x,i)=><article className="planner-card" key={x.type+x.id}><span className="planner-number">0{i+1}</span><div><small>{x.type}</small><h3>{x.name}</h3><p>{x.description}</p></div><button onClick={()=>remove(x.id,x.type)}>{t.remove}</button></article>):<div className="empty-v2">{t.emptyPlanner}</div>}</section><aside className="booking-panel"><div className="subhead"><h3>{t.bookings}</h3><span>{bookings.length}</span></div>{bookings.length?bookings.map(b=><div className="booking-item" key={b.id}><span>{b.date}</span><b>{b.eventName}</b><small>{b.tickets} tickets · ₹{b.total}</small></div>):<p>{t.noBookings}</p>}</aside></div></main>}

function Auth({t,mode,onAuth}){const nav=useNavigate(),[form,setForm]=useState({name:"",email:"",password:"",confirm:""}),[busy,setBusy]=useState(false);async function submit(e){e.preventDefault();if(mode==="signup"&&form.password!==form.confirm)return alert("Passwords do not match.");setBusy(true);try{const result=mode==="signup"?await api.signup(form):await api.login(form);onAuth(result);nav("/")}catch(err){alert(err.message)}finally{setBusy(false)}}const signingUp=mode==="signup";return <main className="auth-page-v2"><section className="auth-panel"><form className="auth-form" onSubmit={submit}><div className="auth-switch"><Link className={!signingUp?"active":""} to="/login">Sign In</Link><Link className={signingUp?"active":""} to="/signup">Sign Up</Link></div><p className="auth-kicker">{signingUp?"JOIN TRAVELMATE":"WELCOME BACK"}</p><h2>{signingUp?"Create your account":"Welcome back"}</h2><p className="auth-intro">{signingUp?"Create an account to save places and plan your next trip.":"Sign in to continue planning your next trip."}</p>{signingUp&&<label>{t.name}<input autoComplete="name" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}<label>{t.email}<input autoComplete="email" required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>{t.password}<input autoComplete={signingUp?"new-password":"current-password"} required minLength="6" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>{signingUp&&<label>{t.confirmPassword}<input autoComplete="new-password" required minLength="6" type="password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})}/></label>}<button className="solid-button large" disabled={busy}>{busy?"Please wait...":signingUp?"Create Account":"Sign In"}</button></form></section></main>}
