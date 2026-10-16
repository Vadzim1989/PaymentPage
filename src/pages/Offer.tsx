import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { authenticationService } from '@/services/authentication';
import { paymentService } from '@/services/payment';
import { usePayment } from '@/hooks/usePayment';
import { usePaymentAvailability } from '@/hooks/usePaymentAvailability';
import { useEventBusHandler } from '@/hooks/useEventBusHandler';

import { FormHeader } from '@/components/FormHeader';

import Formatter from '@/utils/formatter';
import { eventBusDispatcher } from '@/utils/eventBusDispatcher';
import { cardBrandImages } from '@/constants/cardBrandImages';
import { PAYMENT_ID, STATE } from '@/constants';

import '@/assets/scss/pages/Offer.scss';

const DELAY = 5000;
const EXPIRATION_TIME = 60;
const COUNT_INTERVAL = 1000;

const Offer = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();

  const { repeat, decline, sendOTP } = authenticationService();
  const { checkPaymentState } = usePayment();
  const { apiErrorHandlerOn, apiErrorHandlerOff } = useEventBusHandler();
  const { globalLoaderShow, globalLoaderHide } = eventBusDispatcher;
  const { state } = paymentService();

  const paymentState = usePaymentAvailability();

  const [expirationTimeInSecond, setExpirationTimeInSecond] = useState(EXPIRATION_TIME);
  const [otpCode, setOtpCode] = useState('');
  const [isSuccessfulMsgVisible, setIsSuccessfulMsgVisible] = useState(false);
  const [isFailedMsgVisible, setIsFailedMsgVisible] = useState(false);
  const [isFailedOtpResend, setIsFailedOtpResend] = useState(false);
  const [isOtpResendBtnClicked, setIsOtpResendBtnClicked] = useState(false);
  const [isSubmitBtnClicked, setIsSubmitBtnClicked] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const hideMsgTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsedParams = useMemo(() => {
    if (params?.payment) {
      try {
        return JSON.parse(params.payment);
      } catch {
        return null;
      }
    }
    return paymentState?.payment;
  }, [params, paymentState]);

  const commission = parsedParams?.options?.commission;

  const isExpiredTimerErrorMsgVisible = useMemo(
    () => expirationTimeInSecond === 0 && !isFailedOtpResend,
    [expirationTimeInSecond, isFailedOtpResend],
  );

  const isPaymentErrorMsgVisible = useMemo(
    () => expirationTimeInSecond !== 0 && !!attemptsLeft && isSubmitBtnClicked,
    [expirationTimeInSecond, attemptsLeft, isSubmitBtnClicked],
  );

  const isOtpSendingMsgVisible = useMemo(
    () => isSuccessfulMsgVisible || isFailedMsgVisible,
    [isSuccessfulMsgVisible, isFailedMsgVisible],
  );

  const isP2p = useMemo(
    () => paymentState?.paymentId?.toLowerCase() === PAYMENT_ID.P2P,
    [paymentState],
  );

  const transactionInfo = useMemo(() => {
    const totalAmount =
      paymentState?.amount + (paymentState?.commission ?? commission);

    return [
      {
        title: t('pages.threeDSLight.table.merchant'),
        value: paymentState?.merchant?.name,
      },
      {
        title: t('pages.result.table.issuerId').slice(0, -1),
        value: paymentState?.src?.issuerId,
      },
      {
        title: t('pages.threeDSLight.table.totalAmount'),
        value: `${Formatter.formatCurrencyWithDot(totalAmount)} ${Formatter.currency(paymentState?.currency)}`,
      },
      {
        title: t('pages.result.table.pan.src').slice(0, -1),
        value: Formatter.formatGCLocalCardPan(paymentState?.src?.pan),
      },
    ].filter((item) => item.value);
  }, [paymentState, commission, t]);

  const payBtnText = useMemo(() => {
    const sum = paymentState?.amount;
    const totalAmount = sum + (paymentState?.commission ?? commission);

    const pathToBtnText =
      paymentState?.paymentId === PAYMENT_ID.OCT || isP2p
        ? 'ui.btn.transfer'
        : 'ui.btn.pay';

    return t(pathToBtnText, {
      amount: Formatter.formatCurrencyWithDot(totalAmount),
      currency: Formatter.currency(paymentState?.currency),
    });
  }, [paymentState, commission, isP2p, t]);

  useEffect(() => {
    const interval = setInterval(() => {
      setExpirationTimeInSecond((prev) => (prev !== 0 ? prev - 1 : 0));
    }, COUNT_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const apiErrorHandlerCb = useCallback(
    async (result: any) => {
      if (isOtpResendBtnClicked) {
        setIsFailedMsgVisible(true);
        setIsFailedOtpResend(true);

        hideMsgTimeoutRef.current = setTimeout(() => {
          setIsFailedMsgVisible(false);
          setIsOtpResendBtnClicked(false);
        }, DELAY);
      } else if (isSubmitBtnClicked) {
        setAttemptsLeft(result.attemptsLeft);
      } else {
        const response = await state(paymentState?.token);
        await checkPaymentState(response, paymentState?.token);
      }
    },
    [isOtpResendBtnClicked, isSubmitBtnClicked, paymentState?.token, state, checkPaymentState],
  );

  const apiErrorHandlerCbRef = useRef(apiErrorHandlerCb);
  useEffect(() => {
    apiErrorHandlerCbRef.current = apiErrorHandlerCb;
  }, [apiErrorHandlerCb]);

  useEffect(() => {
    apiErrorHandlerOn((result: any) => apiErrorHandlerCbRef.current(result));

    return () => {
      apiErrorHandlerOff();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (hideMsgTimeoutRef.current) {
        clearTimeout(hideMsgTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (paymentState?.state === STATE['3DS2INFO']) {
      globalLoaderHide();
      const token = location.hash.slice(1);

      const timeout = setTimeout(async () => {
        globalLoaderShow();
        const response = await state(token);
        await checkPaymentState(response, token);
      }, 30000);

      return () => clearTimeout(timeout);
    }
  }, [paymentState, location.hash, globalLoaderShow, globalLoaderHide, state, checkPaymentState]);

  const resendOtpCode = useCallback(async () => {
    if (expirationTimeInSecond !== 0) {
      return;
    }

    setIsSubmitBtnClicked(false);
    setIsOtpResendBtnClicked(true);

    await repeat(paymentState?.token);

    setExpirationTimeInSecond(EXPIRATION_TIME);
    setIsSuccessfulMsgVisible(true);

    hideMsgTimeoutRef.current = setTimeout(() => {
      setIsSuccessfulMsgVisible(false);
      setIsOtpResendBtnClicked(false);
    }, DELAY);
  }, [expirationTimeInSecond, paymentState?.token, repeat]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!otpCode) return;

      setAttemptsLeft(null);
      setIsSubmitBtnClicked(true);
      setIsOtpResendBtnClicked(false);

      const response = await sendOTP(paymentState?.token, { authCode: otpCode });
      await checkPaymentState(response, paymentState?.token);
    },
    [otpCode, paymentState?.token, sendOTP, checkPaymentState],
  );

  const onCancel = useCallback(async () => {
    setIsSubmitBtnClicked(false);
    setIsOtpResendBtnClicked(false);

    const response = await decline(paymentState?.token);
    await checkPaymentState(response, paymentState?.token);
  }, [paymentState?.token, decline, checkPaymentState]);

  if (!paymentState) return null;

  const is3DS2Info = paymentState?.state === STATE['3DS2INFO'];

  return (
    <div className="offer-form">
      <div className={is3DS2Info ? 'container' : 'layout'}>
        {!is3DS2Info ? (
          <form className="form" onSubmit={onSubmit}>
            <FormHeader data={paymentState} hiddenPayInfo={isP2p} />

            <section className="form-body">
              <div className="result-table">
                <div className="result-table__header">
                  <div className="merchant-logo">
                    <img src={paymentState?.merchant?.logoUrl} alt="merchant" />
                  </div>
                  <p>{t('pages.threeDSLight.table.autorization')}</p>
                </div>

                {transactionInfo.map((item) => (
                  <div className="result-table__item item" key={item.value}>
                    <div className="item__key">{item.title}</div>
                    <div className="item__value">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="otp-container">
                <p className="otp-title">{t('pages.threeDSLight.otp.title')}</p>

                <div className="input-container">
                  <div className="authentication-field">
                    <input
                      type="tel"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder={t('ui.input.otp.placeholder')}
                      maxLength={8}
                    />

                    <button
                      className="input-container__btn-otp-resend"
                      type="button"
                      onClick={resendOtpCode}
                    >
                      <div className="lds-dual-ring" />
                      {t('ui.btn.getOtpCode')}
                    </button>
                  </div>

                  {isExpiredTimerErrorMsgVisible && (
                    <p className="input-container__error">
                      {t('pages.threeDSLight.otp.expiredTimer')}»
                    </p>
                  )}

                  {isPaymentErrorMsgVisible && (
                    <p className="input-container__error">
                      {t('pages.threeDSLight.paymentError', { 0: attemptsLeft ?? 0 })}
                    </p>
                  )}

                  {isOtpSendingMsgVisible && (
                    <p
                      className={[
                        'input-container__otp-sending-result',
                        isSuccessfulMsgVisible ? 'success' : '',
                        isFailedMsgVisible ? 'failed' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {t(
                        `pages.threeDSLight.otp.sendingOtpResult.${isSuccessfulMsgVisible ? 'success' : 'failed'}`,
                      )}
                    </p>
                  )}

                  <p className="input-container__timer">
                    {t('pages.threeDSLight.otp.timer', { 0: expirationTimeInSecond })}
                  </p>
                </div>
              </div>

              <div className="btn-group">
                <button
                  className="sendOTP btn"
                  type="submit"
                  disabled={expirationTimeInSecond === 0}
                >
                  {payBtnText}
                </button>

                <button
                  className="cancel btn btn-secondary"
                  type="button"
                  onClick={onCancel}
                >
                  {t('ui.btn.cancel')}
                </button>
              </div>
            </section>

            <section className="form-footer">
              <div className="brand-logo">
                <img
                  src={cardBrandImages[paymentState?.src?.paymentSystem]}
                  alt="Card Brand"
                />
              </div>

              <div className="info">
                <p className="title">{t('pages.threeDSLight.footer.phone.title')}</p>
                <a href={`tel:${t('pages.threeDSLight.footer.phone.value')}`}>
                  {t('pages.threeDSLight.footer.phone.value')}
                </a>
              </div>

              <div className="info">
                <p className="title">{t('pages.result.table.merchant')}</p>
                <a
                  href={paymentState?.merchant?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  {paymentState?.merchant?.url}
                </a>
              </div>
            </section>
          </form>
        ) : (
          <div className="treeDS-info">
            <div className="treeDS-info__title">{t('pages.offer.titleTreeDSInfo')}</div>
            <div className="treeDS-info__description">{paymentState?.cardholderInfo}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Offer;
