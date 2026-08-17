import { cn } from '@/lib/cn';
import { stockLabel } from '@/lib/product';

export function StockStatus({ item, className }) {
  const { text, tone } = stockLabel(item);
  return (
    <p className={cn('text-sm', tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : 'text-success', className)}>
      {text}
    </p>
  );
}
