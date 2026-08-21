import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { nprToPaisa, paisaToNpr } from '@/lib/money';

const MAX_METHODS = 12;

export function ShippingMethodsEditor({ value, onChange }) {
  const rows = value || [];
  const onlyOne = rows.length === 1;
  const full = atMax(rows);

  const patch = (index, next) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...next } : row)));
  };

  const add = () => {
    if (full) return;
    onChange([
      ...rows,
      {
        code: uniqueCode('method', rows),
        name: '',
        pricePaisa: 0,
        priceNpr: '0',
        eta: '',
      },
    ]);
  };

  const remove = (index) => {
    if (onlyOne) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <fieldset className="space-y-3">
      <legend className="font-display text-base font-semibold">Shipping methods</legend>
      <p className="text-sm text-muted">
        Name and NPR price shown at checkout. Leave price at 0 for Free. Delivery window is the ETA line under the name.
      </p>
      <ul className="space-y-3">
        {rows.map((row, i) => (
          <li key={row.code || `new-${i}`} className="border border-border bg-surface p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_8rem_1fr_auto] sm:items-end">
              <div>
                <Label htmlFor={`ship-name-${i}`}>Name</Label>
                <Input
                  id={`ship-name-${i}`}
                  className="mt-1"
                  required
                  value={row.name || ''}
                  onChange={(e) => patch(i, { name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`ship-price-${i}`}>Price (NPR)</Label>
                <Input
                  id={`ship-price-${i}`}
                  className="mt-1"
                  type="number"
                  min={0}
                  step="0.01"
                  value={nprField(row)}
                  onChange={(e) => patch(i, { priceNpr: e.target.value, pricePaisa: nprToPaisa(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor={`ship-eta-${i}`}>Delivery window</Label>
                <Input
                  id={`ship-eta-${i}`}
                  className="mt-1"
                  placeholder="3–5 days"
                  value={row.eta || ''}
                  onChange={(e) => patch(i, { eta: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={`Remove ${row.name || 'shipping method'}`}
                disabled={onlyOne}
                onClick={() => remove(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" onClick={add} disabled={full}>
        <Plus className="h-4 w-4" />
        Add method
      </Button>
    </fieldset>
  );
}

function nprField(row) {
  if (row.priceNpr != null) return row.priceNpr;
  return String(paisaToNpr(row.pricePaisa ?? 0));
}

function atMax(rows) {
  return (rows || []).length >= MAX_METHODS;
}

function uniqueCode(name, rows) {
  const used = new Set((rows || []).map((r) => r.code));
  const base =
    String(name || 'method')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 28) || 'method';
  if (!used.has(base)) return base;
  let n = 2;
  let code = `${base}_${n}`;
  while (used.has(code)) {
    n += 1;
    code = `${base}_${n}`;
  }
  return code;
}
