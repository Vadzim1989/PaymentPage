export function getCustomerReceiptUrl(routeName?, params?) {
  const pathName = routeName
    ? location.pathname.replace(routeName, "")
    : location.pathname;

  const isProd = import.meta.env.PROD;

  if (!isProd) {
    return `https://apple-pay-test.intervale.ru/${window.location.hash}`; //Этот параметр только для разработки для localhost, т.к.бэк не работает при отсутствии "intervale.ru"
  } else if (params) {
    const searchParams = new URLSearchParams(params).toString();
    const decodedSearchParams = `?${decodeURIComponent(searchParams)}`;
    return (
      location.origin + pathName + decodedSearchParams + window.location.hash
    );
  } else {
    return location.origin + pathName + window.location.hash;
  }
}
