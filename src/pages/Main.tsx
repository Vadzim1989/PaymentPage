import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { FormHeader } from '@/components/FormHeader';
import SrcCard from '@/components/creditcard/SrcCard';
import DstCard from '@/components/creditcard/DstCard';
import CardHolder from '@/components/ui/CardHolder';
import Checkbox from '@/components/ui/Checkbox';
import Amount from '@/components/ui/Amount';
import Loader from '@/components/common/Loader';
import { PaymentButtons } from '@/components/PaymentButtons';

import { paymentService } from '@/services/payment';
import { usePayment } from '@/hooks/usePayment';
import { useLoader } from '@/hooks/useLoader';
import { useCard } from '@/hooks/useCard';
import { usePayBonus } from '@/hooks/usePayBonus';
import { useCommission } from '@/hooks/useCommission';
import { useEventBusHandler } from '@/hooks/useEventBusHandler';
import { useTabTitle } from '@/hooks/useTabTitle';

import Formatter from '@/utils/formatter';
import { isPanInRange } from '@/utils/checkBinRanges';
import { getCardBrandName } from '@/utils/creditcard';
import { eventBusDispatcher } from '@/utils/eventBusDispatcher';
import { setIsOpenApiMirPaySupported } from '@/store/store';

import { PAYMENT_ID, CARD_BRAND, API_ERROR, STATE, CURRENCY } from '@/constants';

import '@/assets/scss/pages/Main.scss';

type MainFormValues = {
  'src-pan': string;
  'dst-pan': string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  cardholder: string;
  amount: string;
  addToProfile: boolean;
  agreement: boolean;
};

type Destination = 'src' | 'dst' | 'amount';

const allowableCardBrandListForP2p: string[] = [
  CARD_BRAND.VISA,
  CARD_BRAND.MASTERCARD,
  CARD_BRAND.GCLOCAL,
];

