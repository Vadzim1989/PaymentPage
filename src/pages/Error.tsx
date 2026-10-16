import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { eventBusDispatcher } from "@/utils/eventBusDispatcher";
import { useLocation } from "react-router-dom";
import { getQueryParams } from "@/utils/queryParams";

import styles from "@/assets/scss/pages/Error.module.scss";

const Error = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { globalLoaderShow } = eventBusDispatcher;

    const queryParams = getQueryParams(location.search);
    const { back_url_f } = queryParams || {};

    globalLoaderShow();
    useEffect(() => {
        if (window.top && window.self !== window.top) {
            window.top.postMessage('iframe-close','*');
        }
    }, []);

    return (
        <div className="container">
            <div className={styles.form}>
                <h2 className={styles.h2}>{ t("pages.error.API_ERR.title") }</h2>
                <p className={styles.text}>{ t("pages.error.API_ERR.info") }</p>
                {
                    back_url_f && (
                        <a
                            href={ back_url_f }
                            className="btn btn-primary"
                            >{ t("pages.error.API_ERR.btn") }
                        </a>
                    )
                }
            </div>
        </div>
    );
}

export default Error;