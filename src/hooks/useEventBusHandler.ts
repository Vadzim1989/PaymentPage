import {
  API_ERROR,
  SBER_PAY_APP_MODAL_STATUS,
  SRC_TYPE,
} from "@/constants/index";
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { paymentService } from "@/services/payment";
import { usePayment } from "@/hooks/usePayment";
import { EventBus, EVENTS } from "@/utils/EventBus";
import { useTranslation } from "react-i18next";

export function useEventBusHandler(loading?) {
  const location = useLocation();
  const navigate = useNavigate();
  const service = useMemo(() => paymentService(), []);
  const { state } = service;
  const { checkPaymentState } = usePayment();
  const eventBus = EventBus.getInstance();
  const { i18n } = useTranslation();

  const iframeHandler = (isVisibleAcsIframe) =>
    eventBus.$on(
      EVENTS.IFRAME_ACS_MOUNTED,
      () => (isVisibleAcsIframe(true))
    );

  const iframeModeHandler = (iframeModeOn) =>
    eventBus.$on(
      EVENTS.IFRAME_MODE_ON,
      () => (iframeModeOn(true))
    );

  const sberPayModalHandler = (isSberPayModalVisible) => {
    eventBus.$on(
      EVENTS.SBER_PAY_MODAL_SHOW,
      () => (isSberPayModalVisible(true))
    );
  };

  const sberPayAppModalHandler = (
    isSberPayAppModalVisible,
    isSberPayAppOpened,
    isLoading,
    isVisibleAcceptSberPayBtn
  ) => {
    eventBus.$on(EVENTS.SBER_PAY_APP_MODAL_SHOW, (state) => {
      switch (state) {
        case SBER_PAY_APP_MODAL_STATUS.LOADING:
          isLoading(true);
          break;

        case SBER_PAY_APP_MODAL_STATUS.FAILED:
          isSberPayAppOpened(false);
          isLoading(false);
          break;

        case SBER_PAY_APP_MODAL_STATUS.PREPARE:
          isSberPayAppOpened(false);
          isVisibleAcceptSberPayBtn(true);
          isLoading(false);
          break;

        case SBER_PAY_APP_MODAL_STATUS.SUCCESS:
          isSberPayAppOpened(true);
          isLoading(false);
          break;

        case SBER_PAY_APP_MODAL_STATUS.ERROR:
          isLoading(false);
          break;
      }
      isSberPayAppModalVisible(true);
    });
  };

  const sbpModalHandler = (isSbpModalVisible) => {
    eventBus.$on(EVENTS.SBP_MODAL_SHOW, () => (isSbpModalVisible(true)));
  };

  const wildberriesModalHandler = (isWildberriesModalVisible) => {
    eventBus.$on(EVENTS.WB_MODAL_SHOW, () => (isWildberriesModalVisible(true)));
  };

    const apiErrorHandlerOn = async (cb: (data?: any) => void = () => {}) => {
    eventBus.$on(EVENTS.API_ERROR, async (result: any) => {
      const token = location.hash.slice(1);
      let response: any = {};
      
      const requestPaymentState = async () => {
        response = await state(token);
        await checkPaymentState(response, token);
        cb(response);
      };
      
      if (result && result.name === "Error") {
        navigate({
          pathname: "/error",
          search: location.search,
          hash: location.hash,
        });
      } else {
        switch (result.error) {
          case API_ERROR.UNEXPECTED_REQUEST:
          case API_ERROR.CARD_NOT_SUPPORTED:
          case API_ERROR.SRC_CARD_NOT_SUPPORTED:
          case API_ERROR.DST_CARD_NOT_SUPPORTED:
          case API_ERROR.OTP_BLOCKED:
          case API_ERROR.INVALID_OTP:
          case API_ERROR.AMOUNT_MISMATCH:
          case API_ERROR.CURRENCY_MISMATCH:
          case API_ERROR.CARD_TOKEN_UNRESOLVED:
          case API_ERROR.INTERNAL_ERROR:
          case API_ERROR.CARD_RANGE_BLOCKED:
            cb(result);
            break;
          case API_ERROR.MERCHANT_BLOCKED:
          case API_ERROR.TRANSACTION_NOT_FOUND:
          case API_ERROR.MISSING_PARAMETER:
          case API_ERROR.MERCHANT_NOT_FOUND:
          case API_ERROR.OPERATION_NOT_AVAILABLE:
          case API_ERROR.ACCESS_DENIED:
          case API_ERROR.INVOICE_NOT_FOUND:
          case API_ERROR.ACQUIRING_TYPE_NOT_SUPPORTED_BY_MERCHANT:
          case API_ERROR.PORTAL_NOT_FOUND:
          case API_ERROR.TRANSACTION_NOT_STARTED:
            navigate({
              pathname: "/error",
              search: location.search,
              hash: location.hash,
            });
            break;
          default:
            setTimeout(() => {
              requestPaymentState();
            }, 5000);
        }
      }
    });
  };

  const apiErrorHandlerOff = () => eventBus.$off(EVENTS.API_ERROR);

  const globalLoaderHandler = () => {
    eventBus.$on(EVENTS.GLOBAL_LOADER_SHOW, () => {
      loading(true);
      document.title = i18n.t("tabTitle.processing");
    });
    eventBus.$on(EVENTS.GLOBAL_LOADER_HIDE, () => (loading(false)));
  };

  const localLoaderHandler = ({ localeLoaderShow, localeLoaderHide }) => {
    eventBus.$on(EVENTS.LOCALE_LOADER_SHOW, localeLoaderShow);
    eventBus.$on(EVENTS.LOCALE_LOADER_HIDE, localeLoaderHide);
  };

  const loadersHandler = (hideLoaders) =>
    eventBus.$on(EVENTS.LOADERS_HIDE, hideLoaders);

  const tabTitleHandler = () => {
    eventBus.$on(
      EVENTS.PROCESSING,
      () => (document.title = i18n.t("tabTitle.processing"))
    );
  };

  const setIntervalHandler = (intervalId, shouldTimerContinue = false) => {
    const paymentsWithFetchStateInterval = [
      SRC_TYPE.mir_pay,
      SRC_TYPE.sber_pay,
      SRC_TYPE.sbp,
    ];

    eventBus.$on(EVENTS.CLEAR_INTERVAL, (eventSource) => {
      const id = intervalId;

      if (paymentsWithFetchStateInterval.includes(eventSource as string)) {
        if (shouldTimerContinue) {
          return;
        } else {
          clearInterval(id);
        }
      } else {
        clearInterval(id);
      }
    });
  };

  return {
    iframeHandler,
    sberPayModalHandler,
    wildberriesModalHandler,
    sberPayAppModalHandler,
    sbpModalHandler,
    apiErrorHandlerOn,
    apiErrorHandlerOff,
    globalLoaderHandler,
    localLoaderHandler,
    loadersHandler,
    tabTitleHandler,
    setIntervalHandler,
    iframeModeHandler,
  };
}
