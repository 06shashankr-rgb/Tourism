import{translations}from"./translations";

const attributeNames=["placeholder","title","aria-label"];
const originalText=new Map();
const originalAttrs=new Map();
let observer=null;
let currentLanguage="English";
let applying=false;
let timer=null;

function ignored(node){
  const el=node.nodeType===Node.ELEMENT_NODE?node:node.parentElement;
  return !el||Boolean(el.closest("script,style,noscript,svg,[data-no-translate],.language-select"));
}

function normalize(value){
  return String(value||"").replace(/\s+/g," ").trim();
}

function buildMap(language){
  const source=translations.English||{};
  const target=translations[language]||source;
  const map=new Map();
  Object.keys(source).forEach(key=>{
    if(source[key]&&target[key]&&source[key]!==target[key])map.set(normalize(source[key]),target[key]);
  });
  return map;
}

function restore(){
  for(const[node,value]of originalText)if(node.isConnected)node.nodeValue=value;
  for(const[el,attrs]of originalAttrs)if(el.isConnected)Object.entries(attrs).forEach(([name,value])=>el.setAttribute(name,value));
}

function apply(){
  if(currentLanguage==="English"){restore();return}
  applying=true;
  const map=buildMap(currentLanguage);
  const root=document.getElementById("root")||document.body;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;
  while(node=walker.nextNode()){
    if(ignored(node))continue;
    const value=normalize(node.nodeValue);
    if(!value||value.length<2)continue;
    if(!originalText.has(node))originalText.set(node,node.nodeValue);
    const source=normalize(originalText.get(node));
    const translated=map.get(source);
    if(translated)node.nodeValue=node.nodeValue.replace(source,translated);
  }
  root.querySelectorAll?.("[placeholder],[title],[aria-label]").forEach(el=>{
    if(ignored(el))return;
    if(!originalAttrs.has(el))originalAttrs.set(el,{});
    const record=originalAttrs.get(el);
    attributeNames.forEach(name=>{
      const value=el.getAttribute(name);
      if(value!==null&&record[name]===undefined)record[name]=value;
      const source=record[name];
      const translated=source&&map.get(normalize(source));
      if(translated)el.setAttribute(name,translated);
    });
  });
  applying=false;
}

function schedule(){
  clearTimeout(timer);
  timer=setTimeout(()=>apply(),80);
}

export function setWebsiteLanguage(language){
  currentLanguage=translations[language]?language:"English";
  document.documentElement.lang=currentLanguage==="English"?"en":({Kannada:"kn",Hindi:"hi",Tamil:"ta",Telugu:"te"}[currentLanguage]||"en");
  if(observer)observer.disconnect();
  apply();
  observer=new MutationObserver(()=>{if(!applying)schedule()});
  observer.observe(document.getElementById("root")||document.body,{subtree:true,childList:true});
}

export function startWebsiteTranslator(language){
  setWebsiteLanguage(language);
}
