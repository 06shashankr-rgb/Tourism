import { translations } from "./translations";
import { api } from "./api";

const attributeNames = ["placeholder", "title", "aria-label", "alt"];
const originalText = new WeakMap();
const originalAttrs = new WeakMap();
const remoteCache = new Map();
const pending = new Set();
const retryCount = new Map();
let observer;
let currentLanguage = "English";
let applying = false;
let timer;
let retryTimer;
let translating = false;

const languageCodes = {
  English:"en", Assamese:"as", Bengali:"bn", Bodo:"brx", Dogri:"doi",
  Gujarati:"gu", Hindi:"hi", Kannada:"kn", Kashmiri:"ks", Konkani:"kok",
  Maithili:"mai", Malayalam:"ml", Manipuri:"mni", Marathi:"mr", Nepali:"ne",
  Odia:"or", Punjabi:"pa", Sanskrit:"sa", Santali:"sat", Sindhi:"sd",
  Tamil:"ta", Telugu:"te", Urdu:"ur"
};
const indicTargets = {
  Assamese:"asm_Beng", Bengali:"ben_Beng", Bodo:"brx_Deva", Dogri:"doi_Deva",
  Gujarati:"guj_Gujr", Hindi:"hin_Deva", Kannada:"kan_Knda", Kashmiri:"kas_Arab",
  Konkani:"gom_Deva", Maithili:"mai_Deva", Malayalam:"mal_Mlym", Manipuri:"mni_Mtei",
  Marathi:"mar_Deva", Nepali:"npi_Deva", Odia:"ory_Orya", Punjabi:"pan_Guru",
  Sanskrit:"san_Deva", Santali:"sat_Olck", Sindhi:"snd_Arab", Tamil:"tam_Taml",
  Telugu:"tel_Telu", Urdu:"urd_Arab"
};

const normalize = value => String(value ?? "").replace(/\\s+/g, " ").trim();
const keyFor = text => currentLanguage + "::" + normalize(text);

function ignored(node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return !element || Boolean(element.closest(
    "script,style,noscript,svg,[data-no-translate],.language-select,[contenteditable='true']"
  ));
}
function rememberText(node) {
  if (!originalText.has(node)) originalText.set(node, node.nodeValue || "");
  return originalText.get(node);
}
function rememberAttrs(element) {
  if (!originalAttrs.has(element)) originalAttrs.set(element, {});
  const record = originalAttrs.get(element);
  attributeNames.forEach(name => {
    const value = element.getAttribute(name);
    if (value !== null && record[name] === undefined) record[name] = value;
  });
  return record;
}
function localMap(language) {
  const source = translations.English || {};
  const target = translations[language] || source;
  const map = new Map();
  Object.keys(source).forEach(key => {
    const from = source[key], to = target[key];
    if (typeof from === "string" && typeof to === "string" && from.trim() && to.trim() && from !== to) {
      map.set(normalize(from), to);
    }
  });
  return map;
}
function translationMap(language) {
  const map = localMap(language), prefix = language + "::";
  remoteCache.forEach((value, key) => {
    if (key.startsWith(prefix)) map.set(key.slice(prefix.length), value);
  });
  return map;
}
function apply() {
  const root = document.getElementById("root") || document.body;
  if (!root) return;
  applying = true;
  try {
    const map = translationMap(currentLanguage);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (ignored(node)) continue;
      const original = rememberText(node);
      const normalized = normalize(original);
      if (!normalized) continue;
      const translated = currentLanguage === "English" ? null : map.get(normalized);
      node.nodeValue = translated ? original.replace(normalized, translated) : original;
    }
    root.querySelectorAll("[placeholder],[title],[aria-label],[alt]").forEach(element => {
      if (ignored(element)) return;
      const record = rememberAttrs(element);
      attributeNames.forEach(name => {
        if (record[name] === undefined) return;
        const original = record[name];
        const translated = currentLanguage === "English" ? null : map.get(normalize(original));
        element.setAttribute(name, translated || original);
      });
    });
  } finally {
    applying = false;
  }
}
function collectMissing() {
  const root = document.getElementById("root") || document.body;
  const local = localMap(currentLanguage), missing = new Set();
  const add = value => {
    const text = normalize(value);
    if (text.length < 2 || local.has(text)) return;
    const key = currentLanguage + "::" + text;
    if (!remoteCache.has(key) && !pending.has(key)) missing.add(text);
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) if (!ignored(node)) add(rememberText(node));
  root.querySelectorAll("[placeholder],[title],[aria-label],[alt]").forEach(element => {
    if (ignored(element)) return;
    const record = rememberAttrs(element);
    attributeNames.forEach(name => add(record[name]));
  });
  return [...missing];
}
async function translateRemaining() {
  if (translating || currentLanguage === "English") return;
  const language = currentLanguage, target = indicTargets[language];
  if (!target) return;
  translating = true;
  try {
    while (language === currentLanguage) {
      const texts = collectMissing().slice(0, 8);
      if (!texts.length) break;
      const keys = texts.map(text => language + "::" + text);
      keys.forEach(key => pending.add(key));
      try {
        const result = await api.translateBatch(texts, target);
        const values = result.translations;
        if (!Array.isArray(values) || values.length !== texts.length ||
            values.some(value => typeof value !== "string" || !value.trim())) {
          throw new Error("Translation service returned an incomplete batch.");
        }
        texts.forEach((text, index) => remoteCache.set(language + "::" + text, values[index]));
        retryCount.delete(language);
        if (language === currentLanguage) apply();
      } catch (error) {
        const count = (retryCount.get(language) || 0) + 1;
        retryCount.set(language, count);
        console.warn("TravelMate local translation is not ready:", error.message);
        if (count <= 3 && language === currentLanguage) {
          if (retryTimer) clearTimeout(retryTimer);
          retryTimer = setTimeout(() => {
            if (language === currentLanguage) translateRemaining();
          }, count * 4000);
        }
        break;
      } finally {
        keys.forEach(key => pending.delete(key));
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
  }, 150);
}
export function setWebsiteLanguage(language) {
  currentLanguage = languageCodes[language] ? language : "English";
  retryCount.delete(currentLanguage);
  document.documentElement.lang = languageCodes[currentLanguage] || "en";
  if (observer) observer.disconnect();
  apply();
  const root = document.getElementById("root") || document.body;
  observer = new MutationObserver(() => {
    if (!applying) schedule();
  });
  observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: attributeNames });
  translateRemaining();
}
export function startWebsiteTranslator(language) {
  setWebsiteLanguage(language);
}
