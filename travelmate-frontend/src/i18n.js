import { translations as uiTranslations } from "./translations";

export { uiTranslations as translations };

// The language selector contains India's 22 constitutionally scheduled languages only.
// English remains the default source language internally and is not shown as a selector option.
export const INDIAN_LANGUAGES = [
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "brx", name: "Bodo", native: "बड़ो" },
  { code: "doi", name: "Dogri", native: "डोगरी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ks", name: "Kashmiri", native: "कॉशुर" },
  { code: "kok", name: "Konkani", native: "कोंकणी" },
  { code: "mai", name: "Maithili", native: "मैथिली" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "mni", name: "Manipuri", native: "মৈতৈলোন্" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्" },
  { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "sd", name: "Sindhi", native: "سنڌي" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "ur", name: "Urdu", native: "اردو" }
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

// Additional prepared UI phrases taken from the supplied i18n.js.
// These supplement the project's existing Kannada/Hindi/Tamil/Telugu dictionary.
export const REFERENCE_UI_TRANSLATIONS = {
  Malayalam: { navHome:"ഹോം", navPlaces:"സ്ഥലങ്ങൾ", navEvents:"പരിപാടികൾ", navAI:"AI ഗൈഡ്", navPlanner:"എന്റെ യാത്ര", navLogin:"ലോഗിൻ", navSignup:"രജിസ്റ്റർ ചെയ്യുക", navLogout:"ലോഗ് ഔട്ട്", btnExplorePlaces:"സ്ഥലങ്ങൾ കാണുക", btnUseGPS:"ലൈവ് ജിപിഎസ് ഉപയോഗിക്കുക", addToPlanner:"യാത്രയിലേക്ക് ചേർക്കുക", bookNow:"പാസ് എടുക്കുക", password:"പാസ്‌വേഡ്", confirmPassword:"പാസ്‌വേഡ് വീണ്ടും നൽകുക", themeLight:"ലൈറ്റ് മോഡ്", themeDark:"ഡാർക്ക് മോഡ്", loading:"വിവരങ്ങൾ ലഭ്യമാക്കുന്നു..." },
  Bengali: { navHome:"হোম", navPlaces:"দর্শনীয় স্থান", navEvents:"সাংস্কৃতিক অনুষ্ঠান", navAI:"এআই গাইড", navPlanner:"আমার ভ্রমণ", navLogin:"সাইন ইন", navSignup:"নিবন্ধন করুন", navLogout:"লগ আউট", btnExplorePlaces:"স্থানগুলো দেখুন", btnUseGPS:"লাইভ জিপিএস ব্যবহার করুন", addToPlanner:"ভ্রমণতালিকায় যুক্ত করুন", bookNow:"পাস নিন", password:"পাসওয়ার্ড", confirmPassword:"পাসওয়ার্ড নিশ্চিত করুন", themeLight:"লাইট মোড", themeDark:"ডার্ক মোড", loading:"লোড হচ্ছে..." },
  Marathi: { navHome:"मुख्यपृष्ठ", navPlaces:"पर्यटन स्थळे", navEvents:"सांस्कृतिक कार्यक्रम", navAI:"एआय मार्गदर्शक", navPlanner:"माझा प्रवास", navLogin:"साइन इन", navSignup:"नोंदणी करा", navLogout:"लॉग आउट", btnExplorePlaces:"स्थळे पहा", btnUseGPS:"लाइव्ह जीपीएस वापरा", addToPlanner:"प्रवासात जोडा", bookNow:"पास बुक करा", password:"पासवर्ड", confirmPassword:"पासवर्ड पुष्टी करा", themeLight:"लाईट मोड", themeDark:"डार्क मोड", loading:"माहिती लोड होत आहे..." },
  Gujarati: { navHome:"હોમ", navPlaces:"જોવાલાયક સ્થળો", navEvents:"સાંસ્કૃતિક કાર્યક્રમો", navAI:"AI ગાઈડ", navPlanner:"મારો પ્રવાસ", navLogin:"સાઇન ઇન", navSignup:"જોડાઓ", navLogout:"લૉગ આઉટ", btnExplorePlaces:"સ્થળો જુઓ", btnUseGPS:"લાઇવ GPS વાપરો", addToPlanner:"પ્રવાસમાં ઉમેરો", bookNow:"પાસ બુક કરો", password:"પાસવર્ડ", confirmPassword:"પાસવર્ડ કન્ફર્મ કરો", themeLight:"લાઇટ મોડ", themeDark:"ડાર્ક મોડ", loading:"લોડ થઈ રહ્યું છે..." },
  Punjabi: { navHome:"ਮੁੱਖ ਪੰਨਾ", navPlaces:"ਸੈਰ ਸਪਾਟਾ ਸਥਾਨ", navEvents:"ਸੱਭਿਆਚਾਰਕ ਸਮਾਗਮ", navAI:"AI ਗਾਈਡ", navPlanner:"ਮੇਰਾ ਸਫ਼ਰ", navLogin:"ਸਾਈਨ ਇਨ", navSignup:"ਜੁੜੋ", navLogout:"ਲਾਗ ਆਉਟ", btnExplorePlaces:"ਸਥਾਨ ਦੇਖੋ", btnUseGPS:"ਲਾਈਵ GPS ਵਰਤੋ", addToPlanner:"ਯਾਤਰਾ ਵਿੱਚ ਸ਼ਾਮਲ ਕਰੋ", bookNow:"ਪਾਸ ਬੁੱਕ ਕਰੋ", password:"ਪਾਸਵਰਡ", confirmPassword:"ਪਾਸਵਰਡ ਪੁਸ਼ਟੀ ਕਰੋ", themeLight:"ਲਾਈਟ ਮੋਡ", themeDark:"ਡਾਰਕ ਮੋਡ", loading:"ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ..." },
  Odia: { navHome:"ମୁଖ୍ୟ ପୃଷ୍ଠା", navPlaces:"ଦର୍ଶନୀୟ ସ୍ଥାନ", navEvents:"ସାଂସ୍କୃତିକ କାର୍ଯ୍ୟକ୍ରମ", navAI:"AI ଗାଇଡ୍", navPlanner:"ମୋ ଯାତ୍ରା", navLogin:"ସାଇନ୍ ଇନ୍", navSignup:"ଯୋଗ ଦିଅନ୍ତୁ", navLogout:"ଲଗ୍ ଆଉଟ୍", btnExplorePlaces:"ସ୍ଥାନ ଦେଖନ୍ତୁ", btnUseGPS:"ଲାଇଭ୍ GPS ବ୍ୟବହାର କରନ୍ତୁ", addToPlanner:"ଯାତ୍ରାରେ ଯୋଡନ୍ତୁ", bookNow:"ପାସ୍ ବୁକ୍ କରନ୍ତୁ", password:"ପାସୱାର୍ଡ", confirmPassword:"ପାସୱାର୍ଡ ନିଶ୍ଚିତ କରନ୍ତୁ", themeLight:"ଲାଇଟ୍ ମୋଡ୍", themeDark:"ଡାର୍କ ମୋଡ୍", loading:"ଲୋଡ୍ ହେଉଛି..." },
  Urdu: { navHome:"ہوم", navPlaces:"مقامات", navEvents:"ثقافتی تقریبات", navAI:"AI گائیڈ", navPlanner:"میرا سفر", navLogin:"سائن ان", navSignup:"رجسٹر کریں", navLogout:"لاگ آؤٹ", btnExplorePlaces:"مقامات دریافت کریں", btnUseGPS:"لائیو GPS استعمال کریں", addToPlanner:"سفر میں شامل کریں", bookNow:"پاس بک کریں", password:"پاس ورڈ", confirmPassword:"پاس ورڈ کی تصدیق کریں", themeLight:"لائٹ موڈ", themeDark:"ڈارک موڈ", loading:"لوڈ ہو رہا ہے..." },
  Assamese: { navHome:"গৃহ", navPlaces:"দৰ্শনীয় স্থান", navEvents:"সাংস্কৃতিক অনুষ্ঠান", navAI:"AI গাইড", navPlanner:"মোৰ ভ্ৰমণ", navLogin:"ছাইন ইন", navSignup:"পঞ্জীয়ন কৰক", navLogout:"লগ আউট", btnExplorePlaces:"স্থানসমূহ চাওক", btnUseGPS:"লাইভ GPS ব্যৱহাৰ কৰক", addToPlanner:"ভ্ৰমণত যোগ কৰক", bookNow:"পাছ বুক কৰক", password:"পাছৱৰ্ড", confirmPassword:"পাছৱৰ্ড নিশ্চিত কৰক", themeLight:"লাইট মোড", themeDark:"ডাৰ্ক মোড", loading:"লোড হৈ আছে..." },
  Sanskrit: { navHome:"मुख्यपृष्ठम्", navPlaces:"पर्यटनस्थलानि", navEvents:"सांस्कृतिककार्यक्रमाः", navAI:"AI दर्शकः", navPlanner:"मम यात्रा", navLogin:"प्रवेशः", navSignup:"पञ्जीकरणम्", navLogout:"निर्गमः", btnExplorePlaces:"स्थलानि पश्यन्तु", btnUseGPS:"सजीव GPS उपयुज्यताम्", addToPlanner:"यात्रायां योजयतु", bookNow:"प्रवेशपत्रम् आरक्षयतु", password:"गुप्तपदम्", confirmPassword:"गुप्तपदं पुनर्वदतु", themeLight:"प्रकाशरूपम्", themeDark:"अन्धकाररूपम्", loading:"लोड् भवति..." }
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
