import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner = ({
  size = 'md',
  label,
  fullScreen = false,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinner = (
    <div className={clsx('spinner', sizeClasses[size])}></div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 z-50">
        <div className="text-center">
          {spinner}
          {label && <p className="mt-4 text-gray-600">{label}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {spinner}
      {label && <p className="mt-2 text-gray-600">{label}</p>}
    </div>
  );
};
