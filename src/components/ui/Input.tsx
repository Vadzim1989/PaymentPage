import { useEffect, useRef, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import type { RegisterOptions } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import deleteIcon from '@/assets/img/delete.svg';

const MaskedInput = IMaskInput as unknown as React.ComponentType<any>;

type InputProps = {
  label?: string;
  name: string;
  rules?: RegisterOptions;
  className?: string;
  mask?: string | string[];
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'>;

const Input = ({ label, name, rules, className, mask, onBlur: externalOnBlur, ...rest }: InputProps) => {
  const { control, setValue } = useFormContext();

  const {
    field: { value, onChange, onBlur, ref: fieldRef, name: fieldName },
    fieldState: { error },
  } = useController({ name, control, rules });

  const [isVisibleClearIcon, setIsVisibleClearIcon] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setIsVisibleClearIcon(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setValue(name, '', { shouldValidate: false, shouldDirty: true });
    setIsVisibleClearIcon(false);
  };
  
  const commonProps = {
    id: name,
    ...rest,
    name: fieldName,
    type: name === 'cvc' ? 'password' : 'text',
    value: value ?? '',
    onChange,
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur();
      externalOnBlur?.(e);
    },
    autoComplete: 'off',
    onFocus: () => setIsVisibleClearIcon(true),
  };

  return (
    <div className="input" ref={containerRef}>
      <div className={`input__group ${className ?? ''}`}>
        <label htmlFor={name}>{label}</label>

        {mask ? (
          <MaskedInput
            {...commonProps}
            inputRef={fieldRef}
            mask={mask}
            onAccept={(val: string) => onChange(val)}
          />
        ) : (
          <input {...commonProps} ref={fieldRef} />
        )}
      </div>

      {value && isVisibleClearIcon && (
        <div className="clear-icon" onClick={handleClear}>
          <img src={deleteIcon} alt="Clear Icon" />
        </div>
      )}

      {error && <div className="input__error">{error.message}</div>}
    </div>
  );
};

export default Input;