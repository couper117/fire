import { forwardRef } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    icon,
    children,
    disabled,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-300',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100',
      danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500 disabled:bg-danger-300',
      success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 disabled:bg-success-300',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-2',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-3',
    };

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          (loading || disabled) && 'disabled opacity-60',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
