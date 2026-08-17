import { cn } from '@/lib/cn';

const SIZES = {
  sm: 'h-5 w-5',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export function AdminSpinner({ label = 'Loading', size = 'md', className }) {
  return (
    <div
      className={cn('inline-flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className={cn('ep-spinner', SIZES[size] || SIZES.md)} aria-hidden="true" />
      <span className="caption">{label}</span>
    </div>
  );
}

export function AdminSpinnerScreen({ label = 'Loading', className }) {
  return (
    <div className={cn('flex w-full flex-1 items-center justify-center min-h-[calc(100vh-7.5rem)]', className)}>
      <AdminSpinner label={label} size="lg" />
    </div>
  );
}

export function AdminSpinnerPage({ label = 'Loading' }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <AdminSpinner label={label} size="lg" />
    </div>
  );
}
