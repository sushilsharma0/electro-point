import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi, listFrom } from '@/lib/api';
import { useCompareStore } from '@/store/compare';
import { formatNpr } from '@/lib/money';
import { productImage, stockLabel } from '@/lib/product';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/Container';
import { Seo } from '@/components/Seo';
import { Link } from 'react-router-dom';
import { CompareSkeleton } from '@/components/ui/skeleton';

export function ComparePage() {
  const [sp] = useSearchParams();
  const storeIds = useCompareStore((s) => s.ids);
  const remove = useCompareStore((s) => s.remove);
  const ids = (sp.get('ids') ? sp.get('ids').split(',') : storeIds).filter(Boolean);

  const q = useQuery({
    queryKey: ['compare', ids],
    queryFn: () => catalogApi.compare(ids),
    enabled: ids.length > 0,
  });

  const products = listFrom(q.data?.products || q.data);
  const groups = collectSpecRows(products);

  if (ids.length && q.isLoading) return <CompareSkeleton />;

  return (
    <Container className="py-10">
      <Seo title="Compare" canonical="/compare" />
      <h1 className="font-display text-h1">Compare</h1>
      <p className="mt-2 text-sm text-muted">Up to four devices. On small screens, scroll the table horizontally.</p>
      {!ids.length ? (
        <p className="mt-8 text-sm text-muted">
          Add products from a product page.{' '}
          <Link to="/shop" className="text-accent hover:underline">
            Browse catalog
          </Link>
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm spec-text">
            <thead>
              <tr>
                <th className="sticky left-0 bg-background p-3 text-left" />
                {products.map((p) => (
                  <th key={p._id} className="p-3 text-left font-medium">
                    <img src={productImage(p)} alt="" className="mb-2 h-24 w-24 object-contain product-stage" />
                    <Link to={`/product/${p.slug}`} className="hover:text-accent">
                      {p.name}
                    </Link>
                    <p className="font-sans font-semibold">{formatNpr(p.salePricePaisa || p.pricePaisa)}</p>
                    <Button type="button" size="sm" variant="ghost" onClick={() => remove(p._id || p.id)}>
                      Remove
                    </Button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SpecRow label="Brand" values={products.map((p) => p.brand)} />
              <SpecRow label="Rating" values={products.map((p) => (p.ratingAvg ? Number(p.ratingAvg).toFixed(1) : '—'))} />
              <SpecRow label="Warranty" values={products.map((p) => p.warranty || '—')} />
              <SpecRow label="Stock" values={products.map((p) => stockLabel(p).text)} />
              {groups.map((row) => (
                <SpecRow key={row.label} label={row.label} values={row.values} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}

function SpecRow({ label, values }) {
  return (
    <tr className="border-t border-border">
      <th className="sticky left-0 bg-background p-3 text-left font-medium text-muted">{label}</th>
      {values.map((v, i) => (
        <td key={i} className="p-3">
          {v || '—'}
        </td>
      ))}
    </tr>
  );
}

function collectSpecRows(products) {
  const labels = new Map();
  products.forEach((p, pi) => {
    (p.specGroups || []).forEach((g) => {
      (g.fields || []).forEach((f) => {
        const label = `${g.name} · ${f.label || f.key}`;
        if (!labels.has(label)) labels.set(label, Array(products.length).fill('—'));
        labels.get(label)[pi] = f.value;
      });
    });
  });
  return [...labels.entries()].map(([label, values]) => ({ label, values }));
}
