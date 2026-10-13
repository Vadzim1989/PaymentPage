import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface CardHolderProps {
  className?: string;
  invalid?: boolean;
  placeholder?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const CardHolder = ({
  className,
  invalid,
  placeholder,
  onBlur: externalOnBlur,
}: CardHolderProps) => {
  const { t } = useTranslation();
  const {
    field: { value, onChange, onBlur, ref: fieldRef },
    fieldState: { error },
  } = useController({ name: 'cardholder', defaultValue: '' });

  return (
    <div className="input">
      <div
        className={['input__group', className, invalid ? 'invalid' : '']
          .filter(Boolean)
          .join(' ')}
      >
        <label htmlFor="cardholder">{t('ui.input.cardholder.label')}</label>

        <input
          id="cardholder"
          name="cardholder"
          type="text"
          autoComplete="off"
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onBlur={(e) => {
            onBlur();
            externalOnBlur?.(e);
          }}
          ref={fieldRef}
        />
      </div>

      {error && <div className="input__error">{error.message}</div>}
    </div>
  );
};

export default CardHolder;
