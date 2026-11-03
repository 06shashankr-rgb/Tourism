import { translations } from "./translations";
import { api } from "./api";

const attributeNames = ["placeholder", "title", "aria-label", "alt"];
const originalText = new WeakMap();
const originalAttrs = new WeakMap();
const remoteCache = new Map();
const pendingKeys = new Set();
const failedLanguages = new Set();
let observer = null;
let currentLanguage = "English";
let applying = false;
let timer = null;
let translating = false;
let warned = false;

const languageCodes = {
  English: "en", Assamese: "as", Bengali: "bn", Bodo: "brx",
  Dogri: "doi", Gujarati: "gu", Hindi: "hi", Kannada: "kn",
  Kashmiri: "ks", Konkani: "kok", Maithili: "mai", Malayalam: "ml",
  Manipuri: "mni", Marathi: "mr", Nepali: "ne", Odia: "or",
  Punjabi: "pa", Sanskrit: "sa", Santali: "sat", Sindhi: "sd",
  Tamil: "ta", Telugu: "te", Urdu: "ur"
};

const indicTargets = {
  Assamese: "asm_Beng", Bengali: "ben_Beng", Bodo: "brx_Deva",
  Dogri: "doi_Deva", Gujarati: "guj_Gujr", Hindi: "hin_Deva",
  Kannada: "kan_Knda", Kashmiri: "kas_Arab", Konkani: "gom_Deva",
  Maithili: "mai_Deva", Malayalam: "mal_Mlym", Manipuri: "mni_Mtei",
  Marathi: "mar_Deva", Nepali: "npi_Deva", Odia: "ory_Orya",
  Punjabi: "pan_Guru", Sanskrit: "san_Deva", Santali: "sat_Olck",
  Sindhi: "snd_Arab", Tamil: "tam_Taml", Telugu: "tel_Telu",
  Urdu: "urd_Arab"
};

function normalize(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function isIgnored(node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return !element || Boolean(element.closest(
    "script,style,noscript,svg,[data-no-translate],.language-select"
  ));
}

function localMap(language) {
  const source = translations.English || {};
  const target = translations[language] || source;
  const map = new Map();
  Object.keys(source).forEach((key) => {
    const english = source[key];
    const translated = target[key];
    if (typeof english === "string" && typeof translated === "string" &&
        english.trim() && translated.trim() && english !== translated) {
      map.set(normalize(english), translated);
    }
  });
  return map;
}

function activeMap() {
  const map = localMap(currentLanguage);
  const prefix = currentLanguage + "::";
  remoteCache.forEach((value, key) => {
    if (key.startsWith(prefix)) map.set(key.slice(prefix.length), value);
  });
  return map;
}

function rememberNode(node) {
  if (!originalText.has(node)) originalText.set(node, node.nodeValue || "");
  return originalText.get(node);
}

function apply() {
  const root = document.getElementById("root") || document.body;
  if (!root) return;
  applying = true;
  try {
    const map = activeMap();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (isIgnored(node)) continue;
      const original = rememberNode(node);
      const source = normalize(original);
      if (!source) continue;
      if (currentLanguage === "English") node.nodeValue = original;
      else {
        const translated = map.get(source);
        node.nodeValue = translated ? original.replace(source, translated) : original;
      }
    }

    root.querySelectorAll("[placeholder],[title],[aria-label],[alt]").forEach((element) => {
      if (isIgnored(element)) return;
      if (!originalAttrs.has(element)) originalAttrs.set(element, {});
      const record = originalAttrs.get(element);
      attributeNames.forEach((name) => {
        const value = element.getAttribute(name);
        if (value !== null && record[name] === undefined) record[name] = value;
        if (record[name] === undefined) return;
        const original = record[name];
        const translated = currentLanguage === "English" ? undefined : map.get(normalize(original));
        element.setAttribute(name, translated || original);
      });
    });
  } finally {
    applying = false;
  }
}

function splitForTranslation(value, limit = 1000) {
  const parts = [];
  let rest = value;
  while (rest.length > limit) {
    let cut = rest.lastIndexOf(" ", limit);
    if (cut < Math.floor(limit * 0.6)) cut = limit;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

function collectUntranslated() {
  if (currentLanguage === "English") return [];
  const root = document.getElementById("root") || document.body;
  const local = localMap(currentLanguage);
  const found = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (isIgnored(node)) continue;
    const original = rememberNode(node);
    const text = normalize(original);
    if (text.length < 2 || local.has(text)) continue;
    const key = currentLanguage + "::" + text;
    if (!remoteCache.has(key) && !pendingKeys.has(key)) found.add(text);
  }

  root.querySelectorAll("[placeholder],[title],[aria-label],[alt]").forEach((element) => {
    if (isIgnored(element)) return;
    if (!originalAttrs.has(element)) originalAttrs.set(element, {});
    const record = originalAttrs.get(element);
    attributeNames.forEach((name) => {
      const value = element.getAttribute(name);
      if (value !== null && record[name] === undefined) record[name] = value;
      const text = normalize(record[name]);
      if (text.length < 2 || local.has(text)) return;
      const key = currentLanguage + "::" + text;
      if (!remoteCache.has(key) && !pendingKeys.has(key)) found.add(text);
    });
  });
  return [...found];
}

async function translateRemaining() {
  if (translating || currentLanguage === "English" || failedLanguages.has(currentLanguage)) return;
  const language = currentLanguage;
  const targetLanguage = indicTargets[language];
  if (!targetLanguage) return;
  translating = true;
  try {
    // Process batches in small groups to avoid sending the full page repeatedly.
    while (language === currentLanguage) {
      const texts = collectUntranslated().slice(0, 5);
      if (!texts.length) break;
      const jobs = texts.map(text => ({ text, parts: splitForTranslation(text) }));
      const batch = jobs.flatMap(job => job.parts);
      texts.forEach(text => pendingKeys.add(language + "::" + text));
      try {
        const response = await api.translateBatch(batch, targetLanguage);
        const translated = Array.isArray(response.translations) ? response.translations : [];
        if (translated.length !== batch.length) {
          throw new Error("Translation service returned a different number of results than requested.");
        }
        let offset = 0;
        jobs.forEach(job => {
          const pieces = translated.slice(offset, offset + job.parts.length);
          offset += job.parts.length;
          if (pieces.every(value => typeof value === "string" && value.trim())) {
            remoteCache.set(language + "::" + job.text, pieces.join(" "));
          }
          pendingKeys.delete(language + "::" + job.text);
        });
        if (language === currentLanguage) apply();
      } catch (error) {
        texts.forEach(text => pendingKeys.delete(language + "::" + text));
        failedLanguages.add(language);
        if (!warned) {
          console.warn("TravelMate IndicTrans2 translation failed:", error.message);
          warned = true;
        }
        break;
      }
    }
  } finally {
    translating = false;
    if (language !== currentLanguage) translateRemaining();
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    apply();
    translateRemaining();
  }, 180);
}

export function setWebsiteLanguage(language) {
  currentLanguage = languageCodes[language] ? language : "English";
  failedLanguages.delete(currentLanguage);
  document.documentElement.lang = languageCodes[currentLanguage] || "en";
  if (observer) observer.disconnect();
  apply();
  const root = document.getElementById("root") || document.body;
  observer = new MutationObserver(() => {
    if (!applying) schedule();
  });
  observer.observe(root, { subtree: true, childList: true, characterData: true });
  translateRemaining();
}

export function startWebsiteTranslator(language) {
  setWebsiteLanguage(language);
}
