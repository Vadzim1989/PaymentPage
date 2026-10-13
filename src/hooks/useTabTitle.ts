import { useEffect } from "react";
import { useMatches } from "react-router-dom";
import { useTranslation } from "react-i18next";

type RouteHandle = { tabTitle?: string };

export function useTabTitle() {
  const matches = useMatches();
  const { t } = useTranslation();

  const setTabTitle = () => {
    const matchedHandle = [...matches]
      .reverse()
      .map((m) => m.handle as RouteHandle | undefined)
      .find((handle) => handle?.tabTitle);

    document.title = matchedHandle?.tabTitle
      ? t(matchedHandle.tabTitle)
      : t("tabTitle.default");
  };

  useEffect(() => {
    setTabTitle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, t]);

  return { setTabTitle };
}