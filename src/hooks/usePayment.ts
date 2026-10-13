import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { useLang } from "./useLang";
import { paymentService } from "@/services/payment";
import { useUrlParser } from "@/hooks/useUrlParser";
import { eventBusDispatcher } from "@/utils/eventBusDispatcher";
import { STATE, PAYMENT_STATUS, PAYMENT_ID, SRC_TYPE } from "@/constants";
import {
  redirectToIframe,
  redirectToPostForm,
} from "@/utils/stateRedirect";
import { get3dsVersion } from "@/utils/3dsv2helper";
import { getCustomerReceiptUrl } from "@/utils/customerReceiptUrl";
import { loadFromStorage } from "@/utils/storageUtils";

import type { RequestData } from "@/types";

import { setErrorMessage } from "@/store/store";
import type { RootState } from "@/store/store";

export function usePayment(skipParams = false, resultCb?: () => void) {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const { setLang } = useLang();
    const service = useMemo(() => paymentService(), []);

    const {
        token,
        start,
        state,
        prepareAccept,
        accept,
        prepareReject,
    } = service;

    const {
        globalLoaderHide,
        globalLoaderShow,
        clearFetchStateInterval,
        iframeModeActive,
    } = eventBusDispatcher;

    const requestData = useUrlParser() as RequestData;

    const [paymentState, setPaymentState] = useState<any>(null);

    const searchParams = useMemo(
        () => new URLSearchParams(location.search),
        [location.search],
    );

    const query = useMemo(
        () => Object.fromEntries(searchParams.entries()),
        [searchParams],
    );

    const paymentToken = useMemo(
        () => location.hash.slice(1),
        [location.hash],
    );

    const checkStatus = useMemo(
        () => searchParams.get("checkStatus"),
        [searchParams],
    );

    const isPreauthorize = useMemo(
        () => searchParams.get("preauthorize"),
        [searchParams],
    );

    const isP2p = useMemo(
        () => paymentState?.paymentId?.toLowerCase() === PAYMENT_ID.P2P,
        [paymentState],
    );

    const isOpenApiMirPaySupported = useSelector(
        (state: RootState) => state.payment.isOpenApiMirPaySupported,
    );

    const cardRegistrationTypePayment = useSelector(
        (state: RootState) => state.payment.cardRegistrationTypePayment,
    );

    const isPayBySavedCard = useSelector(
        (state: RootState) => state.payment.isPayBySavedCard,
    );

    const deviceFingerprint = useSelector(
        (state: RootState) => state.payment.deviceFingerprint,
    );

    const postData = useCallback(() => 
        isPreauthorize
        ?   ({
                ...requestData,
                preauthorize: isPreauthorize,
            })
        : requestData,
    [requestData, isPreauthorize]);

    // Ref, через который checkPaymentState вызывает сам себя.
    // Нужен, чтобы ESLint не ругался на self-reference и чтобы рекурсия
    // всегда шла в актуальную версию функции.
    const checkPaymentStateRef = useRef<
      ((data: any, currentToken: string) => Promise<void>) | null
    >(null);

    const checkPaymentState = useCallback(async (data: any, currentToken: string) => {
      if (!data) return;

      const navigateTo = async (pathname: string) => {
        navigate(
          {
            pathname,
            search: location.search,
            hash: location.hash,
          },
          {
            state: { payment: data },
          },
        );
      };

      const fetchCheckPaymentState = async () => {
        const response = await state(currentToken);

        setPaymentState(response);
        await checkPaymentStateRef.current?.(response, currentToken);
      };

      switch (data.state) {
        case STATE.IN_PROGRESS: {
          await fetchCheckPaymentState();
          break;
        }

        case STATE["3DS2PREPARE"]: {
          const is3dsVersionSupported = Boolean(
            get3dsVersion(data.versions),
          );

          const response = is3dsVersionSupported
            ? await prepareAccept(currentToken, data)
            : await prepareReject(currentToken);

          setPaymentState(response);
          await checkPaymentStateRef.current?.(response, currentToken);
          break;
        }

        case STATE.IFRAME: {
          globalLoaderShow();
          iframeModeActive();

          redirectToIframe(data, fetchCheckPaymentState);
          break;
        }

        case STATE.REDIRECT: {
          redirectToPostForm(data);
          break;
        }

        case STATE["3DS2INFO"]: {
          setPaymentState(data);
          await navigateTo("/offer");
          break;
        }

        case STATE.AUTHENTICATION: {
          await navigateTo("/offer");
          break;
        }

        case STATE.OFFER: {
          const excludedSrcTypes = [
            SRC_TYPE.sbp,
            SRC_TYPE.sber_pay,
            SRC_TYPE.mir_pay,
            SRC_TYPE.yandex_split,
            SRC_TYPE.wb_pay,
          ];

          const isSrcTypeValid =
            data?.src?.type &&
            !excludedSrcTypes.includes(data.src.type);

          const hasCommission =
            data?.descriptionParams?.acquirerCommission ||
            data?.descriptionParams?.amountWithAcquirerCommission;

          if (isSrcTypeValid || data?.dst?.type || hasCommission) {
            await navigateTo("/offer");
          } else {
            setPaymentState(data);
          }

          break;
        }

        case STATE.RESULT: {
          if (resultCb) {
            resultCb();
          } else {
            await navigateTo("/bill");
          }

          break;
        }
      }
    }, [
      navigate,
      location.search,
      location.hash,
      state,
      prepareAccept,
      prepareReject,
      globalLoaderShow,
      iframeModeActive,
      resultCb,
    ]);

    // Синхронизируем ref с актуальной версией функции.
    useEffect(() => {
      checkPaymentStateRef.current = checkPaymentState;
    }, [checkPaymentState]);

    const handleState = useCallback(async (currentToken: string) => {
      let nextPaymentState: any = null;

      try {
        if (checkStatus) {
          nextPaymentState = await accept(currentToken, {
            checkStatus: true,
          });

          const nextSearchParams = new URLSearchParams(location.search);
          nextSearchParams.delete("checkStatus");

          navigate(
            {
              pathname: location.pathname,
              search: nextSearchParams.toString(),
              hash: location.hash,
            },
            { replace: true },
          );
        } else {
          nextPaymentState = await state(currentToken);
        }

        setPaymentState(nextPaymentState);
      } catch (error: any) {
        if (error?.data?.error === "RESTRICTED_BY_REGULATOR") {
          dispatch(setErrorMessage(error.data.error));
        }
      }

      if (nextPaymentState?.options?.lang) {
        setLang(nextPaymentState.options.lang);
      }

      await checkPaymentState(nextPaymentState, currentToken);

      return nextPaymentState;
    }, [
      checkStatus,
      accept,
      state,
      location.search,
      location.pathname,
      location.hash,
      navigate,
      setLang,
      dispatch,
      checkPaymentState,
    ]);

    const replaceRoute = useCallback(async (currentToken: string) => {
      navigate(
        {
          pathname: location.pathname,
          search: location.search,
          hash: `#${currentToken}`,
        },
        { replace: true },
      );
    }, [navigate, location.pathname, location.search]);

    const newPayment = useCallback(async () => {

        const { token: currentToken } = await token();

        await replaceRoute(currentToken);

        const data = {
            ...postData(),
            returnUrl: `${window.location.origin}${location.pathname}${location.search}#${currentToken}`,
        };

        if (skipParams) {
            delete data.back_url_f;
            delete data.back_url_s;
        } else if (isOpenApiMirPaySupported) {
            data['openApiMirPaySupported'] = true;
        }

        if (cardRegistrationTypePayment) {
            data['cardRegistration'] = true;
        }

        if (
            data["src.type"] === SRC_TYPE.sber_pay &&
            'sberPayBackUrl' in data &&
            !(data.sberPayBackUrl as string)?.includes("#")
        ) {
            data.sberPayBackUrl += `#${currentToken}`;
        }

        if (data["src.type"] === SRC_TYPE.yandex_split) {
            data["src.paymentPageBackUrl"] =
                `${window.location.origin}${location.pathname}` +
                `?checkStatus=true#${currentToken}`;
        }

        if (
            data["src.type"] === SRC_TYPE.mir_pay &&
            !/Android/i.test(navigator.userAgent)
        ) {
            delete data["src.type"];
        }

        let nextPaymentState: any = null;

        try {
            nextPaymentState = await start(currentToken, data);
            setPaymentState(nextPaymentState);
        } catch (error: any) {
            if (error?.data?.error === "RESTRICTED_BY_REGULATOR") {
                dispatch(setErrorMessage(error.data.error));
            }
        }

        await checkPaymentState(nextPaymentState, currentToken);

        return nextPaymentState;
    }, [
      token,
      replaceRoute,
      postData,
      skipParams,
      isOpenApiMirPaySupported,
      cardRegistrationTypePayment,
      start,
      dispatch,
      checkPaymentState,
      location.pathname,
      location.search,
    ]);

    const initPayment = useCallback(async () => {
        if (paymentToken) {
            return await handleState(paymentToken);
        } else if (requestData) {
            return await newPayment();
        } else {
            navigate("/error");
        }
    }, [paymentToken, handleState, requestData, newPayment, navigate]);

    const checkRegistrationToken = useCallback(async () => {
        const currentToken = location.hash.slice(1);
        if (currentToken) {
            await handleState(currentToken);
        } else if (requestData) {
            setPaymentState({});
        } else {
            navigate("/error");
        }
    }, [location.hash, handleState, requestData, navigate]);

    const requestPaymentState = useCallback(async () => {
        const currentToken = location.hash.slice(1);
        const response = await state(currentToken);

        setPaymentState(response);
        await checkPaymentState(response, currentToken);
    }, [location.hash, state, checkPaymentState]);

    const fastPaymentMethod = useCallback(async (
      srcType: string,
      customerReceiptAreaEnabled: boolean,
      cb: () => void = () => {},
      overrides: { customerReceiptUrl?: string } = {},
    ) => {
      clearFetchStateInterval();
      cb();

      const params: Record<string, any> = {
        "src.type": srcType,
      };

      if (customerReceiptAreaEnabled) {
        params["customer.receiptUrl"] =
          overrides.customerReceiptUrl || getCustomerReceiptUrl();
      }

      if (srcType === SRC_TYPE.gazprom_pay) {
        const savedCards = loadFromStorage("savedCards");

        const deviceId = savedCards
          ? JSON.parse(atob(savedCards)).deviceId
          : null;

        if (isPayBySavedCard) {
          if (deviceFingerprint) {
            params.deviceFingerprint = deviceFingerprint;
          }

          if (deviceId) {
            params.deviceId = deviceId;
          }
        }
      }

      const response = await accept(paymentToken, params);

      setPaymentState(response);
      await checkPaymentState(response, paymentToken);
    }, [
      clearFetchStateInterval,
      accept,
      paymentToken,
      isPayBySavedCard,
      deviceFingerprint,
      checkPaymentState,
    ]);

    const getPaymentStateResultStatus = useCallback((resultState: any = {}) => {
      const {
        status: paymentStatus,
        orderStatus,
        extendedCode,
      } = resultState.result ?? {};

      const { paymentId } = resultState;

      const successBackUrl = resultState?.options?.successBackUrl;
      const failedBackUrl = resultState?.options?.failedBackUrl;

      const successfulCondition =
        paymentStatus === PAYMENT_STATUS.SUCCESS ||
        paymentStatus === PAYMENT_STATUS.INTERIM_SUCCESS;

      const transferCondition =
        paymentId === PAYMENT_ID.OCT ||
        paymentId === PAYMENT_ID.AFT;

      const result: Record<string, any> = {
        message: "pages.result.offline",
        class: successfulCondition ? "success" : "failed",
        unknown: paymentStatus === PAYMENT_STATUS.UNKNOWN,
        offline:
          paymentStatus === PAYMENT_STATUS.SUCCESS &&
          (
            orderStatus === PAYMENT_STATUS.UNKNOWN ||
            orderStatus === PAYMENT_STATUS.REGISTRATION_ATTEMPTS_EXHAUSTED
          ),
      };

      result.title = successfulCondition
        ? orderStatus === PAYMENT_STATUS.REGISTERED
          ? "pages.result.status.registration"
          : transferCondition
            ? "pages.result.status.transferSuccess"
            : `pages.result.status.${paymentStatus.toLowerCase()}`
        : paymentStatus === PAYMENT_STATUS.SUSPENDED
          ? "pages.result.status.suspended"
          : orderStatus === PAYMENT_STATUS.REGISTERED
            ? "pages.result.status.failedRegistration"
            : transferCondition
              ? "pages.result.status.transferFailed"
              : "pages.result.status.failed";

      result.description = successfulCondition
        ? `pages.result.description.${paymentStatus.toLowerCase()}`
        : paymentStatus === PAYMENT_STATUS.SUSPENDED
          ? "pages.result.description.suspended"
          : `errors.api.${extendedCode}`;

      result.backUrl = successfulCondition
        ? query.back_url_s || successBackUrl
        : query.back_url_f || failedBackUrl;

      return result;
    }, [query]);

    const timeoutApiErrorHandlerCb = useCallback(async () => {
        const currentToken = location.hash.slice(1);
        const response = await state(currentToken);

        setPaymentState(response);
        await checkPaymentState(response, currentToken);

        if (
            response.state === STATE.RESULT ||
            response.state === STATE["3DS2INFO"]
        ) {
            globalLoaderHide();
        }
    }, [location.hash, state, checkPaymentState, globalLoaderHide]);

    return {
        initPayment,
        checkRegistrationToken,
        checkPaymentState,
        paymentState,
        setPaymentState,
        isP2p,
        isPreauthorize,
        fastPaymentMethod,
        getPaymentStateResultStatus,
        handleState,
        replaceRoute,
        requestPaymentState,
        timeoutApiErrorHandlerCb,
    };
}