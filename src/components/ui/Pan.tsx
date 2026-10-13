import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
        minPanLength: (value: string) => {
          const digits = (value ?? '').replace(/\D/g, '');
          return (
            digits.length >= minPanLength ||
            t('ui.input.pan.minLengthError') ||
            `PAN must be at least ${minPanLength} digits`
          );
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