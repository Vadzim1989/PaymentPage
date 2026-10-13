import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Formatter from '@/utils/formatter';
import { isPanInRange } from '@/utils/checkBinRanges';
import { card as creditcard } from '@/utils/creditcard';
import { PAYMENT_ID } from '@/constants';

interface CommissionRule {
  type: string;
  percent?: number;
  minimum?: number;
}

interface CommissionOptions {
  commissionRules?: CommissionRule[];
  bogCardsBins?: string;
  domesticCardsBins?: string;
  amexDebitCardsBins?: string;
}

interface PaymentState {
  amount?: number | string;
  currency?: string;
  paymentId?: string;
  options?: CommissionOptions;
}

export const useCommission = (
  cardPan: string,
  paymentState: PaymentState | null | undefined,
  sum: number | string
) => {
  const { t } = useTranslation();

  // Чистая функция для определения правила комиссии
  // Вынесена внутрь хука, чтобы иметь доступ к paymentState, но не зависит от рендера
  const getRule = useMemo(() => {
    return (pan: string, options: CommissionOptions = {}): CommissionRule => {
      const {
        commissionRules = [],
        bogCardsBins = "",
        domesticCardsBins = "",
        amexDebitCardsBins = "",
      } = options;

      let type: string;
      // Приводим к string, так как creditcard.type может возвращать undefined
      const cardType = String(creditcard.type(pan, true) || "");

      if (cardType.startsWith("AMERICAN_EXPRESS")) {
        type = amexDebitCardsBins && isPanInRange(pan, amexDebitCardsBins) 
          ? "AMEX DEBIT" 
          : "AMEX CREDIT";
      } else if (isPanInRange(pan, bogCardsBins)) {
        type = "BOG";
      } else if (isPanInRange(pan, domesticCardsBins)) {
        type = "DOMESTIC";
      } else {
        type = "INTERNATIONAL";
      }

      if (paymentState?.paymentId === PAYMENT_ID.P2P) {
        type = "P2P";
      }

      return commissionRules.find((rule) => rule.type === type) || {} as CommissionRule;
    };
  }, [paymentState?.paymentId]);

  // Аналог computed: commissionInfo
  const commissionInfo = useMemo(() => {
    if (!paymentState) return "";

    const rule = getRule(cardPan, paymentState.options);
    const { percent = 0, minimum = 0 } = rule;
    
    const currency = Formatter.currency(paymentState.currency);
    const formattedMinimum = Formatter.amountMinorToAmount(minimum);

    if (!percent && minimum) {
      return t("pages.main.commission.minimum", {
        minimum: formattedMinimum,
        currency,
      });
    } 
    
    if (percent && !minimum) {
      return t("pages.main.commission.percent", {
        commission: percent.toFixed(2),
      });
    } 
    
    if (percent && minimum) {
      return t("pages.main.commission.common", {
        commission: percent.toFixed(2),
        minimum: formattedMinimum,
        currency,
      });
    }

    return "";
  }, [cardPan, paymentState, getRule, t]);

  // Аналог computed: commission
  const commission = useMemo(() => {
    if (!paymentState) return 0;

    // amount может быть числом или строкой (результат amountToMinorAmount)
    const rawAmount = paymentState.amount ?? Formatter.amountToMinorAmount(sum);
    const amount = Number(rawAmount);
    
    const rule = getRule(cardPan, paymentState.options);
    const { percent = 0, minimum = 0 } = rule;

    // Рассчитываем комиссию
    const calculatedCommission = Number(
      Formatter.amountToMinorAmount((amount / 100) * (percent / 100))
    );

    return calculatedCommission > minimum ? calculatedCommission : minimum;
  }, [cardPan, paymentState, sum, getRule]);

  return { commission, commissionInfo };
};