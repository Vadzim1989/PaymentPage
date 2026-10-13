import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useLang() {
  const { i18n } = useTranslation();

  const setLang = useCallback(
    (lang: string) => {
      sessionStorage.setItem("lang", lang);
      i18n.changeLanguage(lang);
    },
    [i18n],
  );

  const initLang = useCallback(() => {
    const lang = sessionStorage.getItem("lang");

    if (lang) {
      setLang(lang);
    }
  }, [setLang]);

  return {
    initLang,
    setLang,
  };
}