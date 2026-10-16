import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface EmailProps {
  className?: string;
  invalid?: boolean;
  placeholder?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const Email = ({className, invalid, placeholder, onBlur: externalOnBlur}: EmailProps) => {
  const { t } = useTranslation();
  const { control } = useFormContext();

  return (
      <Controller
        name='email'
        control={control}
        defaultValue={''}
        render={(
            { 
                field: { value, onChange, onBlur, ref: fieldRef },
                fieldState: { error } 
            }) => (
            <div className="input">
                <div
                    className={['input__group', className, invalid ? 'invalid' : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                    <label htmlFor="email">{t('ui.input.email.label')}</label>

                    <input
                        id="email"
                        name="email"
                        type="email"
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
        )}
      />
  );
};

export default Email;