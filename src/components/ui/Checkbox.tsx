import type { ReactNode } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

interface CheckboxProps {
  name: string;
  className?: string;
  label?: string;
  children?: ReactNode;
}

const Checkbox = ({ name, className, label, children }: CheckboxProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={false}
      render={({ field: { value, onChange, onBlur, ref } }) => {
        return (
          <div className={['checkbox', className].filter(Boolean).join(' ')}>
            <input
              id={name}
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              onBlur={onBlur}
              ref={ref}
            />
            <label htmlFor={name}>{children ?? label}</label>
          </div>
        );
      }}
    />
  );
};

export default Checkbox;
