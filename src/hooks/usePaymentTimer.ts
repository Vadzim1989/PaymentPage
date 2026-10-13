import { useRef } from "react";
import { eventBusDispatcher } from "@/utils/eventBusDispatcher";
import { usePayment } from "@/hooks/usePayment";
import { STATE } from "@/constants/index";
import Formatter from "@/utils/formatter";

export function usePaymentTimer(paymentState, timer, setTimer) {
    const countInterval = 1000;
    const requestPaymentStateCount = useRef(0);
    const MAX_NUM_STATUS_REQUEST = 3;
    const { requestPaymentState } = usePayment();
    const { globalLoaderShow, globalLoaderHide, clearFetchStateInterval } =
      eventBusDispatcher;

    function getPaymentExpiryTime() {
      const transactionStartedTime = paymentState?.options?.offerStartedAt;
      const transactionExpirationTimeout =
        paymentState?.options?.offerTimeout;
      const expirationTime =
        Formatter.getTimeWithoutMilliseconds(transactionStartedTime) +
        Formatter.getTimeWithoutMilliseconds(transactionExpirationTimeout);
      const dateNow = Formatter.getTimeWithoutMilliseconds(new Date().getTime());

      return expirationTime - dateNow;
    }

    async function paymentExpirationTimerCb() {
      if (timer !== 0) {
        setTimer(timer - 1000);
      } else {
        if (requestPaymentStateCount.current === MAX_NUM_STATUS_REQUEST) {
          return;
        }

        globalLoaderShow();
        requestPaymentStateCount.current += 1;
        clearFetchStateInterval();
        await requestPaymentState();

        if (
          paymentState?.state !== STATE.RESULT ||
          requestPaymentStateCount.current < MAX_NUM_STATUS_REQUEST
        ) {
          globalLoaderHide();
        }
      }
    }

    return { getPaymentExpiryTime, paymentExpirationTimerCb, countInterval };
}
