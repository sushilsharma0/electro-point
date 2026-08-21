import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEFAULT_COUNTRY_CODES } from '@/lib/phone';

const MAX_CODES = 20;

export function CountryCodesEditor({ value, onChange }) {
  const rows = value?.length ? value : DEFAULT_COUNTRY_CODES;
  const onlyOne = rows.length === 1;
  const full = rows.length >= MAX_CODES;

  const patch = (index, next) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...next } : row)));
  };

  const add = () => {
    if (full) return;
    onChange([...rows, { dial: '', label: '', iso: '' }]);
  };

  const remove = (index) => {
    if (onlyOne) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <fieldset className="space-y-3">
      <legend className="font-display text-base font-semibold">Country codes</legend>
      <p className="text-sm text-muted">
        Codes shown on Create account next to the mobile number. Sign-in still uses the number only, without the country code.
      </p>
      <ul className="space-y-3">
        {rows.map((row, i) => (
          <li key={`cc-${i}`} className="border border-border bg-surface p-4">
            <div className="grid gap-3 sm:grid-cols-[7rem_1fr_5rem_auto] sm:items-end">
              <div>
                <Label htmlFor={`cc-dial-${i}`}>Dial</Label>
                <Input
                  id={`cc-dial-${i}`}
                  className="mt-1"
                  inputMode="numeric"
                  placeholder="977"
                  required
                  value={row.dial || ''}
                  onChange={(e) => patch(i, { dial: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                />
              </div>
              <div>
                <Label htmlFor={`cc-label-${i}`}>Country</Label>
                <Input
                  id={`cc-label-${i}`}
                  className="mt-1"
                  required
                  placeholder="Nepal"
                  value={row.label || ''}
                  onChange={(e) => patch(i, { label: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`cc-iso-${i}`}>ISO</Label>
                <Input
                  id={`cc-iso-${i}`}
                  className="mt-1 uppercase"
                  maxLength={2}
                  placeholder="NP"
                  value={row.iso || ''}
                  onChange={(e) => patch(i, { iso: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={`Remove ${row.label || 'country code'}`}
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
        Add country code
      </Button>
    </fieldset>
  );
}
