import { discountPercent, formatNpr } from '@/lib/money';
import { cn } from '@/lib/cn';

export function PriceDisplay({ pricePaisa, salePricePaisa, size = 'md', className }) {
  const sale = salePricePaisa != null && salePricePaisa > 0 && salePricePaisa < pricePaisa;
  const current = sale ? salePricePaisa : pricePaisa;
  const pct = sale ? discountPercent(pricePaisa, salePricePaisa) : 0;
  const sizeCls = size === 'lg' ? 'text-2xl md:text-[28px]' : size === 'sm' ? 'text-sm' : 'text-lg';

  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)} data-price>
      <span className={cn('price-display', sizeCls)}>{formatNpr(current)}</span>
      {sale ? (
        <>
          <span className="text-sm text-price-was line-through">{formatNpr(pricePaisa)}</span>
          <span className="text-sm text-danger">−{pct}%</span>
        </>
      ) : null}
    </div>
  );
}
