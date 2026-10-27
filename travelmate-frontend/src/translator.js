import { translations } from "./translations";

const attributeNames = ["placeholder", "title", "aria-label"];
const originalText = new Map();
const originalAttrs = new Map();
let observer = null;
let currentLanguage = "English";
let applying = false;
let timer = null;

function normalize(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function isIgnored(node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return !element || Boolean(element.closest(
    "script,style,noscript,svg,[data-no-translate],.language-select"
  ));
}

function buildMap(language) {
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

function apply() {
  const root = document.getElementById("root") || document.body;
  if (!root) return;

  applying = true;
  try {
    const map = buildMap(currentLanguage);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;

    while ((node = walker.nextNode())) {
      if (isIgnored(node)) continue;
      if (!originalText.has(node)) originalText.set(node, node.nodeValue || "");
      const original = originalText.get(node);
      const source = normalize(original);
      if (!source || source.length < 2) continue;

      if (currentLanguage === "English") {
        node.nodeValue = original;
        continue;
      }

      const translated = map.get(source);
      // Always start from the saved original so switching languages repeatedly works.
      node.nodeValue = translated
        ? original.replace(source, translated)
        : original;
    }

    root.querySelectorAll("[placeholder],[title],[aria-label]").forEach((element) => {
      if (isIgnored(element)) return;
      if (!originalAttrs.has(element)) originalAttrs.set(element, {});
      const record = originalAttrs.get(element);

      attributeNames.forEach((name) => {
        const current = element.getAttribute(name);
        if (current !== null && record[name] === undefined) record[name] = current;
        if (record[name] === undefined) return;

        const original = record[name];
        const translated = currentLanguage === "English"
          ? undefined
          : map.get(normalize(original));

        // Restore the original when the selected language has no matching entry.
        element.setAttribute(name, translated || original);
      });
    });
  } finally {
    applying = false;
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(apply, 80);
}

export function setWebsiteLanguage(language) {
  currentLanguage = translations[language] ? language : "English";
  const languageCodes = {
    English: "en", Kannada: "kn", Hindi: "hi", Tamil: "ta", Telugu: "te"
  };
  document.documentElement.lang = languageCodes[currentLanguage] || "en";

  if (observer) observer.disconnect();
  apply();

  const root = document.getElementById("root") || document.body;
  observer = new MutationObserver(() => {
    if (!applying) schedule();
  });
  observer.observe(root, { subtree: true, childList: true });
}

export function startWebsiteTranslator(language) {
  setWebsiteLanguage(language);
}
