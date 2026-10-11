import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import trTR from "./locales/tr-TR.json";

const resources = {
  "tr-TR": { translation: trTR },
  en: { translation: en },
};

export function initI18n(lng: string = "tr-TR") {
  if (i18n.isInitialized) {
    void i18n.changeLanguage(lng);
    return i18n;
  }
  void i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: "tr-TR",
    interpolation: { escapeValue: false },
  });
  return i18n;
}

export { i18n };
