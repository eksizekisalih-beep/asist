import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./en.json";
import tr from "./tr.json";

const isBrowser = typeof window !== "undefined";

if (isBrowser) {
  i18n.use(LanguageDetector);
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
    },
    lng: "tr", // Default to Turkish as requested by the user
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
