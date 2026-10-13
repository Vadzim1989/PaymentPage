import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { paymentService } from '@/services/payment';
import { usePayment } from '@/hooks/usePayment';
import { useLoader } from '@/hooks/useLoader';
import { useRecurringPayment } from '@/hooks/useRecurringPayment';
import styles from '@/assets/scss/components/GooglePay.module.scss';

interface GooglePayButtonProps {
  data: any;
  className?: string;
}

export const GooglePay: React.FC<GooglePayButtonProps> = ({ data, className }) => {
  const location = useLocation();
  const token = useMemo(() => location.hash.replace('#', ''), [location.hash]);

  const { initPayment, checkPaymentState } = usePayment();
  const service = useMemo(() => paymentService(), []);
  const { startGooglePayment } = service;
  const { globalLoaderShow, hideLoaders } = useLoader();
  const { getRecurringAmount, getRecurringManagementUrl } = useRecurringPayment();

  const [isReadyToPay, setIsReadyToPay] = useState(false);

  const googlePayClient = useMemo(() => {
    if (typeof window !== 'undefined' && (window as any).google?.payments?.api) {
      const env = window.settings?.googlePay?.googlePayEnvironment || 'TEST';
      return new (window as any).google.payments.api.PaymentsClient({
        environment: env,
      });
    }
    return null;
  }, []);

  const getGoogleBaseRequest = useCallback((): google.payments.api.IsReadyToPayRequest => {
    const defaultAuthMethods: google.payments.api.CardAuthMethod[] = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];
    const defaultCardNetworks: google.payments.api.CardNetwork[] = ['MASTERCARD', 'VISA'];
    const settingsGPay = window.settings?.googlePay;

    return {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods:
              (settingsGPay?.googlePayAllowedCardAuthMethods as google.payments.api.CardAuthMethod[]) ||
              defaultAuthMethods,
            allowedCardNetworks:
              (settingsGPay?.googlePayAllowedCardNetworks as google.payments.api.CardNetwork[]) ||
              defaultCardNetworks,
          },
        },
      ],
    };
  }, []);

  const getGooglePaymentDataRequest = useCallback((): google.payments.api.PaymentDataRequest => {
    const settingsGPay = window.settings?.googlePay || {};
    const googlePayRequestType = settingsGPay.googlePayRequestType || 'PAYMENT_GATEWAY';
    
    const paymentDataRequest: google.payments.api.PaymentDataRequest = {
      ...getGoogleBaseRequest(),
      allowedPaymentMethods: [
        {
          ...getGoogleBaseRequest().allowedPaymentMethods[0],
          tokenizationSpecification: {
            type: googlePayRequestType as any,
            parameters:
              googlePayRequestType === 'DIRECT'
                ? {
                    protocolVersion: 'ECv2',
                    publicKey: data?.options?.googlePayMerchantPublicKey || '',
                  }
                : {
                    gateway: data?.options?.googlePayGatewayId || '',
                    gatewayMerchantId: data?.options?.googlePayGatewayMerchantId || '',
                  },
          },
        },
      ],
      merchantInfo: {
        merchantName: data?.options?.googlePayMerchantName || '',
        merchantId:
          googlePayRequestType === 'DIRECT'
            ? data?.options?.googlePayMerchantId || ''
            : data?.options?.googlePayGatewayMerchantId || '',
      },
    };

    if (!data?.options?.recurringPayment) {
      paymentDataRequest.transactionInfo = {
        countryCode: 'RU',
        currencyCode: data?.currency || 'RUB',
        totalPriceStatus: 'FINAL',
        totalPrice: getRecurringAmount(data).toString(),
      };
    } else {
      (paymentDataRequest as any).recurringTransactionInfo = {
        countryCode: 'RU',
        currencyCode: data?.currency || 'RUB',
        billingAgreement: data?.description || '',
        immediateTotalPrice: getRecurringAmount(data, true).toString(),
        recurrenceItems: [
          {
            label: data?.description || '',
            price: getRecurringAmount(data).toString(),
            priceStatus: 'FINAL',
            recurrencePeriod: (data?.options?.recurringIntervalUnit || 'month').toUpperCase(),
            recurrencePeriodCount: data?.options?.recurringIntervalCount || 1,
          },
        ],
        managementUrl: getRecurringManagementUrl(data, 'https://myaccount.google.com'),
      };
    }

    return paymentDataRequest;
  }, [data, getGoogleBaseRequest, getRecurringAmount, getRecurringManagementUrl]);

  const prefetchGooglePaymentData = useCallback(() => {
    if (data?.options?.recurringPayment || !googlePayClient) return;
    
    const paymentDataRequest = getGooglePaymentDataRequest();
    paymentDataRequest.transactionInfo = {
      totalPriceStatus: 'NOT_CURRENTLY_KNOWN',
      totalPrice: '0',
      currencyCode: data?.currency || 'RUB',
    };
    
    googlePayClient.prefetchPaymentData(paymentDataRequest);
  }, [data, googlePayClient, getGooglePaymentDataRequest]);

  useEffect(() => {
    if (!googlePayClient || !data) return;

    const baseRequest = getGoogleBaseRequest();
    
    googlePayClient
      .isReadyToPay(baseRequest)
      .then((response) => {
        if (response.result) {
          setIsReadyToPay(true); 
          prefetchGooglePaymentData();
        } else {
          console.log('Google Pay is not available');
        }
      })
      .catch((err) => {
        console.error('Google Pay isReadyToPay error:', err);
      });
  }, [data, googlePayClient, getGoogleBaseRequest, prefetchGooglePaymentData]);

  const handleGooglePayClick = useCallback(async () => {
    if (!googlePayClient) return;

    const paymentDataRequest = getGooglePaymentDataRequest();

    try {
      const paymentData = await googlePayClient.loadPaymentData(paymentDataRequest);
      const paymentToken = paymentData.paymentMethodData.tokenizationData.token;

      globalLoaderShow();
      
      const responseData = await startGooglePayment(token, paymentToken);
      await checkPaymentState(responseData, token);

      hideLoaders();
    } catch (err: any) {
      console.error('Google Pay loadPaymentData error:', err);
      if (err.statusCode !== 'CANCELED') {
        initPayment();
      }
      hideLoaders();
    }
  }, [token, googlePayClient, getGooglePaymentDataRequest, globalLoaderShow, startGooglePayment, checkPaymentState, initPayment, hideLoaders]);

  if (!isReadyToPay || !googlePayClient) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Google Pay"
      className={[styles.gpayButton, className, 'btn', 'black', 'short', 'en']
        .filter(Boolean)
        .join(' ')}
      onClick={handleGooglePayClick}
    />
  );
};
