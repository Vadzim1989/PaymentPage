import React, { useMemo, useEffect, useState, type ReactNode } from "react";
import {
  card as creditCard,
  getBrand,
  getCardBrandName,
} from "@/utils/creditcard";
import {
  CARD_BRAND,
  MIN_PAN_LENGTH_OF_CARD_BRAND_DEFINITION,
} from "@/constants/index";
import { cardBrandImages } from "@/constants/cardBrandImages";
import styles from '@/assets/scss/components/CreditCard.module.scss';

const VISA_MIN_PAN_LENGTH = 13;
const AMERICAN_EXPRESS_PAN_LENGTH = 15;
const MIN_PAN_LENGTH = 16;
const MIN_PAN_LENGTH_FOR_BRAND = 7;

const cardPanMaska = {
    americanExpressPanMaska: [
        "0000",
        "0000 000000",
        "0000 000000 00000",
        "0000 000000 00000 00000",
    ],
    defaultPanMaska: [
        "0000",
        "0000 0000",
        "0000 0000 0000",
        "0000 0000 0000 0000",
        "0000 0000 0000 0000 000",
    ],
};

interface CardDataChildrenProps {
  pan: string;
  isVisibleExpiryAndCvc: boolean;
  minPanLength: number;
  cardBrand: string;
  cardPanMaska: typeof cardPanMaska;
  paymentData?: any;
}

interface CreditCardProps {
  invalid?: boolean;
  pan?: string;
  paymentData?: any;
  onChange?: (card: { pan: string }) => void;
  label?: ReactNode;
  children?: (props: CardDataChildrenProps) => ReactNode;
}

export const CreditCard: React.FC<CreditCardProps> = ({
  invalid = false,
  pan = "",
  paymentData,
  onChange,
  label,
  children,
}) =>  {
    const cardBrand = useMemo(() => getCardBrandName(pan) as string, [pan]);

    const isPanEnoughLength = useMemo(() => {
        return !!(pan && creditCard.parse(pan).length >= MIN_PAN_LENGTH_FOR_BRAND);
    }, [pan]);

    const [imageTimestamp] = useState(() => Date.now());

    const minPanLength = useMemo(() => {
        return cardBrand === CARD_BRAND.VISA
            ? VISA_MIN_PAN_LENGTH
                : cardBrand === CARD_BRAND.AMERICAN_EXPRESS ||
                    cardBrand === CARD_BRAND.GCLOCAL ||
                    cardBrand === CARD_BRAND.AMERICAN_EXPRESS_DEBIT
                ? AMERICAN_EXPRESS_PAN_LENGTH
            : MIN_PAN_LENGTH;
    }, [cardBrand]);

    const isAmericanExpressDebit = useMemo(
        () => cardBrand === CARD_BRAND.AMERICAN_EXPRESS_DEBIT
    , [cardBrand]);

    const brandImagesList = useMemo(() => {
        if (
            !pan ||
            (pan[0] === "3" &&
            creditCard.parse(pan).length <
                MIN_PAN_LENGTH_OF_CARD_BRAND_DEFINITION)
        ) {
            return {};
        }
    
        return getBrand(pan, cardBrandImages, {});
    }, [pan]);

    useEffect(() => {
        if (onChange) {
            onChange({ pan });
        }
    }, [onChange, pan]);

    const headerClasses = [
        styles.header,
        cardBrand === CARD_BRAND.UPI ? styles.upi : '',
    ].join(' ').trim();

    const brandClasses = [
        styles.brand,
        isPanEnoughLength ? styles.brandOutside : '',
        isAmericanExpressDebit ? styles.amex : '',
    ].join(' ').trim();

    const bodyClasses = [
        styles.body,
        invalid ? styles.invalid : '',
    ].join(' ').trim();

    const renderBrandImages = () => {
        const images = Array.isArray(brandImagesList) 
            ? brandImagesList 
            : Object.values(brandImagesList);
        
        return images.map((img, index) => (
            <img key={`${img}-${index}`} src={`${img}?v=${imageTimestamp}`} alt="ps" />
        ));
    };

    return (
        <div className={styles.creditCard}>
            <div className={headerClasses}>
                <div className={styles.label}>{label}</div>

                <div className={brandClasses}>
                {renderBrandImages()}
                </div>
            </div>

            <div className={bodyClasses}>
                {children &&
                    children({
                        pan,
                        isVisibleExpiryAndCvc: isPanEnoughLength,
                        minPanLength,
                        cardBrand,
                        cardPanMaska,
                        paymentData,
                    })
                }
            </div>
        </div>
    );
}