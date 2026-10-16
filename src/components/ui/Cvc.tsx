import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Input from './Input';
import { CARD_BRAND } from '@/constants/index';

interface CvcProps {
  minCvcLength: number;
  brand?: string;
  mask?: string;
  placeholder?: string;
  className?: string;
  label?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const Cvc = ({
  minCvcLength,
  brand,
  mask = '000',
  placeholder,
  className,
  label,
  onBlur,
}: CvcProps) => {
  const { t } = useTranslation();

  const isRequired = useMemo(
    () => (brand ? brand !== CARD_BRAND.UPI : true),
    [brand],
  );

  const rules = useMemo(
    () => ({
      required: isRequired,
      validate: {
        minCvcLength: (value: string) => {
          const digits = (value ?? '').replace(/\D/g, '');
          if (!isRequired && !digits.length) return true;
          if (digits.length >= minCvcLength) return true;
          return (
            t('errors.app.validation.length', { number: minCvcLength }) ||
            `CVC must be at least ${minCvcLength} digits`
          );
        },
      },
    }),
    [isRequired, minCvcLength, t],
  );

  return (
    <Input
      name="cvc"
      mask={mask}
      rules={rules}
      type="tel"
      label={label ?? t('ui.input.cvc.label')}
      placeholder={placeholder}
      className={className}
      onBlur={onBlur}
    />
  );
};

export default Cvc;