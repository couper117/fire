import { forwardRef } from 'react';
import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string | number; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, ...props }, ref) => {
    return (
      <div className="form-group">
        {label && <label className="form-label">{label}</label>}
        <select
          ref={ref}
          className={clsx(
            'form-input',
            error && 'form-input-error',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <div className="flex items-center gap-2 mt-1 text-sm text-danger-600">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {helperText && !error && <p className="text-sm text-gray-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export { Select };
