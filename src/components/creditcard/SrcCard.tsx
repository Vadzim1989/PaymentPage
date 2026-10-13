import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWatch } from 'react-hook-form';
import { CreditCard } from './CreditCard';
import Pan from '@/components/ui/Pan';
import Expiry from '@/components/ui/Expiry';
import Cvc from '@/components/ui/Cvc';
import { CARD_BRAND } from '@/constants/index';

const AMERICAN_EXPRESS_CSC_LENGTH = 4;
const DEFAULT_CVV_LENGTH = 3;

const allowableCardBrandList: string[] = [
  CARD_BRAND.VISA,
  CARD_BRAND.MASTERCARD,
  CARD_BRAND.AMERICAN_EXPRESS,
  CARD_BRAND.AMERICAN_EXPRESS_DEBIT,
  CARD_BRAND.GCLOCAL,
  CARD_BRAND.UPI,
];

type CvcAttribute = 'mask' | 'placeholder' | 'minCvcLength';

function getCvcAttributeValue(
  cardBrand: string,
  attributeName: CvcAttribute,
): string | number {
  const isAmex =
    cardBrand === CARD_BRAND.AMERICAN_EXPRESS ||
    cardBrand === CARD_BRAND.AMERICAN_EXPRESS_DEBIT;

  const attributeValues: Record<
    CvcAttribute,
    { amex: string | number; default: string | number }
  > = {
    mask: { amex: '0000', default: '000' },
    placeholder: { amex: '- - - -', default: '- - -' },
    minCvcLength: {
      amex: AMERICAN_EXPRESS_CSC_LENGTH,
      default: DEFAULT_CVV_LENGTH,
    },
  };

  return isAmex
    ? attributeValues[attributeName].amex
    : attributeValues[attributeName].default;
}

interface SrcCardProps {
  invalid?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const SrcCard: React.FC<SrcCardProps> = ({ invalid, onBlur }) => {
  const { t } = useTranslation();
  const pan = (useWatch({ name: 'src-pan' }) as string) ?? '';

  return (
    <CreditCard label={t('components.creditcard.src.label')} invalid={invalid} pan={pan}>
      {({ isVisibleExpiryAndCvc, minPanLength, cardBrand, cardPanMaska }) => {
        const panMask =
          cardBrand === CARD_BRAND.AMERICAN_EXPRESS
            ? cardPanMaska.americanExpressPanMaska
            : cardPanMaska.defaultPanMaska;

        const cvcMask = getCvcAttributeValue(cardBrand, 'mask') as string;
        const cvcPlaceholder = getCvcAttributeValue(
          cardBrand,
          'placeholder',
        ) as string;
        const cvcMinLength = getCvcAttributeValue(
          cardBrand,
          'minCvcLength',
        ) as number;

        const cvcLabel = allowableCardBrandList.includes(cardBrand)
          ? t(`ui.input.cvc.label.${cardBrand.toLowerCase()}`)
          : t(`ui.input.cvc.label.default`);

        return (
          <>
            <Pan
              name="src-pan"
              mask={panMask}
              minPanLength={minPanLength}
              placeholder="0000 0000 0000 0000 000"
              onBlur={onBlur}
            />

            <div
              className={`expiry-container${
                !isVisibleExpiryAndCvc ? ' hidden-on-desktop' : ''
              }`}
            >
              <Expiry
                type="expiryMonth"
                placeholder="00"
                onBlur={onBlur}
              />
              <div className="separator">/</div>
              <Expiry
                type="expiryYear"
                placeholder="00"
                onBlur={onBlur}
              />
            </div>

            <Cvc
              mask={cvcMask}
              placeholder={cvcPlaceholder}
              label={cvcLabel}
              minCvcLength={cvcMinLength}
              brand={cardBrand}
              className={!isVisibleExpiryAndCvc ? 'hidden-on-desktop' : ''}
              onBlur={onBlur}
            />
          </>
        );
      }}
    </CreditCard>
  );
};

export default SrcCard;