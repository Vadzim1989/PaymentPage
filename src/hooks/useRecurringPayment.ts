import Formatter from "@/utils/formatter";
import { useLocation } from "react-router-dom";
import { getQueryParams } from "@/utils/queryParams";

export function useRecurringPayment() {
    const location = useLocation();

    function getApplePayRecurringPeriod(data) {
        const isWeek = data?.options?.recurringIntervalUnit?.toLowerCase() === "week";
        return {
            unit: isWeek ? "day" : (data?.options?.recurringIntervalUnit || "month").toLowerCase(),
            count: isWeek 
                ? 7 * data?.options?.recurringIntervalCount 
                : data?.options?.recurringIntervalCount || 1
        };
    };

    function getRecurringAmount(data, commission = false) {
        let amount = data.amount;

        if (data.options?.recurringPayment && data?.descriptionParams && commission) {
            const { amountWithAcquirerCommission, acquirerCommission } = data.descriptionParams;
            if (amountWithAcquirerCommission) {
                amount = amountWithAcquirerCommission;
            } else if (acquirerCommission) {
                amount += acquirerCommission;
            }
        }

        return Formatter.amountMinorToAmount(amount);
    };

    function getRecurringManagementUrl(data, defaultUrl) {
        const rowQuery = getQueryParams(location.search);
        const { back_url_s } = rowQuery || {};
        const url = back_url_s || data.options?.successBackUrl;
        if (!url) return defaultUrl;
        
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.protocol !== 'https:') return defaultUrl;
            return parsedUrl.origin;
        } catch {
            return defaultUrl;
        }
    }

    return { getApplePayRecurringPeriod, getRecurringAmount, getRecurringManagementUrl };
}