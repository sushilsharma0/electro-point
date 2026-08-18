import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/cn';
import { breadcrumbJsonLd } from '@/components/Seo';

export function Breadcrumbs({ items = [], className }) {
  if (!items.length) return null;
  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd(items))}</script>
      </Helmet>
      <nav className={cn('text-sm text-muted', className)} aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-1">
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={`${item.name}-${i}`} className="inline-flex items-center gap-x-1">
                {i > 0 ? <span aria-hidden="true">/</span> : null}
                {last || !item.href ? (
                  <span className="font-medium text-foreground" aria-current={last ? 'page' : undefined}>
                    {item.name}
                  </span>
                ) : (
                  <Link to={item.href} className="transition-colors duration-200 hover:text-accent">
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
