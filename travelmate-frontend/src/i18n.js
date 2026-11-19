import { translations as uiTranslations } from "./translations";

export { uiTranslations as translations };

// This reference dictionary is adapted from the supplied i18n.js.
// TravelMate's existing 22-language selector and local Ollama fallback remain active.
export const INDIAN_LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्" }
];

export const CATEGORY_TRANSLATIONS = {
  English: {
    All: "All",
    Heritage: "Heritage",
    Spiritual: "Spiritual",
    "Nature & Parks": "Nature & Parks",
    Museum: "Museum",
    Wildlife: "Wildlife",
    Architecture: "Architecture",
    "Culture & Market": "Culture & Market"
  },
  Kannada: {
    All: "ಎಲ್ಲವೂ",
    Heritage: "ಪರಂಪರೆ",
    Spiritual: "ಆಧ್ಯಾತ್ಮಿಕ",
    "Nature & Parks": "ಪ್ರಕೃತಿ & ಉದ್ಯಾನಗಳು",
    Museum: "ವಸ್ತುಸಂಗ್ರಹಾಲಯ",
    Wildlife: "ವನ್ಯಜೀವಿ",
    Architecture: "ವಾಸ್ತುಶಿಲ್ಪ",
    "Culture & Market": "ಸಂಸ್ಕೃತಿ & ಮಾರುಕಟ್ಟೆ"
  },
  Hindi: {
    All: "सभी",
    Heritage: "विरासत",
    Spiritual: "आध्यात्मिक",
    "Nature & Parks": "प्रकृति और पार्क",
    Museum: "संग्रहालय",
    Wildlife: "वन्यजीव",
    Architecture: "वास्तुकला",
    "Culture & Market": "संस्कृति और बाजार"
  },
  Tamil: {
    All: "அனைத்தும்",
    Heritage: "பாரம்பரியம்",
    Spiritual: "ஆன்மீகம்",
    "Nature & Parks": "இயற்கை மற்றும் பூங்காக்கள்",
    Museum: "அருங்காட்சியகம்",
    Wildlife: "வனவிலங்கு",
    Architecture: "கட்டிடக்கலை",
    "Culture & Market": "கலாச்சாரம் மற்றும் சந்தை"
  },
  Telugu: {
    All: "అన్నీ",
    Heritage: "వారసత్వం",
    Spiritual: "ఆధ్యాత్మికం",
    "Nature & Parks": "ప్రకృతి & పార్కులు",
    Museum: "మ్యూజియం",
    Wildlife: "వన్యప్రాణులు",
    Architecture: "వాస్తుశిల్పం",
    "Culture & Market": "సంస్కృతి & మార్కెట్"
  },
  Malayalam: {
    All: "എല്ലാം",
    Heritage: "പൈതൃകം",
    Spiritual: "ആത്മീയം",
    "Nature & Parks": "പ്രകൃതിയും പാർക്കുകളും",
    Museum: "മ്യൂസിയം",
    Wildlife: "വന്യജീവി",
    Architecture: "വാസ്തുവിദ്യ",
    "Culture & Market": "സംസ്കാരവും വിപണിയും"
  },
  Bengali: {
    All: "সব",
    Heritage: "ঐতিহ্য",
    Spiritual: "আধ্যাত্মিক",
    "Nature & Parks": "প্রকৃতি ও উদ্যান",
    Museum: "জাদুঘর",
    Wildlife: "বন্যপ্রাণী",
    Architecture: "স্থাপত্য",
    "Culture & Market": "সংস্কৃতি ও বাজার"
  },
  Marathi: {
    All: "सर्व",
    Heritage: "वारसा",
    Spiritual: "आध्यात्मिक",
    "Nature & Parks": "निसर्ग आणि उद्याने",
    Museum: "संग्रहालय",
    Wildlife: "वन्यजीव",
    Architecture: "स्थापत्यकला",
    "Culture & Market": "संस्कृती आणि बाजार"
  },
  Gujarati: {
    All: "બધા",
    Heritage: "વારસો",
    Spiritual: "આધ્યાત્મિક",
    "Nature & Parks": "પ્રકૃતિ અને બગીચાઓ",
    Museum: "સંગ્રહાલય",
    Wildlife: "વન્યજીવન",
    Architecture: "સ્થાપત્ય",
    "Culture & Market": "સંસ્કૃતિ અને બજાર"
  },
  Punjabi: {
    All: "ਸਾਰੇ",
    Heritage: "ਵਿਰਾਸਤ",
    Spiritual: "ਅਧਿਆਤਮਿਕ",
    "Nature & Parks": "ਕੁਦਰਤ ਅਤੇ ਪਾਰਕ",
    Museum: "ਅਜਾਇਬ ਘਰ",
    Wildlife: "ਜੰਗਲੀ ਜੀਵ",
    Architecture: "ਆਰਕੀਟੈਕਚਰ",
    "Culture & Market": "ਸੱਭਿਆਚਾਰ ਅਤੇ ਬਾਜ਼ਾਰ"
  },
  Odia: {
    All: "ସମସ୍ତ",
    Heritage: "ଐତିହ୍ୟ",
    Spiritual: "ଆଧ୍ୟାତ୍ମିକ",
    "Nature & Parks": "ପ୍ରକୃତି ଏବଂ ପାର୍କ",
    Museum: "ସଂଗ୍ରହାଳୟ",
    Wildlife: "ବନ୍ୟଜନ୍ତୁ",
    Architecture: "ସ୍ଥାପତ୍ୟ",
    "Culture & Market": "ସଂସ୍କୃତି ଏବଂ ବଜାର"
  },
  Urdu: {
    All: "تمام",
    Heritage: "ورثہ",
    Spiritual: "روحانی",
    "Nature & Parks": "فطرت اور باغات",
    Museum: "عجائب گھر",
    Wildlife: "جنگلی حیات",
    Architecture: "طرز تعمیر",
    "Culture & Market": "ثقافت اور بازار"
  },
  Assamese: {
    All: "সকলো",
    Heritage: "ঐতিহ্য",
    Spiritual: "আধ্যাত্মিক",
    "Nature & Parks": "প্ৰকৃতি আৰু উদ্যান",
    Museum: "সংগ্ৰহালয়",
    Wildlife: "বন্যপ্ৰাণী",
    Architecture: "স্থাপত্য",
    "Culture & Market": "সংস্কৃতি আৰু বজাৰ"
  },
  Sanskrit: {
    All: "सर्वे",
    Heritage: "पारम्परिकम्",
    Spiritual: "आध्यात्मिकम्",
    "Nature & Parks": "प्रकृतिः उद्यानानि च",
    Museum: "संग्रहालयम्",
    Wildlife: "वन्यजीवाः",
    Architecture: "शिल्पकला",
    "Culture & Market": "संस्कृतिः विपणिः च"
  }
};

