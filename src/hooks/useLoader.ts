import { useCallback, useEffect, useRef } from "react";
import { eventBusDispatcher } from "@/utils/eventBusDispatcher";
import { useEventBusHandler } from "@/hooks/useEventBusHandler";
import { useTranslation } from "react-i18next";
import { EventBus, EVENTS } from "@/utils/EventBus";

export function useLoader(setLoading?: (value: boolean) => void) {
    const { globalLoaderShow, globalLoaderHide } = eventBusDispatcher;
    const { localLoaderHandler, loadersHandler } = useEventBusHandler();
    const { i18n } = useTranslation();

    const localeLoaderShow = useCallback(() => {
        setLoading?.(true);
        document.title = i18n.t("tabTitle.processing");
    }, [i18n, setLoading]);

    const localeLoaderHide = useCallback(() => {
        setLoading?.(false);
    }, [setLoading]);

    const hideLoaders = useCallback(() => {
        globalLoaderHide();
        localeLoaderHide();
    }, [globalLoaderHide, localeLoaderHide]);

    const fetchWithLoader = useCallback(
        async (callback, isgGlobal = false) => {
            if (isgGlobal) {
                globalLoaderShow();
                await callback();
                setTimeout(globalLoaderHide);
            } else {
                localeLoaderShow();
                await callback();
                setTimeout(localeLoaderHide);
            }
        },
        [globalLoaderShow, globalLoaderHide, localeLoaderShow, localeLoaderHide],
    );

    // Держим актуальные обработчики, не пересоздавая подписки на каждый рендер.
    const latestHandlers = useRef({ localeLoaderShow, localeLoaderHide, hideLoaders });
    useEffect(() => {
        latestHandlers.current = { localeLoaderShow, localeLoaderHide, hideLoaders };
    }, [localeLoaderShow, localeLoaderHide, hideLoaders]);

    // Подписываемся один раз при монтировании и снимаем подписки при размонтировании,
    // иначе mitt накапливает обработчики и они вызываются многократно.
    useEffect(() => {
        const show = () => latestHandlers.current.localeLoaderShow();
        const hide = () => latestHandlers.current.localeLoaderHide();
        const hideAll = () => latestHandlers.current.hideLoaders();

        localLoaderHandler({ localeLoaderShow: show, localeLoaderHide: hide });
        loadersHandler(hideAll);

        const eventBus = EventBus.getInstance();

        return () => {
            eventBus.$off(EVENTS.LOCALE_LOADER_SHOW, show);
            eventBus.$off(EVENTS.LOCALE_LOADER_HIDE, hide);
            eventBus.$off(EVENTS.LOADERS_HIDE, hideAll);
        };
        // Регистрация выполняется один раз; актуальность обеспечивает latestHandlers.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        globalLoaderShow,
        globalLoaderHide,
        localeLoaderShow,
        localeLoaderHide,
        hideLoaders,
        fetchWithLoader,
    };
}
