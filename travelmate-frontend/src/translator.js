import { translations, CATEGORY_TRANSLATIONS, REFERENCE_UI_TRANSLATIONS } from "./i18n";
import { REFERENCE_PLACE_NAME_TRANSLATIONS } from "./referenceContentTranslations";
import { api } from "./api";

const attributeNames = ["placeholder", "title", "aria-label", "alt"];
const originalText = new WeakMap();
const originalAttrs = new WeakMap();
const CACHE_KEY = "travelmate_translation_cache_v1";
const MAX_CACHE_ENTRIES = 2500;

function readTranslationCache() {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter(item => Array.isArray(item) && item.length === 2 &&
          typeof item[0] === "string" && typeof item[1] === "string")
      : [];
  } catch {
    return [];
  }
}

const remoteCache = new Map(readTranslationCache());

function persistTranslationCache() {
  try {
    const entries = [...remoteCache.entries()].slice(-MAX_CACHE_ENTRIES);
    remoteCache.clear();
    entries.forEach(([key, value]) => remoteCache.set(key, value));
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn("TravelMate could not save its local translation cache:", error.message);
  }
}
const pending = new Set();
const retryCount = new Map();

let observer;
let currentLanguage = "English";
let applying = false;
let timer;
let retryTimer;
let translating = false;
let requestLanguage = "";

const languageCodes = {
  English: "en", Assamese: "as", Bengali: "bn", Bodo: "brx", Dogri: "doi",
  Gujarati: "gu", Hindi: "hi", Kannada: "kn", Kashmiri: "ks", Konkani: "kok",
  Maithili: "mai", Malayalam: "ml", Manipuri: "mni", Marathi: "mr", Nepali: "ne",
  Odia: "or", Punjabi: "pa", Sanskrit: "sa", Santali: "sat", Sindhi: "sd",
  Tamil: "ta", Telugu: "te", Urdu: "ur"
};

const indicTargets = {
  Assamese: "asm_Beng", Bengali: "ben_Beng", Bodo: "brx_Deva", Dogri: "doi_Deva",
  Gujarati: "guj_Gujr", Hindi: "hin_Deva", Kannada: "kan_Knda", Kashmiri: "kas_Arab",
  Konkani: "gom_Deva", Maithili: "mai_Deva", Malayalam: "mal_Mlym", Manipuri: "mni_Mtei",
  Marathi: "mar_Deva", Nepali: "npi_Deva", Odia: "ory_Orya", Punjabi: "pan_Guru",
  Sanskrit: "san_Deva", Santali: "sat_Olck", Sindhi: "snd_Arab", Tamil: "tam_Taml",
  Telugu: "tel_Telu", Urdu: "urd_Arab"
};

const normalize = value => String(value ?? "").replace(/\s+/g, " ").trim();

function ignored(node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return !element || Boolean(element.closest(
    "script,style,noscript,svg,[data-no-translate],.language-select,[contenteditable='true']"
  ));
}

function rememberText(node) {
  const current = node.nodeValue || "";
  const record = originalText.get(node);
  if (!record || current !== record.rendered) {
    originalText.set(node, { source: current, rendered: current });
    return current;
  }
  return record.source;
}

function rememberAttrs(element) {
  if (!originalAttrs.has(element)) originalAttrs.set(element, {});
  const record = originalAttrs.get(element);
  attributeNames.forEach(name => {
    const current = element.getAttribute(name);
    if (current === null) return;
    const previous = record[name];
    if (!previous || current !== previous.rendered) {
      record[name] = { source: current, rendered: current };
    }
  });
  return record;
}

