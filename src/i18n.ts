import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// English namespaces
import enLayout from "./locales/en/layout.json";
import enCommon from "./locales/en/common.json";
import enInventory from "./locales/en/inventory.json";

// Ukrainian namespaces
import uaLayout from "./locales/ua/layout.json";
import uaCommon from "./locales/ua/common.json";
import uaInventory from "./locales/ua/inventory.json";

const savedLang = localStorage.getItem("lang");

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        layout: enLayout,
        common: enCommon,
        inventory: enInventory
      },
      ua: {
        layout: uaLayout,
        common: uaCommon,
        inventory: uaInventory
      }
    },

    lng: savedLang || "en",
    fallbackLng: "en",

    ns: ["common", "layout", "inventory"],
    defaultNS: "common",

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
