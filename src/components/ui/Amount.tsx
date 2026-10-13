import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Input from './Input';

interface AmountProps {
  className?: string;
  invalid?: boolean;
  placeholder?: string;
  currency?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const Amount = ({ className, invalid, placeholder, currency, onBlur }: AmountProps) => {
  const { t } = useTranslation();

  const rules = useMemo(
    () => ({
      validate: {
        amountMin: (value: string) => {
          const normalized = (value ?? '').replace(',', '.').replace(/[^\d.]/g, '');
          if (!normalized) return true;
          return (
            parseFloat(normalized) > 0 || t('errors.app.validation.amountMin')
          );
        },
      },
    }),
    [t],
  );

  return (
    <Input
      name="amount"
      type="tel"
      rules={rules}
      label={t('ui.input.amount.label', { currency })}
      placeholder={placeholder}
      className={[className, invalid ? 'invalid' : ''].filter(Boolean).join(' ')}
      onBlur={onBlur}
    />
  );
};

export default Amount;
