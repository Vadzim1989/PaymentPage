import { eventBusDispatcher } from "@/utils/eventBusDispatcher";
import { isMobile, isIPhone } from "@/utils/deviceDefinition";
import { SBER_PAY_APP_MODAL_STATUS } from "@/constants/index";

export function processingSberPayPayment(
  sbolDeepLink,
  fetchCheckPaymentState,
  fetchStateIntervalId,
  isResetUrlLinks = false
) {
  const {
    fetchCheckSberPaymentStateInterval: fetchCheckSberPaymentStateInterval = 10,
  } = window.settings;

  if (fetchStateIntervalId.value) {
    clearInterval(fetchStateIntervalId.value);
  }

  if (isMobile()) {
    iteratingOverDeepLinks(sbolDeepLink, isResetUrlLinks);
  }

  fetchStateIntervalId.value = setInterval(
    fetchCheckPaymentState,
    fetchCheckSberPaymentStateInterval * 1000
  );
}

function iteratingOverDeepLinks(deepLink, isResetUrlLinks) {
  const { sberPayAppModalShow } = eventBusDispatcher;

  const checkDocumentFocusDelay = 500;
  const clearingMsgDelay = 50;

  const getRenamedLink = (link, pattern, replacement) =>
    link?.replace(pattern, replacement);

  const btripsexpensesPayLink = getRenamedLink(
    deepLink,
    "sberpay://",
    "btripsexpenses://sbolpay/"
  );
  const budgetonlinePayLink = getRenamedLink(
    deepLink,
    "sberpay://",
    "budgetonline-ios://sbolpay/"
  );
  const smartonlinePayLink = getRenamedLink(
    deepLink,
    "sberpay://",
    "ios-app-smartonline://sbolpay/"
  );
  const appOnlineiOSLink = getRenamedLink(
    deepLink,
    "sberpay://",
    "app-online-ios://sbolpay/"
  );
  // const sbolPayLink = getRenamedLink(deepLink, "sberpay", "sbolpay");

  const openSberPay = () => (window.location.href = deepLink);
  const checkFocus = () =>
    document.hasFocus()
      ? sberPayAppModalShow(SBER_PAY_APP_MODAL_STATUS.FAILED)
      : sberPayAppModalShow(SBER_PAY_APP_MODAL_STATUS.SUCCESS);

  function iPhoneIterating() {
    const originalLinks = [
      btripsexpensesPayLink,
      budgetonlinePayLink,
      smartonlinePayLink,
      appOnlineiOSLink,
      deepLink,
    ];
    const urlSearchParams = new URLSearchParams(window.location.search);
    const linksFromUrl = isResetUrlLinks
      ? null
      : JSON.parse(urlSearchParams.get("links") as string);
    const deepLinks = linksFromUrl ? linksFromUrl : originalLinks;
    const link = deepLinks.shift();

    urlSearchParams.set("links", JSON.stringify(deepLinks));
    const pageUrlWithLinks =
      window.location.origin +
      window.location.pathname +
      `?${urlSearchParams}` +
      window.location.hash;

    setTimeout(() => {
      if (link && document.hasFocus()) {
        setTimeout(
          () => (window.location.href = pageUrlWithLinks),
          clearingMsgDelay
        );

        window.location.href = link;
        sberPayAppModalShow(SBER_PAY_APP_MODAL_STATUS.SUCCESS);
      } else if (link && !document.hasFocus()) {
        sberPayAppModalShow(SBER_PAY_APP_MODAL_STATUS.SUCCESS);
      } else {
        sberPayAppModalShow(SBER_PAY_APP_MODAL_STATUS.FAILED);
      }
    }, checkDocumentFocusDelay);
  }

  if (isIPhone()) {
    iPhoneIterating();
  } else {
    openSberPay();
    setTimeout(checkFocus, checkDocumentFocusDelay);
  }
}

export const getSberPayBackUrl = () =>
  `${window.location.origin}${window.location.pathname}?state=@{BankResultState}${window.location.hash}`;
