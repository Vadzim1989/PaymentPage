import { EventBus, EVENTS } from "./EventBus";

const eventBus = EventBus.getInstance();

export const eventBusDispatcher = {
  requestProcessing: () => eventBus.$emit(EVENTS.PROCESSING),
  globalLoaderShow: () => eventBus.$emit(EVENTS.GLOBAL_LOADER_SHOW),
  globalLoaderHide: () => eventBus.$emit(EVENTS.GLOBAL_LOADER_HIDE),
  hideLoaders: () => eventBus.$emit(EVENTS.LOADERS_HIDE),
  iframeMounted: () => eventBus.$emit(EVENTS.IFRAME_ACS_MOUNTED),

  apiErrorDispatch: (error: unknown) =>
    eventBus.$emit(EVENTS.API_ERROR, error),

  sberPayModalShow: () => eventBus.$emit(EVENTS.SBER_PAY_MODAL_SHOW),

  sberPayAppModalShow: (state: unknown) =>
    eventBus.$emit(EVENTS.SBER_PAY_APP_MODAL_SHOW, state),

  sbpModalShow: () => eventBus.$emit(EVENTS.SBP_MODAL_SHOW),

  wildberriesModalShow: () => eventBus.$emit(EVENTS.WB_MODAL_SHOW),

  clearFetchStateInterval: (eventSource?: unknown) =>
    eventBus.$emit(EVENTS.CLEAR_INTERVAL, eventSource),

  iframeModeActive: () => eventBus.$emit(EVENTS.IFRAME_MODE_ON),
};