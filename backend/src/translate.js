const GOOGLE_TRANSLATE_URL="https://translation.googleapis.com/language/translate/v2";

const supportedLanguages={
  English:"en",Assamese:"as",Bengali:"bn",Bhojpuri:"bho",Gujarati:"gu",Hindi:"hi",
  Kannada:"kn",Malayalam:"ml",Marathi:"mr",Maithili:"mai",Manipuri:"mni-Mtei",
  Mizo:"lus",Nepali:"ne",Odia:"or",Punjabi:"pa",Sanskrit:"sa",Tamil:"ta",Telugu:"te",Urdu:"ur"
};

const cache=new Map();

export function translationLanguageCode(language){
  return supportedLanguages[language]||language;
}

export function isTranslationConfigured(){
  return Boolean(process.env.GOOGLE_TRANSLATE_API_KEY);
}

async function translateBatch(texts,target){
  if(!texts.length||target==="en")return texts;
  const key=process.env.GOOGLE_TRANSLATE_API_KEY;
  if(!key)throw new Error("Google Cloud Translation is not configured. Add GOOGLE_TRANSLATE_API_KEY to the backend environment.");
  const response=await fetch(GOOGLE_TRANSLATE_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json","X-Goog-Api-Key":key},
    body:JSON.stringify({q:texts,source:"en",target,format:"text"})
  });
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(body?.error?.message||"Google Translation request failed.");
  return (body.data?.translations||[]).map(x=>x.translatedText);
}

export async function translateTexts(texts,targetLanguage){
  const target=translationLanguageCode(targetLanguage);
  if(target==="en")return texts;
  const unique=[...new Set(texts.map(x=>String(x)).filter(Boolean))];
  const output=new Map();
  const missing=[];
  for(const text of unique){
    const k=target+"::"+text;
    if(cache.has(k))output.set(text,cache.get(k));else missing.push(text);
  }
  for(let i=0;i<missing.length;i+=128){
    const batch=missing.slice(i,i+128);
    const translated=await translateBatch(batch,target);
    batch.forEach((source,index)=>{
      const value=translated[index]||source;
      cache.set(target+"::"+source,value);
      output.set(source,value);
    });
  }
  return texts.map(text=>output.get(String(text))||String(text));
}

export {supportedLanguages};
