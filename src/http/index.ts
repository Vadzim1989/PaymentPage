import axios from "axios";
import qs from "query-string";
import { eventBusDispatcher } from "../utils/eventBusDispatcher.ts";

function configureAxios() {
  const { openApi } = window.settings;
  const { apiErrorDispatch } = eventBusDispatcher;

  const axiosInstance = axios.create({
    baseURL: `${openApi.baseUrl}/${openApi.version}/${openApi.portal}`,
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });

  axiosInstance.interceptors.request.use((request) => {
    const url = request?.url ?? "";
    if (
      !(
        url.includes("/googlepay/accept") ||
        url.includes("/applepay/accept") ||
        url.includes("/yandexpay/accept")
      )
    ) {
      request.data = qs.stringify(request.data);
    }

    if (!request.data) {
      request.data = null;
    }
    return request;
  });

  axiosInstance.interceptors.request.use((config) => {
    if (!config.data) {
      config.data = null;
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => {
      return response.data;
    },
    (error) => {
      if (error.response) {
        apiErrorDispatch(error.response.data);
        return Promise.reject(error.response);
      } else {
        apiErrorDispatch(error);
        return Promise.reject(error);
      }
    }
  );

  return axiosInstance;
}

export const axiosInstance = configureAxios();
