import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { catalogApi, listFrom } from '@/lib/api';
import { useDebounce } from '@/hooks/useMedia';
import { getRecentSearches, pushRecentSearch } from '@/lib/storage';
import { Input } from '@/components/ui/input';
import { formatNpr } from '@/lib/money';
import { productImage } from '@/lib/product';

export function SearchBox({ compact = false, onNavigate }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(q, 250);
  const nav = useNavigate();
  const boxRef = useRef(null);

  const suggest = useQuery({
    queryKey: ['suggest', debounced],
    queryFn: () => catalogApi.suggest(debounced),
    enabled: debounced.trim().length >= 2,
  });

  const products = listFrom(suggest.data?.products || suggest.data);
  const recent = getRecentSearches();

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const go = (term) => {
    const t = (term || q).trim();
    if (!t) return;
    pushRecentSearch(t);
    setOpen(false);
    onNavigate?.();
    nav(`/search?q=${encodeURIComponent(t)}`);
  };

  return (
    <div ref={boxRef} className={compact ? 'relative w-full' : 'relative hidden w-full max-w-md md:block'}>
      <label htmlFor={compact ? 'mobile-search' : 'nav-search'} className="sr-only">
        Search products
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          id={compact ? 'mobile-search' : 'nav-search'}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') go();
          }}
          placeholder="Search devices, brands, SKU"
          className="pl-9"
          autoComplete="off"
        />
      </div>
      {open ? (
        <div className="absolute z-50 mt-1 w-full border border-border bg-surface-elevated shadow-md">
          {products.length ? (
            <ul>
              {products.slice(0, 6).map((p) => (
                <li key={p._id || p.slug}>
                  <Link
                    to={`/product/${p.slug}`}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted-bg"
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                  >
                    <img src={productImage(p)} alt="" className="h-10 w-10 object-contain product-stage" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{p.name}</span>
                      <span className="text-xs text-muted">{p.brand}</span>
                    </span>
                    <span className="text-sm font-medium tabular">{formatNpr(p.salePricePaisa || p.pricePaisa, { compact: true })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : q.trim().length >= 2 && !suggest.isFetching ? (
            <p className="px-3 py-4 text-sm text-muted">No matches. Press Enter to search.</p>
          ) : recent.length ? (
            <div className="p-3">
              <p className="caption mb-2">Recent</p>
              <ul className="space-y-1">
                {recent.map((term) => (
                  <li key={term}>
                    <button type="button" className="text-sm hover:text-accent cursor-pointer" onClick={() => go(term)}>
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="px-3 py-4 text-sm text-muted">Try “OLED monitor” or a brand name.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
