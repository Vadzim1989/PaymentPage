import { useMemo } from 'react';
import { isPanInRange } from '@/utils/checkBinRanges';

interface PaymentBonusOptions {
  bonusCardsBins?: string;
  plusBonusCardsBins?: string;
  mrBonusCardsBins?: string;
  sCoolBonusCardsBins?: string;
}

export const usePayBonus = (
  cardPan: string, 
  paymentOptions?: PaymentBonusOptions
) => {
  const isEnabledBonus = useMemo(() => {
    if (!paymentOptions) return false;
    
    const { bonusCardsBins, plusBonusCardsBins } = paymentOptions;
    const binsToCheck = plusBonusCardsBins || bonusCardsBins;
    
    return isPanInRange(cardPan, binsToCheck);
  }, [cardPan, paymentOptions]);

  const isEnabledMrBonus = useMemo(() => {
    if (!paymentOptions) return false;
    
    return isPanInRange(cardPan, paymentOptions.mrBonusCardsBins);
  }, [cardPan, paymentOptions]);

  const isEnabledSCoolBonus = useMemo(() => {
    if (!paymentOptions) return false;
    
    return isPanInRange(cardPan, paymentOptions.sCoolBonusCardsBins);
  }, [cardPan, paymentOptions]);

  return {
    isEnabledBonus,
    isEnabledMrBonus,
    isEnabledSCoolBonus,
  };
};