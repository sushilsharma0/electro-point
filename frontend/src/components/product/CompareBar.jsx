import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useCompareStore } from '@/store/compare';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { catalogApi, listFrom } from '@/lib/api';

export function CompareBar() {
  const ids = useCompareStore((s) => s.ids);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);

  const q = useQuery({
    queryKey: ['compare-bar', ids],
    queryFn: () => catalogApi.compare(ids),
    enabled: ids.length > 0,
  });

  if (!ids.length) return null;
  const products = listFrom(q.data?.products || q.data);

  return (
    <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-store items-center gap-3 overflow-x-auto px-4 py-3">
        <p className="caption shrink-0">Compare {ids.length}/4</p>
        {products.map((p) => (
          <div key={p._id || p.slug} className="flex items-center gap-2 border border-border px-2 py-1 text-sm">
            <span className="max-w-[10rem] truncate">{p.name}</span>
            <button type="button" aria-label={`Remove ${p.name}`} className="cursor-pointer text-muted hover:text-foreground" onClick={() => remove(p._id || p.id)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <div className="ml-auto flex shrink-0 gap-2">
          <Button asChild size="sm">
            <Link to={`/compare?ids=${ids.join(',')}`}>Compare</Link>
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={clear}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