function localMap(language) {
  const source = translations.English || {};
  const target = translations[language] || source;
  const map = new Map();

  Object.keys(source).forEach(key => {
    const from = source[key];
    const to = target[key];
    if (typeof from === "string" && typeof to === "string" &&
        from.trim() && to.trim() && from !== to) {
      map.set(normalize(from), to);
    }
  });

  // Add the category dictionary supplied with i18n.js without replacing
  // TravelMate's existing translations when both contain the same phrase.
  const sourceCategories = CATEGORY_TRANSLATIONS.English || {};
  const targetCategories = CATEGORY_TRANSLATIONS[language] || {};
  Object.keys(sourceCategories).forEach(key => {
    const from = sourceCategories[key];
    const to = targetCategories[key];
    if (typeof from === "string" && typeof to === "string" &&
        from.trim() && to.trim() && from !== to && !map.has(normalize(from))) {
      map.set(normalize(from), to);
    }
  });

  // Translate project-specific place categories using the supplied category dictionary.
  // This maps TravelMate's category labels to the closest matching reference category.
  const categoryAliases = {
    "Palace": "Heritage",
    "Hill and Temple": "Spiritual",
    "Garden": "Nature & Parks",
    "Cathedral": "Architecture",
    "Lake and Nature Park": "Nature & Parks",
    "Lake and Nature": "Nature & Parks",
    "Railway Museum": "Museum",
    "Zoo": "Wildlife",
    "Palace and Art Gallery": "Architecture",
    "Market": "Culture & Market",
    "Bird Sanctuary and Nature": "Wildlife",
    "Historic Town and Fort": "Heritage",
    "Temple and Heritage": "Spiritual",
    "Historic Site and Riverfront": "Heritage",
    "Waterfall and Nature": "Nature & Parks",
    "Palace and Museum": "Museum",
    "Bird Park and Nature": "Wildlife",
    "River, Reservoir and Nature": "Nature & Parks",
    "Palace and Heritage Hotel": "Heritage"
  };
  Object.entries(categoryAliases).forEach(([projectCategory, referenceCategory]) => {
    const translated = targetCategories[referenceCategory];
    if (typeof translated === "string" && translated !== projectCategory &&
        !map.has(normalize(projectCategory))) {
      map.set(normalize(projectCategory), translated);
    }
  });

  // Add prepared place names from the supplied dictionary where names match
  // the current TravelMate Mysuru records. Unmatched places remain eligible
  // for the local Ollama translation fallback.
  Object.entries(REFERENCE_PLACE_NAME_TRANSLATIONS).forEach(([englishName, localized]) => {
    const translated = localized[language];
    if (typeof translated === "string" && translated.trim() &&
        !map.has(normalize(englishName))) {
      map.set(normalize(englishName), translated);
    }
  });

  // Map equivalent keys from the supplied reference dictionary onto
  // TravelMate's own English labels. Existing local translations win.
  const referenceTarget = REFERENCE_UI_TRANSLATIONS[language] || {};
  const referenceAliases = {
    home: "navHome",
    places: "navPlaces",
    events: "navEvents",
    ai: "navAI",
    planner: "navPlanner",
    signIn: "navLogin",
    signUp: "navSignup",
    logout: "navLogout",
    gps: "btnUseGPS",
    explore: "btnExplorePlaces",
    add: "addToPlanner",
    book: "bookNow",
    password: "password",
    confirmPassword: "confirmPassword",
    light: "themeLight",
    dark: "themeDark",
    navExplore: "navPlaces",
    navEvents: "navEvents",
    navAssistant: "navAI",
    navPlanner: "navPlanner",
    signInShort: "navLogin",
    signUpShort: "navSignup"
  };
  Object.entries(referenceAliases).forEach(([projectKey, referenceKey]) => {
    const from = source[projectKey];
    const to = referenceTarget[referenceKey];
    if (typeof from === "string" && typeof to === "string" &&
        from.trim() && to.trim() && from !== to && !map.has(normalize(from))) {
      map.set(normalize(from), to);
    }
  });

  return map;
}

