import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { card } from '@/utils/creditcard';
import Input from './Input';

interface PanProps {
  name: string;
  mask: string | string[];
  minPanLength: number;
  placeholder?: string;
  className?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const Pan = ({
  name,
  mask,
  minPanLength,
  placeholder,
  className,
  onBlur,
}: PanProps) => {
  const { t } = useTranslation();

  const rules = useMemo(
    () => ({
      required: true,
      validate: {
        panValidation: (value: string | undefined) => {
          if (!value) return true;

          const MIN_PAN_LENGTH = minPanLength || 13;
          const parsedValue = card.parse(value);

          const isLuhnValid = card.luhn(parsedValue);
          const hasValidLength = minPanLength
            ? parsedValue.length >= minPanLength
            : parsedValue.length >= MIN_PAN_LENGTH;

          if (isLuhnValid && hasValidLength) {
            return true;
          }

          if (minPanLength && parsedValue.length < minPanLength) {
            return t('errors.app.validation.panLength', {
              number: minPanLength,
            });
          }

          return t('errors.app.validation.pan');
        },
      },
    }),
    [minPanLength, t],
  );

  return (
    <Input
      name={name}
      mask={mask}
      rules={rules}
      type="tel"
      label={t('ui.input.pan.label')}
      placeholder={placeholder}
      className={className}
      onBlur={onBlur}
    />
  );
};

export default Pan;