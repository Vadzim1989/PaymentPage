import { SRC_TYPE } from "../constants";

export function usePayState(
  paymentState,
  { sberPayRegisterError, sbpRegisterError }
) {
  function onUpdatePaymentState(response, source) {
    switch (source) {
      case SRC_TYPE.sber_pay: {
        sberPayRegisterError(!response?.options?.sbolDeepLink);
        break;
      }
      case SRC_TYPE.sbp: {
        sbpRegisterError(!response?.options?.sbpPayload);
        break;
      }
    }

    paymentState(response);
  }

  return { onUpdatePaymentState };
}
