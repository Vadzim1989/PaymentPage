window.settings = {
  openApi: {
     baseUrl: "https://openapi-entry-pga-bg.intervale.ru/api",
     version: "v4",
     portal: "F99B664D6D9B2DB0806656F28E3A4DF9",
    // baseUrl: "https://openapi-entry-pga-bg-preprod.intervale.ru/api",
    // version: "v4",
    // portal: "AF40359BB08A0A52476C9186CA0446C4",
  },
  enableApiLangParam: true,
  localization: {
    defaultLang: "ru",
    allowedLanguages: ["ru", "en", "ka", "tr"],
  },
  "3ds2": {
    supported: true,
    versions: ["2.1.0", "2.2.0","2.3.1"],
    browserJsDisabled: "2.2.0"
  },
  applePay: {
    applePayEnabled: true, // отключает--включает applePay            
    applePayOnly: false, // отключает--включает платежи только через applePay
  },
  googlePay: {
    // googlePayEnvironment: 'PRODUCTION', // default is 'TEST'
    // googlePayRequestType: 'DIRECT', // default is 'PAYMENT_GATEWAY'. DIRECT используется до версии PGA 4.2.10
    // googlePayAllowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'],
    // googlePayAllowedCardAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
    googlePayEnabled: true, //отключает--включает google pay
    googlePayOnly: false, // отключает--включает платежи только через googlePay
  },
  payOnlyWithBonus: false, //отключает--включает платежи только через бонус
};
