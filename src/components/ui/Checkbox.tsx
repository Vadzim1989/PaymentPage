import type { ReactNode } from 'react';
import { useController } from 'react-hook-form';

interface CheckboxProps {
  name: string;
  className?: string;
  label?: string;
  children?: ReactNode;
}

const Checkbox = ({ name, className, label, children }: CheckboxProps) => {
  const {
    field: { value, onChange, onBlur, ref: fieldRef },
  } = useController({ name, defaultValue: false });

  return (
    <div className={['checkbox', className].filter(Boolean).join(' ')}>
      <input
        id={name}
        name={name}
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        onBlur={onBlur}
        ref={fieldRef}
      />
      <label htmlFor={name}>{children ?? label}</label>
    </div>
  );
};

export default Checkbox;
