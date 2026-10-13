import 'react';

// 1. Класс ApplePaySession (без изменений)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare class ApplePaySession {
  constructor(version: number, request: any);
  
  static supportsVersion(version: number): boolean;
  static canMakePayments(): boolean;
  static canMakePaymentsWithActiveCard(merchantIdentifier: string): Promise<boolean>;
  
  static readonly STATUS_SUCCESS: number;
  static readonly STATUS_FAILURE: number;
  static readonly STATUS_INVALID_BILLING_POSTAL_ADDRESS: number;
  static readonly STATUS_INVALID_SHIPPING_POSTAL_ADDRESS: number;
  static readonly STATUS_INVALID_SHIPPING_CONTACT: number;
  static readonly STATUS_PIN_REQUIRED: number;
  static readonly STATUS_PIN_INCORRECT: number;
  static readonly STATUS_PIN_LOCKOUT: number;

  begin(): void;
  abort(): void;
  completeMerchantValidation(merchantSession: any): void;
  completePayment(status: number): void;
  completeShippingMethodSelection(status: number, newTotal: any, newLineItems: any[]): void;
  completeShippingContactSelection(status: number, newShippingMethods: any[], newTotal: any, newLineItems: any[]): void;
  completePaymentMethodSelection(newTotal: any, newLineItems: any[]): void;

  onvalidatemerchant: ((this: ApplePaySession, event: any) => void) | null;
  onpaymentauthorized: ((this: ApplePaySession, event: any) => void) | null;
  onshippingmethodselected: ((this: ApplePaySession, event: any) => void) | null;
  onshippingcontactselected: ((this: ApplePaySession, event: any) => void) | null;
  onpaymentmethodselected: ((this: ApplePaySession, event: any) => void) | null;
  oncancel: ((this: ApplePaySession, event: any) => void) | null;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare namespace google {
  namespace payments {
    namespace api {
      interface PaymentsClient {
        isReadyToPay(request: IsReadyToPayRequest): Promise<{ result: boolean }>;
        loadPaymentData(request: PaymentDataRequest): Promise<PaymentData>;
        prefetchPaymentData(request: PaymentDataRequest): void;
      }
      interface IsReadyToPayRequest {
        apiVersion: number;
        apiVersionMinor: number;
        allowedPaymentMethods: {
          type: string;
          parameters: {
            allowedAuthMethods: string[];
            allowedCardNetworks: string[];
          };
        }[];
      }
      interface PaymentDataRequest {
        apiVersion: number;
        apiVersionMinor: number;
        allowedPaymentMethods: {
          type: string;
          parameters: {
            allowedAuthMethods: string[];
            allowedCardNetworks: string[];
          };
          tokenizationSpecification: {
            type: string;
            parameters: any;
          };
        }[];
        merchantInfo: {
          merchantName: string;
          merchantOrigin: string;
          merchantId: string;
        };
        transactionInfo?: {
          countryCode: string;
          currencyCode: string;
          totalPriceStatus: string;
          totalPrice: string;
        };
        [key: string]: any;
      }
      interface PaymentData {
        paymentMethodData: {
          tokenizationData: {
            token: string;
          };
        };
      }
    }
  }
}

// 2. Глобальные свойства Window (без изменений)
declare global {
  interface Window {
    settings: {
      openApi: {
        baseUrl: string;
        version: string;
        portal: string;
      };
      enableApiLangParam: boolean;
      fetchCheckSberPaymentStateInterval: number;
      redirectType: string;
      stateInProgress: string;
      noSizeIframe: boolean;
      localization: {
        defaultLang: string;
        allowedLanguages: string[];
      };
      "3ds2": {
        supported: boolean;
        versions: string[];
        browserJsDisabled: string;
        deviceFingerprint: boolean;
      };
      applePay: {
        applePayEnabled: boolean;          
        applePayOnly: boolean;
      };
      googlePay: {
        googlePayEnabled: boolean;
        googlePayOnly: boolean;
        googlePayEnvironment: string;
        googlePayAllowedCardAuthMethods: string[];
        googlePayAllowedCardNetworks: string[];
        googlePayRequestType: string;
      };
      payOnlyWithBonus: boolean;
    };
    
    ApplePaySession?: typeof ApplePaySession;
    google?: typeof google;
  }
}

// 3. ПРАВИЛЬНОЕ расширение JSX для React 18+
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'apple-pay-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          buttonstyle?: string;
          type?: string;
          locale?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};