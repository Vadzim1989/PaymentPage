/**
 * @function browserInfo
 *
 * @desc Collects available frontend browser info
 * and store it in the properties dictated by the EMVCo spec
 * (3DS_Spec_protocolAndCoreFny_v2-1_Oct2017.pdf)
 *
 * @example const browserInfo = browserInfo();
 * const userAgent = browserInfo.userAgent;
 *
 * @returns {Object} - browserInfo an object containing the retrieved browser properties
 */

import store from "@/store/store";

function calcChallengeWindowSize(width) {
  if (width <= 390) {
    return "01";
  } else if (width <= 500) {
    return "02";
  } else {
    return "03";
  }
}

export function get3dsVersion(versions) {
  let version = "";
  const toNumber = (param) => +param.split(".").join("");

  versions
    .sort((prev, next) => toNumber(prev) - toNumber(next))
    .forEach((value) => {
      if (window.settings["3ds2"].versions.includes(value)) {
        version = value;
      }
    });

  return version;
}

const browserInfo = (versions3ds) => {
  let isFramed;
  const version = get3dsVersion(versions3ds);
  const data = {
    version,
    "device.channel": "BRW",
    "device.browserAcceptHeader":
      "application/json, text/javascript, */*; q=0.01",
    "device.browserJavaEnabled": navigator.javaEnabled(),
    "device.browserLanguage": navigator.language,
    "device.browserColorDepth": screen.colorDepth === 0 ? 1 : screen.colorDepth,
    "device.browserScreenHeight": screen.height,
    "device.browserScreenWidth": screen.width,
    "device.browserTZ": new Date().getTimezoneOffset(),
    "device.browserUserAgent": navigator.userAgent,
  };

  if (
    store.getState().payment.deviceFingerprint &&
    window.settings["3ds2"].deviceFingerprint
  ) {
    const deviceFingerprint = store.getState().payment.deviceFingerprint ?? "";
    data["device.fingerprint"] = atob(deviceFingerprint.replace(/-/g, '+').replace(/_/g, '/'));
  }

  try {
  const topWindow = window.top;
  
  isFramed = 
    topWindow === null ||
    window !== topWindow ||
    document !== topWindow.document ||
    self.location !== topWindow.location;
  // eslint-disable-next-line
  } catch (error) {
    isFramed = true;
  }

  if (isFramed) {
    data["challengeWindowSize"] = calcChallengeWindowSize(
      window.innerWidth || 600
    );
  } else {
    data["challengeWindowSize"] = calcChallengeWindowSize(screen.width || 600);
  }

  if (
    window.settings["3ds2"].browserJsDisabled &&
    version === window.settings["3ds2"].browserJsDisabled
  ) {
    data["device.browserJavascriptEnabled"] = false;
  }

  return data;
};

export default browserInfo;