function translatedText(value, language) {
  if (typeof value !== "string" || !value || language === "English") return value;
  const dictionary = uiTranslations[language] || {};
  return dictionary[value] || value;
}

export function translateCategory(category, language = "English") {
  if (!category) return "";
  const dictionary = CATEGORY_TRANSLATIONS[language] || CATEGORY_TRANSLATIONS.English;
  return dictionary[category] || translatedText(category, language) || category;
}

export function translatePlace(place, language = "English") {
  if (!place || language === "English") return place;
  const result = { ...place };
  ["name", "tag", "description", "insiderTip", "address", "openingHours"].forEach(key => {
    if (typeof result[key] === "string") result[key] = translatedText(result[key], language);
  });
  if (result.category) result.category = translateCategory(result.category, language);
  if (Array.isArray(result.highlights)) {
    result.highlights = result.highlights.map(value => translatedText(value, language));
  }
  return result;
}

export function translateEvent(event, language = "English") {
  if (!event || language === "English") return event;
  const result = { ...event };
  ["name", "description", "venue", "category", "date", "time"].forEach(key => {
    if (typeof result[key] === "string") {
      result[key] = key === "category"
        ? translateCategory(result[key], language)
        : translatedText(result[key], language);
    }
  });
  return result;
}

export function translateHotel(hotel, language = "English") {
  if (!hotel || language === "English") return hotel;
  const result = { ...hotel };
  ["name", "city", "area", "tier", "description", "address"].forEach(key => {
    if (typeof result[key] === "string") result[key] = translatedText(result[key], language);
  });
  return result;
}

export function getLanguageCode(languageName = "English") {
  const found = INDIAN_LANGUAGES.find(language =>
    language.name.toLowerCase() === String(languageName).toLowerCase() ||
    language.code.toLowerCase() === String(languageName).toLowerCase()
  );
  return found ? found.code : "en";
}
