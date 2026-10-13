import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWatch } from 'react-hook-form';
import { CreditCard } from './CreditCard';
import Pan from '@/components/ui/Pan';
import { CARD_BRAND } from '@/constants/index';

interface DstCardProps {
  invalid?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const DstCard: React.FC<DstCardProps> = ({ invalid, onBlur }) => {
  const { t } = useTranslation();
  const pan = (useWatch({ name: 'dst-pan' }) as string) ?? '';

  return (
    <CreditCard label={t('components.creditcard.dst.label')} invalid={invalid} pan={pan}>
      {({ minPanLength, cardBrand, cardPanMaska }) => {
        const mask =
          cardBrand === CARD_BRAND.AMERICAN_EXPRESS
            ? cardPanMaska.americanExpressPanMaska
            : cardPanMaska.defaultPanMaska;

        return (
          <Pan
            name="dst-pan"
            mask={mask}
            minPanLength={minPanLength}
            placeholder="0000 0000 0000 0000 000"
            onBlur={onBlur}
          />
        );
      }}
    </CreditCard>
  );
};

export default DstCard;