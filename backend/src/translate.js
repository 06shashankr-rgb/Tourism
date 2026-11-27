// Website translation for the 22 scheduled Indian languages (+ English source).
//
// Providers, tried in this order for every text that is still untranslated:
//   1. "google" - official Google Cloud Translation API (needs GOOGLE_TRANSLATE_API_KEY)
//   2. "web"    - keyless Google Translate web endpoint (unofficial; fine for demos/projects)
//   3. "ollama" - your local Python service + Ollama TranslateGemma (works fully offline, slow)
//
// TRANSLATE_PROVIDER=auto (default) | google | web | ollama   -> use only one provider.

export const SUPPORTED_TARGETS = {
  asm_Beng: "as", ben_Beng: "bn", brx_Deva: "brx", doi_Deva: "doi", guj_Gujr: "gu",
  hin_Deva: "hi", kan_Knda: "kn", kas_Arab: "ks", gom_Deva: "gom", mai_Deva: "mai",
  mal_Mlym: "ml", mni_Mtei: "mni-Mtei", mar_Deva: "mr", npi_Deva: "ne", ory_Orya: "or",
  pan_Guru: "pa", san_Deva: "sa", sat_Olck: "sat", snd_Arab: "sd", tam_Taml: "ta",
  tel_Telu: "te", urd_Arab: "ur"
};

const REQUEST_TIMEOUT_MS = 20000;

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

function decodeEntities(value) {
  return String(value)
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// ---- Provider 1: official Google Cloud Translation (v2) -----------------
async function googleOfficial(texts, googleCode) {
  const key = (process.env.GOOGLE_TRANSLATE_API_KEY || "").trim();
  if (!key) throw new Error("GOOGLE_TRANSLATE_API_KEY is not set");
  const response = await fetch(
    "https://translation.googleapis.com/language/translate/v2?key=" + encodeURIComponent(key),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: texts, source: "en", target: googleCode, format: "text" }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    }
  );
  if (!response.ok) throw new Error("Google Cloud Translation HTTP " + response.status);
  const data = await response.json();
  const list = data?.data?.translations;
  if (!Array.isArray(list) || list.length !== texts.length) throw new Error("Bad Google response");
  return list.map(item => decodeEntities(item.translatedText || "").trim() || null);
}

// ---- Provider 2: keyless Google Translate web endpoint -------------------
async function googleWebOne(text, googleCode) {
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&dt=t&tl=" +
    encodeURIComponent(googleCode);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: "q=" + encodeURIComponent(text),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error("Google web HTTP " + response.status);
  const data = await response.json();
  if (!Array.isArray(data?.[0])) throw new Error("Bad Google web response");
  const out = data[0].map(segment => (Array.isArray(segment) ? segment[0] : "") || "").join("").trim();
  return out || null;
}

async function googleWeb(texts, googleCode) {
  return mapLimit(texts, 6, async text => {
    try { return await googleWebOne(text, googleCode); } catch { return null; }
  });
}

// ---- Provider 3: local Python service (Ollama TranslateGemma) ------------
async function ollamaLocal(texts, target) {
  const pythonUrl = (process.env.PYTHON_AI_URL || "http://127.0.0.1:8001").trim().replace(/\/$/, "");
  const out = [];
  // Five-string chunks balance fewer model calls with the project's 8 GB RAM laptop.
  // Python translates each chunk in one Ollama inference and falls back safely if needed.
  for (let i = 0; i < texts.length; i += 5) {
    const chunk = texts.slice(i, i + 5);
    const response = await fetch(pythonUrl + "/translate-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: chunk, source: "eng_Latn", target }),
      signal: AbortSignal.timeout(180000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(data.translations) || data.translations.length !== chunk.length) {
      throw new Error(data.detail || "Local translation failed");
    }
    out.push(...data.translations.map(value => (typeof value === "string" && value.trim() ? value.trim() : null)));
  }
  return out;
}

function providerOrder() {
  const choice = (process.env.TRANSLATE_PROVIDER || "auto").trim().toLowerCase();
  if (["google", "web", "ollama"].includes(choice)) return [choice];
  const order = [];
  // Keep paid Google Cloud Translation opt-in only; default is free web translation then local Ollama.
  if ((process.env.GOOGLE_TRANSLATE_API_KEY || "").trim()) order.push("google");
  order.push("web", "ollama");
  return order;
}

/**
 * Translate English texts into one Indian language.
 * Returns { translations: (string|null)[], providers: string[] }.
 * A null entry means no provider could translate that text.
 */
export async function translateTexts(texts, target) {
  const googleCode = SUPPORTED_TARGETS[target];
  if (!googleCode) throw new Error("Unsupported target language.");

  const result = new Array(texts.length).fill(null);
  const used = new Set();

  for (const provider of providerOrder()) {
    const todo = result.map((value, index) => (value === null ? index : -1)).filter(index => index >= 0);
    if (!todo.length) break;
    const batch = todo.map(index => texts[index]);
    try {
      let translated;
      if (provider === "google") translated = await googleOfficial(batch, googleCode);
      else if (provider === "web") translated = await googleWeb(batch, googleCode);
      else translated = await ollamaLocal(batch, target);
      translated.forEach((value, i) => {
        if (typeof value === "string" && value.trim()) {
          result[todo[i]] = value.trim();
          used.add(provider);
        }
      });
    } catch (error) {
      console.warn("Translation provider '" + provider + "' failed:", error.message);
    }
  }
  return { translations: result, providers: [...used] };
}