function translationMap(language) {
  const map = localMap(language);
  const prefix = language + "::";
  remoteCache.forEach((value, key) => {
    if (key.startsWith(prefix)) {
      const sourceText = key.slice(prefix.length);
      // Prepared dictionary translations always take priority over AI cache entries.
      if (!map.has(sourceText)) map.set(sourceText, value);
    }
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
      const nextValue = translated ? original.replace(normalized, translated) : original;
      if (node.nodeValue !== nextValue) node.nodeValue = nextValue;

      const record = originalText.get(node);
      if (record) record.rendered = nextValue;
    }

    root.querySelectorAll("[placeholder],[title],[aria-label],[alt]").forEach(element => {
      if (ignored(element)) return;
      const record = rememberAttrs(element);

      attributeNames.forEach(name => {
        if (!record[name]) return;
        const original = record[name].source;
        const translated = currentLanguage === "English" ? null : map.get(normalize(original));
        const nextValue = translated || original;
        if (element.getAttribute(name) !== nextValue) element.setAttribute(name, nextValue);
        record[name].rendered = nextValue;
      });
    });
  } finally {
    applying = false;
  }
}

function collectMissing() {
  const root = document.getElementById("root") || document.body;
  const local = localMap(currentLanguage);
  const missing = new Set();

  const add = value => {
    const text = normalize(value);
    if (text.length < 2 || local.has(text)) return;
    // Do not spend local model time translating URLs, email addresses or numeric-only labels.
    if (/^(https?:\/\/|www\.)/i.test(text) ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ||
        /^[\d\s.,:/()%+\-₹$]+$/.test(text)) return;
    const key = currentLanguage + "::" + text;
    if (!remoteCache.has(key) && !pending.has(key)) missing.add(text);
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!ignored(node)) add(rememberText(node));
  }

  root.querySelectorAll("[placeholder],[title],[aria-label],[alt]").forEach(element => {
    if (ignored(element)) return;
    const record = rememberAttrs(element);
    attributeNames.forEach(name => {
      if (record[name]) add(record[name].source);
    });
  });

  return [...missing];
}

async function translateRemaining() {
  if (translating || currentLanguage === "English") return;

  const language = currentLanguage;
  const target = indicTargets[language];
  if (!target) {
    console.warn("TravelMate has no translation target configured for:", language);
    return;
  }

  translating = true;
  requestLanguage = language;

  try {
    while (language === currentLanguage) {
      // Translate one text node per request. TranslateGemma runs sequentially on
      // the user's local machine; small requests avoid proxy timeouts that can
      // otherwise leave an entire batch untranslated.
      const texts = collectMissing().slice(0, 1);
      if (!texts.length) break;

      const keys = texts.map(text => language + "::" + text);
      keys.forEach(key => pending.add(key));

      try {
        const result = await api.translateBatch(texts, target);
        const values = result?.translations;

        if (!Array.isArray(values) || values.length !== texts.length ||
            values.some(value => typeof value !== "string" || !value.trim())) {
          throw new Error("Translation service returned an incomplete batch.");
        }

        if (language !== currentLanguage) break;

        texts.forEach((text, index) => {
          remoteCache.set(language + "::" + text, values[index].trim());
        });
        persistTranslationCache();
        retryCount.delete(language);
        apply();
      } catch (error) {
        const count = (retryCount.get(language) || 0) + 1;
        retryCount.set(language, count);
        console.warn("TravelMate translation failed for " + language + ":", error.message);

        if (count <= 3 && language === currentLanguage) {
          if (retryTimer) clearTimeout(retryTimer);
          retryTimer = setTimeout(() => {
            if (language === currentLanguage) translateRemaining();
          }, count * 5000);
        }
        break;
      } finally {
        keys.forEach(key => pending.delete(key));
      }
    }
  } finally {
    translating = false;
    requestLanguage = "";
    if (language !== currentLanguage) translateRemaining();
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    apply();
    translateRemaining();
  }, 250);
}

export function setWebsiteLanguage(language) {
  currentLanguage = languageCodes[language] ? language : "English";
  retryCount.delete(currentLanguage);

  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = undefined;
  }

  document.documentElement.lang = languageCodes[currentLanguage] || "en";
  document.documentElement.dir = ["Urdu", "Kashmiri", "Sindhi"].includes(currentLanguage) ? "rtl" : "ltr";
  if (observer) observer.disconnect();

  apply();

  const root = document.getElementById("root") || document.body;
  observer = new MutationObserver(() => {
    if (!applying) schedule();
  });
  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: attributeNames
  });

  translateRemaining();
}

export function startWebsiteTranslator(language) {
  setWebsiteLanguage(language);
}
