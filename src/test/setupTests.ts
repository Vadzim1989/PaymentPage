import '@testing-library/jest-dom'

// Мок настроек, которые читаются на этапе импорта модулей (http, useUrlParser и т.д.).
// Без него любой тест падает с "Cannot read properties of undefined".
window.settings = {
  openApi: {
    baseUrl: 'http://localhost',
    version: 'v1',
    portal: 'test',
  },
  enableApiLangParam: false,
  fetchCheckSberPaymentStateInterval: 5000,
  redirectType: 'post_params',
  stateInProgress: 'no',
  noSizeIframe: true,
  localization: {
    defaultLang: 'ru',
    allowedLanguages: ['ru', 'en'],
  },
  '3ds2': {
    supported: true,
    versions: ['2.1.0'],
    browserJsDisabled: '',
    deviceFingerprint: false,
  },
  applePay: {
    applePayEnabled: false,
    applePayOnly: false,
  },
  googlePay: {
    googlePayEnabled: false,
    googlePayOnly: false,
    googlePayEnvironment: 'TEST',
    googlePayAllowedCardAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
    googlePayAllowedCardNetworks: ['MASTERCARD', 'VISA'],
    googlePayRequestType: 'PAYMENT_GATEWAY',
  },
  payOnlyWithBonus: false,
}