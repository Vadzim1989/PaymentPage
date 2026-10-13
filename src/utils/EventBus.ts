import mitt from "mitt";

export class EventBus {
  private static _instance: EventBus | undefined;
  private _eventBus = mitt();

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus._instance) {
      EventBus._instance = new EventBus();
    }

    return EventBus._instance;
  }

  $emit(event: string, args?: unknown) {
    this._eventBus.emit(event, args);
  }

  $on(event: string, callback: (args: unknown) => void) {
    this._eventBus.on(event, callback);
  }

  $off(event: string, callback?: (args: unknown) => void) {
    this._eventBus.off(event, callback);
  }
}

export const EVENTS = {
  GLOBAL_LOADER_SHOW: "global-loader:show",
  GLOBAL_LOADER_HIDE: "global-loader:hide",
  LOCALE_LOADER_SHOW: "locale-loader:show",
  LOCALE_LOADER_HIDE: "locale-loader:hide",
  IFRAME_ACS_MOUNTED: "acs-iframe:mounted",
  LOADERS_HIDE: "loaders:hide",
  API_ERROR: "api-error",
  PROCESSING: "processing",
  SBER_PAY_MODAL_SHOW: "sber-pay-modal:show",
  SBER_PAY_APP_MODAL_SHOW: "sber-pay-app-modal:show",
  SBP_MODAL_SHOW: "sbp-modal:show",
  WB_MODAL_SHOW: "wildberries-modal:show",
  CLEAR_INTERVAL: "clear:interval",
  IFRAME_MODE_ON: "iframe-mode:on",
};