import { cn } from '@/lib/cn';

function uniqueOptions(variants, key) {
  const vals = [];
  (variants || []).forEach((v) => {
    const val = v.options?.[key];
    if (val && !vals.includes(val)) vals.push(val);
  });
  return vals;
}

export function VariantPicker({ variants = [], selectedId, onChange }) {
  if (!variants.length) return null;
  const selected = variants.find((v) => String(v._id || v.id) === String(selectedId)) || variants[0];
  const keys = [...new Set(variants.flatMap((v) => Object.keys(v.options || {}).filter((k) => v.options[k])))];

  const pick = (key, value) => {
    const match =
      variants.find((v) => {
        const opts = { ...(selected?.options || {}), [key]: value };
        return keys.every((k) => !opts[k] || v.options?.[k] === opts[k]);
      }) || variants.find((v) => v.options?.[key] === value);
    if (match) onChange(match._id || match.id);
  };

  return (
    <div className="space-y-4">
      {keys.map((key) => {
        const values = uniqueOptions(variants, key);
        const isColor = key.toLowerCase() === 'color';
        return (
          <fieldset key={key}>
            <legend className="caption mb-2">
              {key} {selected?.options?.[key] ? `· ${selected.options[key]}` : ''}
            </legend>
            {isColor ? (
              <div className="flex flex-wrap gap-2">
                {values.map((val) => (
                  <button
                    key={val}
                    type="button"
                    aria-label={val}
                    title={val}
                    onClick={() => pick(key, val)}
                    className={cn(
                      'h-6 w-6 cursor-pointer rounded-full border',
                      selected?.options?.[key] === val ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-background' : 'border-border',
                    )}
                    style={{ background: guessColor(val) }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {values.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => pick(key, val)}
                    className={cn(
                      'cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors duration-200',
                      selected?.options?.[key] === val ? 'border-foreground bg-muted-bg' : 'border-border hover:border-foreground/40',
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}

function guessColor(name) {
  const n = String(name).toLowerCase();
  const map = {
    black: '#111111',
    white: '#f4f4f4',
    silver: '#c0c4cc',
    gray: '#6b7280',
    grey: '#6b7280',
    blue: '#1d4ed8',
    navy: '#1e3a5f',
    red: '#b91c1c',
    green: '#166534',
    gold: '#b45309',
    purple: '#5b21b6',
    pink: '#db2777',
    titanium: '#8b8f98',
    graphite: '#374151',
    starlight: '#e7e0d4',
    midnight: '#0f172a',
  };
  return map[n] || '#9aa3ae';
}
