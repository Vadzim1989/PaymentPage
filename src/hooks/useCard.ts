import { useState, useMemo } from "react"
import { card as creditcard, getBrand } from "@/utils/creditcard";
import { useUrlParser } from "@/hooks/useUrlParser";

import type { RootState } from "@/store/store";
import { useSelector } from "react-redux";

export function useCard(brands = {}) {
    const requestData = useUrlParser();

    const cardRegistrationTypePayment = useSelector(
        (state: RootState) => state.payment.cardRegistrationTypePayment,
    );

    const [card, setCard] = useState({
        pan: "",
        cvc: "",
        expiryMonth: "",
        expiryYear: "",
        expiry: "",
        holder: "",
        save: false,
        preauthorize: false,
    });

    const isValidPan = useMemo(() => {
        const MIN_PAN_LENGTH = 13;
        return (
            creditcard.parse(card.pan).length >= MIN_PAN_LENGTH &&
            creditcard.luhn(creditcard.parse(card.pan))
        );
    }, [card.pan]);

    const isPanEnoughLength = useMemo(() => {
        const MIN_PAN_LENGTH = 7;
        return !!(card.pan && creditcard.parse(card.pan).length >= MIN_PAN_LENGTH);
    }, [card.pan]);

    const brandsList = useMemo(() =>
        getBrand(card.pan, brands, Object.values(brands))
    , [card.pan, brands]);

    const getCardExpiry = (card) => {
        if (card.expiryMonth && card.expiryYear) {
            return `${card.expiryMonth}${card.expiryYear}`;
        } else {
            const slash = "/";
            const slashIndex = card.expiry.indexOf(slash);
            const currentExpiryMonth = card.expiry.slice(0, 2);
            const currentExpiryYear = card.expiry.slice(slashIndex + 1).trim();

            return `${currentExpiryMonth}${currentExpiryYear}`;
        }
    };

    const getSrcCardParams = (card) => {
        const params: Record<string, any> = {
            "src.type": "card",
            "src.pan": creditcard.parse(card.pan),
            "src.expiry": getCardExpiry(card)
        };

        if (card.cvc) {
            params["src.csc"] = card.cvc;
        }

        if (card.holder) {
            params["src.cardholder"] = card.holder;
        }

        if (card.save || cardRegistrationTypePayment) {
            params["src.addToProfile"] = true;
        }

        if (cardRegistrationTypePayment) {
            params["amount"] = 100;
        }

        if (card.preauthorize) {
            params["preauthorize"] = true;
        }

        return params;
    };

    const getCardParams = (card) => {
        const params: Record<string, any> = {
            type: "card",
            pan: creditcard.parse(card.pan),
            expiry: getCardExpiry(card),
            csc: card.cvc,
            returnUrl: window.location.href,
        };

        return { ...params, ...requestData };
    };

    const getDstCardParams = (pan) => {
        return {
            "dst.type": "card",
            "dst.pan": creditcard.parse(pan),
        };
    };

    return {
        card,
        setCard,
        brandsList,
        isValidPan,
        isPanEnoughLength,
        getSrcCardParams,
        getCardParams,
        getDstCardParams,
    };
}
