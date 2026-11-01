const API_BASE=import.meta.env.VITE_API_URL||(window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"?"http://localhost:5000/api":"/api");
async function request(path,options={}){const token=localStorage.getItem("tmToken");const r=await fetch(API_BASE+path,{...options,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{}),...(options.headers||{})}});const body=await r.json().catch(()=>({}));if(!r.ok)throw new Error(body.message||body.error||body.detail||"Request failed.");return body}
export const api={
 signup:p=>request("/auth/signup",{method:"POST",body:JSON.stringify(p)}),
 login:p=>request("/auth/login",{method:"POST",body:JSON.stringify(p)}),
 me:()=>request("/auth/me"),
 locationSearch:q=>request("/location/search?q="+encodeURIComponent(q)),
 places:(p={})=>request("/places?lat="+p.lat+"&lng="+p.lng+"&radius="+(p.radius||200)+(p.search?"&search="+encodeURIComponent(p.search):"")+(p.category?"&category="+encodeURIComponent(p.category):"")+(p.languageCode?"&languageCode="+encodeURIComponent(p.languageCode):"")),
 events:(p={})=>request("/events?lat="+p.lat+"&lng="+p.lng+"&radius="+(p.radius||200)+(p.search?"&search="+encodeURIComponent(p.search):"")+(p.live?"&live=true":"")+(p.locationLabel?"&locationLabel="+encodeURIComponent(p.locationLabel):"")+(p.language?"&language="+encodeURIComponent(p.language):"")),
 planner:()=>request("/planner"),
 addPlanner:(item,type)=>request("/planner",{method:"POST",body:JSON.stringify({item,type})}),
 removePlanner:(type,id)=>request("/planner/"+encodeURIComponent(type)+"/"+encodeURIComponent(id),{method:"DELETE"}),
 bookings:()=>request("/bookings"),
 createBooking:p=>request("/bookings",{method:"POST",body:JSON.stringify(p)}),
 assistant:(question,location,language="English",history=[])=>request("/assistant",{method:"POST",body:JSON.stringify({question,lat:location?.lat,lng:location?.lng,location:location?.label||"Mysuru",language,history})}),
 translateBatch:(texts,targetLanguage)=>request("/translate",{method:"POST",body:JSON.stringify({texts,targetLanguage})}),
};