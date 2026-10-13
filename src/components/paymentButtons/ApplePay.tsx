// src/components/ApplePayButton/ApplePayButton.tsx
import React, { useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { APPLE_PAY_VERSION } from '@/constants/index';
import { paymentService } from '@/services/payment';
import { usePayment } from '@/hooks/usePayment'; 
import { useRecurringPayment } from '@/hooks/useRecurringPayment';
import styles from '@/assets/scss/components/ApplePay.module.scss';

interface ApplePayButtonProps {
  data: any;
}

const ApplePay: React.FC<ApplePayButtonProps> = ({ data }) => {
  const location = useLocation();
  const token = useMemo(() => location.hash.replace('#', ''), [location.hash]);

  const { initPayment, checkPaymentState } = usePayment();
  const service = useMemo(() => paymentService(), []);
  const { getApplePaySession, startApplePayPayment } = service;
  const { getApplePayRecurringPeriod, getRecurringAmount, getRecurringManagementUrl } = useRecurringPayment();

  const isRecurringPayment = useMemo(() => !!data?.options?.recurringPayment, [data?.options?.recurringPayment]);

  // Кэшируем результат валидации мерчанта, чтобы не запрашивать его повторно за одну сессию
  // Аналог payment.appleValidationRes в оригинале
  const validationResponseRef = useRef<any>(null);

  const versionApplePay = useMemo(() => {
    if (typeof window === 'undefined' || !window.ApplePaySession) {
      return null;
    }

    if (isRecurringPayment) {
      return window.ApplePaySession.supportsVersion(APPLE_PAY_VERSION.fourteen)
        ? APPLE_PAY_VERSION.fourteen
        : null;
    }

    return window.ApplePaySession.supportsVersion(APPLE_PAY_VERSION.eleven)
      ? APPLE_PAY_VERSION.eleven
      : APPLE_PAY_VERSION.one;
  }, [isRecurringPayment]);

  const handleApplePayClick = useCallback(() => {
    if (!versionApplePay || typeof window === 'undefined' || !window.ApplePaySession) {
      return;
    }

    const paymentRequest: any = {
      countryCode: data.currency === 'GEL' ? 'GE' : 'RU',
      currencyCode: data.currency,
      total: {
        label: data.merchant?.name || 'Merchant',
        amount: getRecurringAmount(data, true),
      },
      supportedNetworks: ['masterCard', 'visa', 'amex'],
      merchantCapabilities: ['supports3DS'],
    };

    if (isRecurringPayment) {
      const recurringPeriod = getApplePayRecurringPeriod(data);
      Object.assign(paymentRequest, {
        recurringPaymentRequest: {
          paymentDescription: data.description || '',
          billingAgreement: data.description || '',
          regularBilling: {
            label: data.description || '',
            amount: getRecurringAmount(data),
            type: 'final',
            paymentTiming: 'recurring',
            recurringPaymentIntervalUnit: recurringPeriod.unit,
            recurringPaymentIntervalCount: recurringPeriod.count,
          },
          managementURL: getRecurringManagementUrl(data, 'https://account.apple.com'),
        },
      });
    }

    if ([APPLE_PAY_VERSION.fourteen, APPLE_PAY_VERSION.eleven].includes(versionApplePay)) {
      paymentRequest.supportedNetworks.push('mir');
    }

    // Инициализация сессии
    const session = new window.ApplePaySession(versionApplePay, paymentRequest);

    // 1. Валидация мерчанта
    session.onvalidatemerchant = async (event: any) => {
      const validationURL = event.validationURL;

      if (!validationResponseRef.current) {
        try {
          const response = await getApplePaySession(token, validationURL) as any;
          // Приводим строковые таймстампы к числам, как в оригинале
          validationResponseRef.current = {
            ...response,
            epochTimestamp: Number(response.epochTimestamp),
            expiresAt: Number(response.expiresAt),
          };
          session.completeMerchantValidation(validationResponseRef.current);
        } catch (error) {
          console.error('Apple Pay validation failed:', error);
          initPayment(); // Fallback при ошибке
        }
      } else {
        session.completeMerchantValidation(validationResponseRef.current);
      }
    };

    // 2. Авторизация платежа
    session.onpaymentauthorized = async (event: any) => {
      const paymentData = event.payment;
      
      // Мутация данных для совместимости с бэкендом (как в оригинале)
      if (
        paymentData.token &&
        paymentData.token.paymentMethod &&
        !paymentData.token.paymentMethod.type
      ) {
        paymentData.token.paymentMethod.type = 'unknown';
      }

      try {
        const responseData = await startApplePayPayment(token, paymentData);
        checkPaymentState(responseData, token);
        session.completePayment(window.ApplePaySession!.STATUS_SUCCESS);
      } catch (error) {
        console.error('Apple Pay authorization failed:', error);
        initPayment(); // Fallback при ошибке
      }
    };

    // 3. Запуск сессии
    session.begin();
  }, [
    versionApplePay,
    data,
    isRecurringPayment,
    token,
    getApplePaySession,
    getRecurringAmount,
    getApplePayRecurringPeriod,
    getRecurringManagementUrl,
    startApplePayPayment,
    checkPaymentState,
    initPayment,
  ]);

  // Если Apple Pay не поддерживается или версия не определена, не рендерим кнопку
  if (!versionApplePay) {
    return null;
  }

  return (
    <apple-pay-button
      buttonstyle="black"
      type="plain"
      locale="en-US"
      className={`${styles.applePayButton} btn`}
      onClick={handleApplePayClick}
    />
  );
};

export default ApplePay;