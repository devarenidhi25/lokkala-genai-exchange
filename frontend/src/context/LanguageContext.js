import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * LanguageContext
 * - provides: lang, setLang, t (translation function), tSync, ready (boolean), languages
 * - caches translations per language in localStorage under "translations_{lang}"
 */

const LanguageContext = createContext();

export function useLanguage() {
  return useContext(LanguageContext);
}

const DEFAULT_LANG = "en";
const LANGUAGES = {
  en: "English",
  hi: "हिन्दी (Hindi)",
  mr: "मराठी (Marathi)",
  bn: "বাংলা (Bengali)",
  ta: "தமிழ் (Tamil)",
  te: "తెలుగు (Telugu)",
  gu: "ગુજરાતી (Gujarati)",
  kn: "ಕನ್ನಡ (Kannada)",
  ml: "മലയാളം (Malayalam)",
  pa: "ਪੰਜਾਬੀ (Punjabi)",
  or: "ଓଡ଼ିଆ (Odia)",
  as: "অসমীয়া (Assamese)",
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("site_lang") || DEFAULT_LANG);
  const [translations, setTranslations] = useState(() => {
    try {
      const raw = localStorage.getItem(`translations_${lang}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [ready, setReady] = useState(true);

  useEffect(() => {
    // Load translations for current lang from localStorage
    try {
      const raw = localStorage.getItem(`translations_${lang}`);
      setTranslations(raw ? JSON.parse(raw) : {});
    } catch {
      setTranslations({});
    }
  }, [lang]);

  // helper: call backend to translate an array of texts
  async function translateMany(texts = []) {
    if (!texts || texts.length === 0) return [];
    setReady(false);
    try {
      const res = await fetch("/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts, target: lang }),
      });
      if (!res.ok) throw new Error("Translation API error");
      const data = await res.json();
      // data.translations should be array of translated strings, same length
      // merge into cache object mapping original -> translated
      const newMap = { ...translations };
      texts.forEach((src, idx) => {
        newMap[src] = data.translations[idx] ?? src;
      });
      setTranslations(newMap);
      localStorage.setItem(`translations_${lang}`, JSON.stringify(newMap));
      return texts.map((t) => newMap[t]);
    } catch (err) {
      console.error("translateMany error:", err);
      // fallback: return originals
      return texts;
    } finally {
      setReady(true);
    }
  }

  // translation function tSync: single string -> translated string (sync, returns cached or original)
  function tSync(key) {
    if (lang === DEFAULT_LANG) return key;
    return translations[key] ?? key;
  }

  // t: returns translated value. If missing in cache, triggers translation asynchronously
  async function t(keyOrArray) {
    if (!keyOrArray) return keyOrArray;
    if (Array.isArray(keyOrArray)) {
      const missing = keyOrArray.filter((k) => !translations[k] && lang !== DEFAULT_LANG);
      if (missing.length) await translateMany(missing);
      return keyOrArray.map((k) => translations[k] ?? k);
    } else {
      if (lang === DEFAULT_LANG) return keyOrArray;
      if (translations[keyOrArray]) return translations[keyOrArray];
      // request translation but return original immediately
      translateMany([keyOrArray]).catch(() => {});
      return keyOrArray;
    }
  }

  const value = { 
    lang, 
    setLang: (l) => {
      localStorage.setItem("site_lang", l);
      setLang(l);
    }, 
    t, 
    tSync, 
    ready, 
    languages: LANGUAGES 
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}