import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { APPLE_PAY_VERSION } from '@/constants';
import styles from '@/assets/scss/components/PaymentButtons.module.scss';

import ApplePay  from '@/components/paymentButtons/ApplePay';
import { GooglePay } from '@/components/paymentButtons/GooglePay';

interface AppleGooglePaymentsData {
  isApplePayEnabled?: boolean;
  isApplePayOnly?: boolean;
  isGooglePayEnabled?: boolean;
  isGooglePayOnly?: boolean;
}

interface PaymentButtonsProps {
  data?: any;
  appleGooglePaymentsData?: AppleGooglePaymentsData;
}

export const PaymentButtons: React.FC<PaymentButtonsProps> = ({
  data,
  appleGooglePaymentsData = {},
}) => {
  const { t } = useTranslation();

  const [isShowApplePay, setIsShowApplePay] = useState(false);

  // Деструктуризация с дефолтными значениями (аналог toRefs + значение по умолчанию)
  const {
    isApplePayEnabled = false,
    isApplePayOnly = false,
    isGooglePayEnabled = false,
    isGooglePayOnly = false,
  } = appleGooglePaymentsData;

  // Вычисляемые значения (аналог computed)
  const isSupportApplePay = useMemo(() => {
    if (typeof window === 'undefined' || !window.ApplePaySession) {
      return false;
    }
    
    if (data?.options?.recurringPayment) {
      return window.ApplePaySession.supportsVersion(APPLE_PAY_VERSION.fourteen);
    }
    
    return true;
  }, [data?.options?.recurringPayment]);

  const isShowGooglePay = useMemo(() => isGooglePayEnabled, [isGooglePayEnabled]);

  const isPaymentBtnsTitleVisible = useMemo(() => {
    return (isApplePayEnabled || isGooglePayEnabled) && 
           !(isGooglePayOnly || isApplePayOnly);
  }, [isApplePayEnabled, isGooglePayEnabled, isGooglePayOnly, isApplePayOnly]);

  // Условие для ошибки (используем !isSupportApplePay вместо несуществующего applePaySession)
  const showApplePayError = isApplePayEnabled && isApplePayOnly && !isSupportApplePay;

  // Сайд-эффект для проверки Apple Pay (аналог логики вне watch/computed в Vue)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ApplePaySession) {
      return;
    }

    if (isApplePayEnabled && isSupportApplePay) {
      const merchantIdentifier = data?.options?.applePayMerchantIdentifier;
      
      if (merchantIdentifier) {
        window.ApplePaySession.canMakePaymentsWithActiveCard(merchantIdentifier)
          .then((canMakePayments: boolean) => {
            if (canMakePayments) {
              setIsShowApplePay(true);
            }
          })
          .catch((error) => {
            console.warn('Apple Pay check failed:', error);
          });
      }
    }
  }, [isApplePayEnabled, isSupportApplePay, data?.options?.applePayMerchantIdentifier]);

  return (
    <>
      {showApplePayError && (
        <p className={`${styles.applePayError} ${(isShowApplePay || isShowGooglePay) ? styles.withMargin : ''}`}>
          {t('pages.main.applePayError')}
        </p>
      )}

      {(isShowApplePay || isShowGooglePay) && (
        <div className={styles.paymentButtons}>
          {isPaymentBtnsTitleVisible && (
            <p className={styles.title}>
              {t('pages.main.paymentBtnsTitle')}
            </p>
          )}

          <div className={styles.container}>
            {isShowApplePay && (
              <div className={styles.item}>
                <ApplePay data={data} />
              </div>
            )}

            {isShowGooglePay && (
              <div className={styles.item}>
                <GooglePay data={data} className={styles.newStyle} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};