const Main = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const dispatch = useDispatch();

  const service = useMemo(() => paymentService(), []);
  const { accept, state } = service;

  const { initPayment, checkPaymentState, paymentState, isP2p, setPaymentState } =
    usePayment();
  const { card, setCard, isValidPan, getSrcCardParams, getDstCardParams } = useCard();

  const [loading, setLoading] = useState(false);
  const [isVisibleAcsIframe, setIsVisibleAcsIframe] = useState(false);
  const [inputName, setInputName] = useState('');
  const [apiError, setApiError] = useState('');
  const [apiDstPanError, setApiDstPanError] = useState('');

  const methods = useForm<MainFormValues>({
    mode: 'onBlur',
    defaultValues: {
      'src-pan': '',
      'dst-pan': '',
      expiryMonth: '',
      expiryYear: '',
      cvc: '',
      cardholder: '',
      amount: '',
      addToProfile: false,
      agreement: false,
    },
  });

  const { handleSubmit, control, setError, clearErrors, setValue, formState } = methods;
  const errors = formState.errors;

  const watched = useWatch({ control });
  const srcPan = watched['src-pan'] ?? '';
  const dstPan = watched['dst-pan'] ?? '';
  const amount = watched.amount ?? '';

  // Синхронизируем значения формы в useCard, чтобы работали isValidPan и getSrcCardParams.
  useEffect(() => {
    setCard((prev) => ({
      ...prev,
      pan: srcPan,
      cvc: watched.cvc ?? '',
      expiryMonth: watched.expiryMonth ?? '',
      expiryYear: watched.expiryYear ?? '',
      holder: watched.cardholder ?? '',
      save: !!watched.addToProfile,
    }));
  }, [
    srcPan,
    watched.cvc,
    watched.expiryMonth,
    watched.expiryYear,
    watched.cardholder,
    watched.addToProfile,
    setCard,
  ]);

  const { globalLoaderShow, localeLoaderShow, hideLoaders } = useLoader(setLoading);
  const { isEnabledBonus, isEnabledMrBonus, isEnabledSCoolBonus } = usePayBonus(
    card.pan,
    paymentState?.options,
  );
  const { commission, commissionInfo } = useCommission(card.pan, paymentState, amount);
  const { iframeHandler, apiErrorHandlerOn, apiErrorHandlerOff } = useEventBusHandler();
  const { setTabTitle } = useTabTitle();
  const { requestProcessing } = eventBusDispatcher;

  const payOnlyWithBonus = window.settings?.payOnlyWithBonus ?? false;
  const applePay = window.settings?.applePay;
  const googlePay = window.settings?.googlePay;

  const isUPI = useMemo(() => getCardBrandName(card.pan) === 'UPI', [card.pan]);

  const transferCondition = useMemo(
    () =>
      paymentState?.paymentId === PAYMENT_ID.AFT ||
      paymentState?.paymentId === PAYMENT_ID.OCT,
    [paymentState],
  );

  const isBonusButtonsVisible = useMemo(
    () =>
      isEnabledBonus && isEnabledMrBonus && isEnabledSCoolBonus && isValidPan,
    [isEnabledBonus, isEnabledMrBonus, isEnabledSCoolBonus, isValidPan],
  );

  const isApplePayEnabled = useMemo(
    () =>
      !!(
        applePay?.applePayEnabled &&
        paymentState?.options?.applePayMerchantIdentifier
      ),
    [applePay, paymentState],
  );

  const isApplePayOnly = useMemo(
    () => (isApplePayEnabled ? !!applePay?.applePayOnly : false),
    [isApplePayEnabled, applePay],
  );

  const isGooglePayEnabled = useMemo(() => {
    const gpayQuery = new URLSearchParams(location.search).get('gpay');

    return !!(
      (gpayQuery || googlePay?.googlePayEnabled) &&
      (paymentState?.options?.googlePayMerchantPublicKey ||
        (googlePay?.googlePayRequestType !== 'DIRECT' &&
          paymentState?.options?.googlePayGatewayId))
    );
  }, [location.search, googlePay, paymentState]);

  const isGooglePayOnly = useMemo(
    () => (isGooglePayEnabled ? !!googlePay?.googlePayOnly : false),
    [isGooglePayEnabled, googlePay],
  );

  const appleGooglePaymentsData = useMemo(
    () => ({
      isApplePayEnabled,
      isApplePayOnly,
      isGooglePayEnabled,
      isGooglePayOnly,
    }),
    [isApplePayEnabled, isApplePayOnly, isGooglePayEnabled, isGooglePayOnly],
  );

  const isVisibleBlockWithApplePayOnlyOrGooglePayOnlyEnabled = useMemo(() => {
    const isAppleOnlyOrGoogleOnly = isApplePayOnly || isGooglePayOnly;
    const isAppleOnlyAndGoogleOnly = isApplePayOnly && isGooglePayOnly;

    return !isAppleOnlyAndGoogleOnly && !isAppleOnlyOrGoogleOnly;
  }, [isApplePayOnly, isGooglePayOnly]);

  const isVisibleComission = useMemo(() => {
    if (!paymentState?.options?.commissionRules) return false;

    return isP2p
      ? !!(isValidPan && amount)
      : transferCondition
        ? false
        : isValidPan;
  }, [paymentState, isP2p, isValidPan, amount, transferCondition]);

  const isBonusVisible = useMemo(
    () =>
      !isP2p &&
      !transferCondition &&
      isValidPan &&
      paymentState?.currency === CURRENCY.GEL &&
      (isEnabledBonus || isEnabledMrBonus || isEnabledSCoolBonus),
    [
      isP2p,
      transferCondition,
      isValidPan,
      paymentState,
      isEnabledBonus,
      isEnabledMrBonus,
      isEnabledSCoolBonus,
    ],
  );

  const isPaymentButtonVisible = useMemo(() => {
    return paymentState?.params?.card_on_file !== 'CIT';
  }, [paymentState]);

  const isFormHeaderVisible = useMemo(
    () =>
      !!paymentState &&
      paymentState?.state !== STATE['3DS2PREPARE'] &&
      paymentState?.state !== STATE.IFRAME,
    [paymentState],
  );

  const isFormBodyVisible = useMemo(
    () =>
      !!paymentState &&
      paymentState?.state !== STATE['3DS2PREPARE'] &&
      paymentState?.state !== STATE.IFRAME &&
      !loading &&
      !isVisibleAcsIframe,
    [paymentState, loading, isVisibleAcsIframe],
  );

  const isDisabledPayBtn = useMemo(() => {
    if (paymentState?.paymentId === PAYMENT_ID.OCT) {
      return !dstPan;
    }

    if (paymentState?.paymentId === PAYMENT_ID.AFT) {
      return (
        (!card.cvc && !isUPI) ||
        !card.expiryMonth ||
        !card.expiryYear ||
        (!card.holder && paymentState?.options?.showCardholderField)
      );
    }

    return (
      (paymentState?.options?.commissionRules ? !watched.agreement : false) ||
      (!card.cvc && !isUPI) ||
      !card.expiryMonth ||
      !card.expiryYear ||
      (!card.holder && paymentState?.options?.showCardholderField) ||
      (isP2p && (!amount || !dstPan))
    );
  }, [paymentState, dstPan, card, isUPI, watched.agreement, isP2p, amount]);

  const payBtnText = useMemo(() => {
    const sum = +(
      isP2p
        ? Formatter.amountToMinorAmount(amount)
        : paymentState?.amount
    );

    const totalAmount = isValidPan && sum ? sum + commission : sum;

    const pathToBtnText =
      paymentState?.paymentId === PAYMENT_ID.OCT || isP2p
        ? 'ui.btn.transfer'
        : 'ui.btn.pay';

    return t(pathToBtnText, {
      amount: Formatter.formatCurrencyWithDot(totalAmount),
      currency: Formatter.currency(paymentState?.currency),
    });
  }, [isP2p, amount, paymentState, isValidPan, commission, t]);

  const errorEntries = Object.entries(errors);
  const currentError =
    (inputName && (errors as Record<string, { message?: string }>)[inputName]?.message) ||
    (errorEntries[errorEntries.length - 1]?.[1] as { message?: string } | undefined)
      ?.message;

  const onBlurCard = useCallback(
    (event: React.FocusEvent<HTMLInputElement>, destination: Destination) => {
      setInputName(event.target.name);

      if (apiError) {
        setApiError('');
        clearErrors('src-pan');
      } else if (apiDstPanError) {
        setApiDstPanError('');
        clearErrors('dst-pan');
      }

      if (isValidPan && !isBonusVisible && payOnlyWithBonus) {
        setTimeout(() =>
          setError(`${destination}-pan` as 'src-pan', {
            message: t('errors.app.validation.bonusNotSupported'),
          }),
        );
      }

      if (isP2p) {
        if (card.pan && dstPan && card.pan === dstPan) {
          setTimeout(() =>
            setError(`${destination}-pan` as 'src-pan', {
              message: t('errors.app.validation.duplicatePan'),
            }),
          );
        }

        if (dstPan && !isPanInRange(dstPan, paymentState?.options?.bogCardsBins)) {
          setTimeout(() =>
            setError('dst-pan', {
              message: t('errors.app.validation.bgDstBin'),
            }),
          );
        }

        const cardBrand = getCardBrandName(card.pan) as string;

        if (
          cardBrand &&
          !allowableCardBrandListForP2p.includes(cardBrand)
        ) {
          setTimeout(() =>
            setError('src-pan', {
              message: t('errors.app.validation.p2pSrcPan', {
                0: allowableCardBrandListForP2p[0],
                1: allowableCardBrandListForP2p[1],
              }),
            }),
          );
        }

        if (amount === '0' || amount === '0,' || amount === '0.') {
          setTimeout(() =>
            setError('amount', {
              message: t('errors.app.validation.amountMin'),
            }),
          );
        }
      }
    },
    [
      apiError,
      apiDstPanError,
      isValidPan,
      isBonusVisible,
      payOnlyWithBonus,
      isP2p,
      card.pan,
      dstPan,
      amount,
      paymentState,
      t,
      setError,
      clearErrors,
    ],
  );

  const submitCb = useCallback(
    async (selectedBonus = '') => {
      requestProcessing();

      const token = location.hash.slice(1);
      const params: Record<string, any> =
        paymentState?.paymentId === PAYMENT_ID.OCT
          ? getDstCardParams(dstPan)
          : getSrcCardParams(card);

      if (selectedBonus) {
        params[`src.payWith${selectedBonus}BonusApproved`] = true;
      }

      if (isP2p) {
        Object.assign(params, getDstCardParams(dstPan), {
          amount: Formatter.amountToMinorAmount(amount),
          commission,
        });
      }

      const response = await accept(token, params);
      setPaymentState(response);
      localeLoaderShow();
      await checkPaymentState(response, token);
    },
    [
      requestProcessing,
      location.hash,
      paymentState,
      getDstCardParams,
      getSrcCardParams,
      dstPan,
      card,
      isP2p,
      amount,
      commission,
      accept,
      setPaymentState,
      localeLoaderShow,
      checkPaymentState,
    ],
  );

  const onSubmit = handleSubmit(() => submitCb());

  const onClick = (selectedBonus: string) => {
    handleSubmit(() => submitCb(selectedBonus))();
  };

  const requestPaymentState = useCallback(async () => {
    const token = location.hash.slice(1);
    localeLoaderShow();
    const response = await state(token);
    await checkPaymentState(response, token);
  }, [location.hash, localeLoaderShow, state, checkPaymentState]);

  const apiErrorHandlerCb = useCallback(
    async (result: any) => {
      if (result?.error === API_ERROR.UNEXPECTED_REQUEST) {
        await requestPaymentState();
        return;
      }

      if (result?.error?.includes('DST')) {
        setApiDstPanError(result.error);
        setError('dst-pan', { message: t(`errors.api.${result.error}`) });
      } else {
        setApiError(result.error);
        setError('src-pan', { message: t(`errors.api.${result.error}`) });
      }
    },
    [requestPaymentState, t, setError],
  );

  const apiErrorHandlerCbRef = useRef(apiErrorHandlerCb);
  useEffect(() => {
    apiErrorHandlerCbRef.current = apiErrorHandlerCb;
  }, [apiErrorHandlerCb]);

  // Аналог watch(isVisibleComission) — сбрасываем согласие, если блок скрылся.
  useEffect(() => {
    if (!isVisibleComission) {
      setValue('agreement', false);
    }
  }, [isVisibleComission, setValue]);

  // Аналог onMounted/onUnmounted.
  useEffect(() => {
    if (window.frameElement) {
      console.log('frame');
      return;
    }

    iframeHandler(setIsVisibleAcsIframe);
    apiErrorHandlerOn((result: any) => apiErrorHandlerCbRef.current(result));
    globalLoaderShow();
    dispatch(setIsOpenApiMirPaySupported(false));

    (async () => {
      const result = await initPayment();

      if (result?.state !== STATE.REDIRECT) {
        hideLoaders();
        setTabTitle();
      }
    })();

    return () => {
      apiErrorHandlerOff();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSubmitting = formState.isSubmitting;

  return (
    <FormProvider {...methods}>
      <div className="container">
        <form
          className={`form ${isSubmitting ? 'submit' : ''}`}
          onSubmit={onSubmit}
        >
          {isFormHeaderVisible && (
            <FormHeader data={paymentState} hiddenPayInfo={isP2p} />
          )}

          <div
            id="acs"
            className={`acs ${isVisibleAcsIframe ? 'with-padding' : ''}`}
          />

          {(isSubmitting || loading) && <Loader withoutShadow={!isSubmitting} />}

          {isFormBodyVisible && (
            <>
              {isVisibleBlockWithApplePayOnlyOrGooglePayOnlyEnabled && (
                <section className="form-body">
                  {paymentState?.paymentId !== PAYMENT_ID.OCT ? (
                    <SrcCard
                      invalid={
                        !!(
                          errors['src-pan'] ||
                          errors.expiryMonth ||
                          errors.expiryYear ||
                          errors.cvc
                        )
                      }
                      onBlur={(e) => onBlurCard(e, 'src')}
                    />
                  ) : (
                    <DstCard
                      invalid={!!errors['dst-pan']}
                      onBlur={(e) => onBlurCard(e, 'dst')}
                    />
                  )}

                  {errorEntries.length > 0 && (
                    <div
                      className={[
                        'form-body__error',
                        apiError ? 'api-pan-error' : '',
                        apiDstPanError ? 'api-dst-pan-error' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {currentError}
                    </div>
                  )}

                  {paymentState?.options?.showCardholderField && !isP2p && (
                    <CardHolder
                      className="form-body__cardholder"
                      invalid={!!errors.cardholder}
                      placeholder={t('ui.input.cardholder.placeholder')}
                      onBlur={(e) => setInputName(e.target.name)}
                    />
                  )}

                  {isP2p && (
                    <>
                      <Amount
                        className="form-body__amount-input"
                        placeholder="0.00"
                        invalid={!!errors.amount}
                        currency={Formatter.currency(paymentState?.currency)}
                        onBlur={(e) => onBlurCard(e, 'amount')}
                      />

                      <DstCard
                        invalid={!!errors['dst-pan']}
                        onBlur={(e) => onBlurCard(e, 'dst')}
                      />
                    </>
                  )}

                  {isVisibleComission && (
                    <>
                      <div className="form-body__commission">
                        <div>{commissionInfo}</div>
                      </div>

                      <Checkbox
                        name="agreement"
                        className="form-body__agreement"
                        label={t('ui.input.agreement.label')}
                      />
                    </>
                  )}

                  {paymentState?.src?.addToProfileEnabled && (
                    <Checkbox name="addToProfile" className="form-body__addToProfile">
                      <Trans
                        i18nKey="ui.input.saveCard.label"
                        components={{
                          link: (
                            <a
                              href={t('ui.input.saveCard.termsUrl')}
                              target="_blank"
                              rel="noreferrer"
                              className="form-body__addToProfile-link"
                            />
                          ),
                        }}
                      />
                    </Checkbox>
                  )}
                </section>
              )}

              <section
                className={`form-footer ${
                  isBonusButtonsVisible ? 'visible-bonuses' : ''
                }`}
              >
                {isVisibleBlockWithApplePayOnlyOrGooglePayOnlyEnabled && (
                  <div
                    className={`form-footer__btn-group ${
                      isBonusButtonsVisible ? 'visible-bonuses' : ''
                    }`}
                  >
                    {isBonusVisible && (
                      <>
                        {isEnabledBonus && (
                          <button
                            type="button"
                            className="btn btn-plus"
                            disabled={isSubmitting || errorEntries.length > 0 || isDisabledPayBtn}
                            onClick={() => onClick('Plus')}
                          >
                            {t('ui.btn.pay-with')}
                          </button>
                        )}

                        {isEnabledMrBonus && (
                          <button
                            type="button"
                            className="btn btn-mr-bonus"
                            disabled={isSubmitting || errorEntries.length > 0 || isDisabledPayBtn}
                            onClick={() => onClick('Mr')}
                          >
                            {t('ui.btn.pay-mr-bonus')}
                          </button>
                        )}

                        {isEnabledSCoolBonus && (
                          <button
                            type="button"
                            className="btn btn-mr-bonus"
                            disabled={isSubmitting || errorEntries.length > 0 || isDisabledPayBtn}
                            onClick={() => onClick('SCool')}
                          >
                            {t('ui.btn.pay-scool-bonus')}
                          </button>
                        )}
                      </>
                    )}

                    {!payOnlyWithBonus && (
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting || errorEntries.length > 0 || isDisabledPayBtn}
                      >
                        {payBtnText}
                      </button>
                    )}
                  </div>
                )}

                {isPaymentButtonVisible && (
                  <PaymentButtons
                    data={paymentState}
                    appleGooglePaymentsData={appleGooglePaymentsData}
                  />
                )}

                {isBonusVisible && (
                  <div className="form-footer__info">
                    {t('pages.main.pay-info')}
                  </div>
                )}
              </section>
            </>
          )}
        </form>
      </div>
    </FormProvider>
  );
};

export default Main;
