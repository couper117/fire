import { forwardRef } from 'react';
import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, ...props }, ref) => {
    return (
      <div className="form-group">
        {label && <label className="form-label">{label}</label>}
        <div className="relative">
          {icon && <div className="absolute left-3 top-3 text-gray-400">{icon}</div>}
          <input
            ref={ref}
            className={clsx(
              'form-input',
              icon && 'pl-10',
              error && 'form-input-error',
              className
            )}
            {...props}
          />
        </div>
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

Input.displayName = 'Input';
export { Input };
