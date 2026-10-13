import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Input from './Input';

type ExpiryType = 'expiryMonth' | 'expiryYear';

interface ExpiryProps {
  type: ExpiryType;
  isExpiredCardsAllowed?: boolean;
  isCombined?: boolean;
  placeholder?: string;
  className?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const Expiry = ({
  type,
  isExpiredCardsAllowed = false,
  isCombined = false,
  placeholder,
  className,
  onBlur,
}: ExpiryProps) => {
  const { t } = useTranslation();

  const rules = useMemo(() => {
    const validate: Record<string, (value: string) => true | string> = {};

    if (type === 'expiryMonth') {
      validate.expiryMonth = (value: string) => {
        const digits = (value ?? '').replace(/\D/g, '');
        if (!digits) return true;
        const num = parseInt(digits, 10);
        if (isNaN(num) || num < 1 || num > 12) {
          return t('ui.input.expiryMonth.invalid') || 'Invalid month';
        }
        return true;
      };
    }

    if (type === 'expiryYear') {
      validate.expiryYear = (value: string) => {
        if (isCombined || isExpiredCardsAllowed) return true;
        const digits = (value ?? '').replace(/\D/g, '');
        if (digits.length < 2) return true;
        const year = 2000 + parseInt(digits, 10);
        const currentYear = new Date().getFullYear();
        if (year < currentYear) {
          return t('ui.input.expiryYear.expired') || 'Card is expired';
        }
        return true;
      };
    }

    return { required: true, validate };
  }, [type, isExpiredCardsAllowed, isCombined, t]);

  return (
    <Input
      name={type}
      mask="00"
      rules={rules}
      type="tel"
      label={t(`ui.input.${type}.label`)}
      placeholder={placeholder}
      className={className}
      onBlur={onBlur}
    />
  );
};

export default Expiry;