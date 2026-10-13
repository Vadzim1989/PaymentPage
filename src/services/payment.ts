import { axiosInstance } from "@/http";
import browserInfo from "@/utils/3dsv2helper";

export function paymentService() {
  const axios = axiosInstance;
  const headerJson = { "Content-Type": "application/json; charset=UTF-8" };
  const pathTransaction = "/payment";

  const token = (): any => axios.post(`/token`);
  const state = (token): any => axios.post(`/payment/${token}`);
  const start = (token, postData) =>
    axios.post(`/payment/${token}/start`, postData);
  const accept = (token, postData) =>
    axios.post(`${pathTransaction}/${token}/accept`, postData);
  const decline = (token) => axios.post(`/payment/${token}/decline`);
  const prepareAccept = (token, { versions = [] }) => {
    const postData = browserInfo(versions);
    return axios.post(
      `${pathTransaction}/${token}/3ds2-prepare/accept`,
      postData
    );
  };
  const prepareReject = (token) =>
    axios.post(`${pathTransaction}/${token}/3ds2-prepare/reject`);
  const startGooglePayment = (token, postData) =>
    axios.post(`${pathTransaction}/${token}/googlepay/accept`, postData, {
      headers: headerJson,
    });
  const getApplePaySession = (token, url) =>
    axios.post(`${pathTransaction}/${token}/applepay/validate`, {
      merchantValidationUrl: url,
    });
  const startApplePayPayment = (token, postData) =>{
    return axios.post(`${pathTransaction}/${token}/applepay/accept`, postData, {
      headers: headerJson,
    });
  }
  const startMirPayPayment = (token) =>
    axios.post(`${pathTransaction}/${token}/mirpay/accept`);
  const startNewMirPayPayment = (token) =>
    axios.post(`${pathTransaction}/${token}/mirpay/prepare`);
  const sendingReceipt = (token, postData) =>
    axios.post(`${pathTransaction}/${token}/send-receipt`, postData);
  const getPdfFromServer = (token) =>
    axios.get(`${pathTransaction}/${token}/receipt`, {
      responseType: "arraybuffer",
    });

  const startYaPayPayment = (token, postData) =>
    axios.post(`${pathTransaction}/${token}/yandexpay/accept`, postData, {
      headers: headerJson,
    });

  const sendSberPayPhone = (token, postData) =>
    axios.post(`${pathTransaction}/${token}/sberpay/push`, postData);

  const checkPayment = (merchantId) => axios.get(`/payment/registration-permission/${merchantId}`);

  const checkInvoice = (invoiceId, params) => axios.get(`/invoice/${invoiceId}`, { params });
  const getCardsRanges = () => axios.get('/payment/card/ranges');

  return {
    token,
    state,
    start,
    accept,
    decline,
    prepareAccept,
    prepareReject,
    startGooglePayment,
    sendingReceipt,
    getApplePaySession,
    startApplePayPayment,
    startMirPayPayment,
    startNewMirPayPayment,
    getPdfFromServer,
    startYaPayPayment,
    sendSberPayPhone,
    checkPayment,
    checkInvoice,
    getCardsRanges
  };
}
