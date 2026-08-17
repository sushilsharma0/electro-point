import { cn } from '@/lib/cn';

export function Container({ className, as: Comp = 'div', wide = false, ...props }) {
  return (
    <Comp
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', wide ? 'max-w-admin' : 'max-w-store', className)}
      {...props}
    />
  );
}
