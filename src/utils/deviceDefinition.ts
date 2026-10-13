export function isMobile() {
  return /Android|iPhone|BlackBerry|IEMobile|Windows Phone|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function isIPhone() {
  return /iPhone/i.test(navigator.userAgent);
}
