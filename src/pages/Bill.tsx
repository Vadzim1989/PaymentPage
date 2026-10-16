import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { paymentService } from '@/services/payment';
import { usePaymentAvailability } from '@/hooks/usePaymentAvailability';
import Formatter from '@/utils/formatter';
import { getCardBrandName } from '@/utils/creditcard';
import { useLoader } from '@/hooks/useLoader';
import { eventBusDispatcher } from '@/utils/eventBusDispatcher';
import { useEventBusHandler } from '@/hooks/useEventBusHandler';
import { getQueryParams } from '@/utils/queryParams';
import {
  PAYMENT_STATUS,
  CARD_BRAND,
  ORDER_STATUS,
  PAYMENT_ID,
} from "@/constants/index";

import { FormHeader } from '@/components/FormHeader';
import { ErrorBlock } from '@/components/ErrorBlock';
import Loader from '@/components/common/Loader';
import Email from '@/components/ui/Email';


const Bill = () => {
    const { t } = useTranslation();
    const { search, hash } = useLocation();
    const query = useMemo(() => getQueryParams(search), [search]);
    const token = useMemo(() => hash.replace('#', ''), [hash]);

    const [loading, setLoading] = useState<boolean>(false);
    const [emailSentStatus, setEmailSentStatus] = useState<boolean | string | null>(null);

    const { localeLoaderShow, hideLoaders } = useLoader(setLoading);

    useEffect(() => {
        localeLoaderShow();
    }, [localeLoaderShow]);

    const paymentState = usePaymentAvailability();
    const { sendingReceipt } = paymentService();
    const { globalLoaderHide } = eventBusDispatcher;
    const { apiErrorHandlerOn, apiErrorHandlerOff } = useEventBusHandler();

    const srcCardBrand = useMemo(
        () => getCardBrandName(paymentState?.src?.pan) as string,
        [paymentState?.src?.pan]
    );

    const dstCardBrand = useMemo(
        () => getCardBrandName(paymentState?.dst?.pan) as string,
        [paymentState?.dst?.pan]
    );

    const dateTimeOptions: Intl.DateTimeFormatOptions = useMemo(
        () => ({
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }),
        []
    );

    const methods = useForm<{email: string}>({
        mode: 'onBlur',
        defaultValues: {
          email: '',
        },
    });
    const { control, formState, setError, clearErrors, handleSubmit } = methods;
    const { isSubmitting, errors } = formState;
    const email = useWatch({ control, name: 'email' });

    const isP2p = useMemo(
        () => paymentState?.paymentId?.toLowerCase() === PAYMENT_ID.P2P,
        [paymentState]
    );
    const successfulPaymentCondition = useMemo(
        () =>
            paymentState?.result?.status == PAYMENT_STATUS.SUCCESS ||
            paymentState?.result?.status == PAYMENT_STATUS.INTERIM_SUCCESS,
        [paymentState]
    );

    const isSendEmailFormVisible = useMemo(
        () =>
            successfulPaymentCondition &&
            paymentState?.merchant?.emailReceiptEnabled,
        [successfulPaymentCondition, paymentState]
    );

    const isOffLineInfoVisible = useMemo(
        () =>
            paymentState?.result?.orderStatus &&
            paymentState?.result?.orderStatus !== ORDER_STATUS.REGISTERED,
        [paymentState]
    );

    const getFormattedCardBrandName = useCallback(
        (paymentSystem: any) => {
            return (
                paymentSystem === CARD_BRAND.GCLOCAL
                    ? Formatter.formatGCLocalCardName(paymentSystem)
                    : srcCardBrand === CARD_BRAND.AMERICAN_EXPRESS_DEBIT
                    ? Formatter.formatAmexDebitCardName(paymentSystem)
                    : Formatter.capitalize(paymentSystem)
            );
        },
        [srcCardBrand]
    );

    const transactionInfo = useMemo(() => {
            const finishedDate = paymentState?.finishedAt ? new Date(paymentState.finishedAt) : null;
            const formattedDate = finishedDate && !isNaN(finishedDate.getTime()) 
                ? finishedDate.toLocaleString('ru', dateTimeOptions).replace(",", " ")
                : null;
            return [
                {
                    title: t("pages.result.table.brand"),
                    key: 'srcPan',
                    value: getFormattedCardBrandName(paymentState?.src?.paymentSystem),
                },
                {
                    title: t("pages.result.table.issuerId"),
                    value: paymentState?.src?.issuerId,
                },
                {
                    title: t("pages.result.table.responseCodeDetails"),
                    value: paymentState?.result?.responseCodeDetails,
                },
                {
                    title: t("pages.result.table.pan.src"),
                    value: paymentState?.src?.pan,
                },
                {
                    title: t("pages.result.table.brand"),
                    key: 'dstPan',
                    value:
                        dstCardBrand === CARD_BRAND.AMERICAN_EXPRESS
                        ? "Amex"
                        : dstCardBrand === CARD_BRAND.UPI
                        ? "Unionpay"
                        : Formatter.capitalize(dstCardBrand as string),
                },
                {
                    title: t("pages.result.table.pan.dst"),
                    value: paymentState?.dst?.pan,
                },
                {
                    title: t("pages.result.table.merchant"),
                    value: paymentState?.merchant?.url,
                    link: true,
                },
                {
                    title: t("pages.result.table.trxId"),
                    value: paymentState?.result?.trxId,
                    class: "trxId",
                },
                {
                    title: t("pages.result.table.trxId"),
                    value: paymentState?.result?.externalTrxId,
                },
                {
                    title: t("pages.result.table.date"),
                    value: formattedDate,
                },
                {
                    title: t("pages.result.table.approvalCode"),
                    value: paymentState?.result?.approvalCode,
                },
                {
                    title: t("pages.result.table.rrn"),
                    value: paymentState?.result?.rrn,
                },
                {
                    title: t("pages.result.table.status.title"),
                    value: t(
                        `pages.result.table.status.description.${paymentState?.result?.status}`
                    ),
                    class: "resultStatus",
                },
            ].filter((item) => item.value)
        },
        [paymentState, t, dstCardBrand, dateTimeOptions, getFormattedCardBrandName]
    );

    function onPrintResult() {
        window.print();
    };

    const onBackToMarket = useCallback(() => {
        const { back_url_f: failBackUrl, back_url_s: successBackUrl } = query;
        window.location.href =
            paymentState?.result?.status === PAYMENT_STATUS.SUCCESS || paymentState?.result?.status === PAYMENT_STATUS.INTERIM_SUCCESS
            ? successBackUrl
            : failBackUrl;
    }, [paymentState, query]);

    async function onSubmitEmail() {
        if (!email) return;
        const formData = { email: email };
        const response = await sendingReceipt(token, formData) as any;
        setEmailSentStatus(response?.emailSent);
    };

    const onSubmit = handleSubmit(onSubmitEmail);

    const onBlurEmail = useCallback(
        () => {
            clearErrors('email');
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

            if (!email) {
              setTimeout(() =>
                setError('email', {
                  message: t('errors.app.validation.emailRequired'),
                }),
              );
            }

            if (email && !emailRegex.test(email)) {
              setTimeout(() =>
                setError('email', {
                  message: t('errors.app.validation.email'),
                }),
              );
          }
        },[email, t, setError, clearErrors]
    );

    useEffect(() => {
        if (!paymentState) return;

        apiErrorHandlerOn();
        
        if (window.top && window.self !== window.top) {
            window.top.postMessage('iframe-close', '*');
        }
        
        if (paymentState?.options?.skipResultPage) {
            onBackToMarket();
        }
        
        if (paymentState?.result?.status && !paymentState?.options?.skipResultPage) {
            globalLoaderHide();
            hideLoaders();
        }

        return () => {
            apiErrorHandlerOff();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        paymentState,
        globalLoaderHide, 
        hideLoaders, 
        apiErrorHandlerOn, 
        apiErrorHandlerOff
    ]);

    const TransactionInfoBlock = transactionInfo.map((item, index) => {
        return (
            <div 
                className="result-table__item item" 
                key={item.key
                    ? item.key
                    : `${item.title}-${index}`
                }
            >
                <div className='item__key'>{item.title}</div>
                <div className={[
                        'form-body__error',
                        successfulPaymentCondition && item.class === 'resultStatus' ? 'success' : '',
                    ].filter(Boolean).join(' ')}
                >
                    {item.link ? (
                        <a
                            href={paymentState?.merchant?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className='link'
                        >{item.value}</a>
                    ) : (<span>{item.value}</span>)}
                </div>
            </div>
        )
    });

    const EmailBlock = isSendEmailFormVisible && (
        <section className="form-footer">
            <form className="send-email-form" onSubmit={onSubmit}>
                <p>{ t("pages.result.footer.email") }</p>
                <div className="wrapper">
                    <Email
                        className="send-email-form__input"
                        invalid={!!errors.email}
                        placeholder={ t("ui.input.email.label") }
                        onBlur={onBlurEmail}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary send-email-form__submit-btn"
                        disabled={isSubmitting}
                    >
                        { t("ui.btn.send") }
                    </button>
                </div>
            </form>

            {
                emailSentStatus === false && (
                <div className="email-sent-error">
                    { t("pages.result.footer.emailSentError") }
                </div>
            )}

            {
                emailSentStatus === true && (
                <div className="email-sent-success">
                    { t("pages.result.footer.emailSentSuccess") }
                </div>
            )}

        </section>
    );

    return (
        <FormProvider {...methods}>
            <div className="container">

                {
                    paymentState && !loading && 
                    (<div className="form">
                        <FormHeader
                            data={paymentState}
                            hiddenPayInfo={isP2p}
                        />
                        <section className="form-body">
                            {!successfulPaymentCondition && (
                                <ErrorBlock result={paymentState.result} />
                            )}
                            <div className="result-table">
                                {TransactionInfoBlock}
                            </div>

                            {
                                isOffLineInfoVisible && (
                                <div className="form-body__off-line">
                                    <p className="msg">
                                        <strong>{ t("pages.result.offLine.attention") }</strong>
                                        { t("pages.result.offLine.msg") }
                                    </p>
                                </div>)
                            }

                            <div className="form-body__btn-group bg">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onPrintResult}
                                >
                                    { t("ui.btn.print") }
                                </button>
                                <button 
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={onBackToMarket}
                                >
                                    { t("ui.btn.to-market") }
                                </button>
                            </div>
                        </section>

                        {EmailBlock}
                    </div>)
                }

                {
                    loading || isSubmitting 
                    ? <div className="form"><Loader withoutShadow={!isSubmitting}/></div>
                    : null
                }
            </div>
        </FormProvider>
    )
}

export default Bill;