import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { SRC_TYPE } from "@/constants";
import { getSberPayBackUrl } from "@/utils/stateSberPayInProgress";
import { getQueryParams } from "@/utils/queryParams";

type QueryParams = Record<string, string>;
const enableApiLangParam = window?.settings?.enableApiLangParam;

function formatOParams(query: QueryParams): QueryParams {
  const params: QueryParams = {};

  Object.keys(query).forEach((param) => {
    if (param.startsWith("o.")) {
      const [, part] = param.split(".");
      if (part) {
        const encodedQueryParam = encodeURIComponent(query[param]).replace(
          /^%20/,
          "+"
        );
        params["params." + part] = decodeURIComponent(encodedQueryParam);
      }
    }
  });

  return params;
}

function getSanitazedParam(paramValue: string): string {
  if (typeof paramValue !== 'string') return '';

  try {
    if (/%[0-9A-Fa-f]{2}/.test(paramValue)) {
      paramValue = decodeURIComponent(paramValue);
    }
  } catch {
    return '';
  } 
  
  // Check for control characters
  const controlChars = [...paramValue].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);
  if (controlChars) return '';
  
  // List of all dangerous patterns
  const dangers = [
      /\b(?:eval|setTimeout|setInterval)\s*\(/i,                          // eval(), setTimeout(), setInterval()
      /\bfunction\s*\(/i,                                                 // function()
      /\b(javascript|script|iframe)\b|\b(alert|prompt|confirm)\s*\(/i,    // javascript, script, iframe, alert(, prompt(, confirm(
      // onload=, onerror= and other
      /\bon(load|error|click|mouseover|mouseout|submit|focus|blur|change|dblclick|keydown|keypress|keyup|mousedown|mousemove|mouseup)\s*=/i
  ];

  const isDangerous = dangers.some(pattern => pattern.test(paramValue));
  return isDangerous ? '' : paramValue;
}

// Теперь функция не мутирует исходный объект, а возвращает новый, очищенный
function sanitizeQueryParams(routeQuery: QueryParams): QueryParams {
  const sanitizedQuery: QueryParams = {};
  
  Object.entries(routeQuery).forEach(([key, value]) => {
    if (value) {
      sanitizedQuery[key] = getSanitazedParam(value);
    } else {
      sanitizedQuery[key] = value;
    }
  });
  
  return sanitizedQuery;
}

export function useUrlParser() {
  const location = useLocation();
  const { setLang } = useLang();

  const rawQuery = useMemo(
    () => getQueryParams(location.search), 
    [location.search],
  );

  const query = useMemo(() => sanitizeQueryParams(rawQuery), [rawQuery]);

  const { merch_id, back_url_s, back_url_f, receiptEmail, invoice, lang_code } = query;
  
  const defaultLang = window?.settings?.localization?.defaultLang || "";
  const lang = lang_code || defaultLang;

  // Смена языка — это побочный эффект, его нельзя вызывать во время рендера.
  useEffect(() => {
    setLang(lang);
  }, [lang, setLang]);

  // Возвращаем стабильный объект, чтобы он не менял зависимости useEffect/useCallback.
  return useMemo(() => {
    if ((!merch_id || !back_url_s || !back_url_f) && !invoice) {
      return undefined;
    }

    const params: Record<string, any> = {
      merchantId: merch_id,
      "state.redirect": window?.settings?.redirectType || "post_params",
      "state.in_progress": window?.settings?.stateInProgress || "no",
      back_url_s,
      back_url_f,
    };

    if (enableApiLangParam) {
      params["lang"] = lang;
    }

    if (receiptEmail) {
      params["receiptEmail"] = receiptEmail;
    }

    if (window.settings["3ds2"].supported) {
      params["3ds2.supported"] = true;
    }

    if (query["src.type"] === SRC_TYPE.gazprom_pay) {
      params["src.type"] = SRC_TYPE.gazprom_pay;
    }

    if (query["src.type"] === SRC_TYPE.mir_pay) {
      params["src.type"] = SRC_TYPE.mir_pay;
    }

    if (query["src.type"] === SRC_TYPE.sber_pay) {
      params["src.type"] = SRC_TYPE.sber_pay;
      params["sberPayBackUrl"] = getSberPayBackUrl();
    }

    if (query["src.type"] === SRC_TYPE.yandex_split) {
      params["src.type"] = SRC_TYPE.yandex_split;
    }

    if (query["src.type"] === SRC_TYPE.sbp) {
      params["src.type"] = SRC_TYPE.sbp;
    }

    if (query["src.type"] === SRC_TYPE.wb_pay) {
      params["src.type"] = SRC_TYPE.wb_pay;
    }

    if (query.paymentId) {
      params["paymentId"] = query.paymentId;
    }

    if (invoice) {
      params['invoiceId'] = invoice;
    }

    return { ...params, ...formatOParams(query) };
  }, [merch_id, back_url_s, back_url_f, receiptEmail, invoice, lang, query]);
}