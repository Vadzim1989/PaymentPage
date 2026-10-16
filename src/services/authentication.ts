import { axiosInstance } from "@/http";

export function authenticationService() {
  const axios = axiosInstance;

  const sendOTP = (token, postData) =>
    axios.post(`/payment/${token}/authentication-confirm`, postData);
  const repeat = (token) =>
    axios.post(`/payment/${token}/authentication-repeat`);
  const decline = (token) =>
    axios.post(`/payment/${token}/authentication-decline`);

  return {
    sendOTP,
    repeat,
    decline,
  };
}

