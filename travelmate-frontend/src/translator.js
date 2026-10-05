import{api}from"./api";

const attributeNames=["placeholder","title","aria-label"];
const textOriginals=new Map();
const attributeOriginals=new Map();
const clientCache=new Map();
let observer=null;
let currentLanguage="English";
let translating=false;
let scheduled=null;

function isIgnored(node){
  const el=node.nodeType===Node.ELEMENT_NODE?node:node.parentElement;
  if(!el)return true;
  return Boolean(el.closest("script,style,noscript,svg,[data-no-translate],.language-select"));
}

function collect(){
  const texts=[];
  const nodes=[];
  const root=document.getElementById("root")||document.body;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;
  while(node=walker.nextNode()){
    const value=node.nodeValue?.replace(/\s+/g," ").trim();
    if(!value||isIgnored(node)||value.length<2)continue;
    if(!textOriginals.has(node))textOriginals.set(node,node.nodeValue);
    const source=textOriginals.get(node);
    if(source?.trim()){nodes.push(node);texts.push(source.replace(/\s+/g," ").trim());}
  }
  root.querySelectorAll?.("[placeholder],[title],[aria-label]").forEach(el=>{
    if(isIgnored(el))return;
    if(!attributeOriginals.has(el))attributeOriginals.set(el,{});
    for(const name of attributeNames){
      const value=el.getAttribute(name);
      if(!value)continue;
      const record=attributeOriginals.get(el);
      if(record[name]===undefined)record[name]=value;
    }
  });
  return{nodes,texts};
}

function allAttributeEntries(){
  const entries=[];
  for(const [el,attrs] of attributeOriginals){
    if(!el.isConnected)continue;
    for(const [name,value] of Object.entries(attrs))entries.push({el,name,value});
  }
  return entries;
}

async function translateUnique(values,target){
  const result=new Map(),missing=[];
  for(const value of [...new Set(values)]){
    const key=target+"::"+value;
    if(clientCache.has(key))result.set(value,clientCache.get(key));else missing.push(value);
  }
  for(let i=0;i<missing.length;i+=128){
    const batch=missing.slice(i,i+128);
    const response=await api.translate(batch,target);
    batch.forEach((source,index)=>{
      const translated=response.translations?.[index]||source;
      clientCache.set(target+"::"+source,translated);
      result.set(source,translated);
    });
  }
  return result;
}

async function applyTranslation(){
  if(currentLanguage==="English")return;
  translating=true;
  const{nodes,texts}=collect();
  const attrs=allAttributeEntries();
  const values=[...texts,...attrs.map(x=>x.value)].filter(Boolean);
  if(!values.length)return;
  const map=await translateUnique(values,currentLanguage);
  nodes.forEach((node,index)=>{
    const source=texts[index];
    if(node.isConnected)node.nodeValue=map.get(source)||source;
  });
  attrs.forEach(({el,name,value})=>{if(el.isConnected)el.setAttribute(name,map.get(value)||value)});
  translating=false;
}

function scheduleTranslation(){
  clearTimeout(scheduled);
  scheduled=setTimeout(()=>applyTranslation().catch(console.error),250);
}

function restoreEnglish(){
  for(const[node,source]of textOriginals)if(node.isConnected)node.nodeValue=source;
  for(const[el,attrs]of attributeOriginals)if(el.isConnected)for(const[name,value]of Object.entries(attrs))el.setAttribute(name,value);
}

export async function setWebsiteLanguage(language){
  currentLanguage=language||"English";
  document.documentElement.lang=currentLanguage==="English"?"en":String(currentLanguage).slice(0,2).toLowerCase();
  if(observer)observer.disconnect();
  if(currentLanguage==="English"){
    restoreEnglish();
  }else{
    await applyTranslation();
    observer=new MutationObserver(()=>{if(!translating)scheduleTranslation()});
    observer.observe(document.getElementById("root")||document.body,{subtree:true,childList:true});
  }
}

export function startWebsiteTranslator(language){
  currentLanguage=language||"English";
  setWebsiteLanguage(currentLanguage).catch(console.error);
}
