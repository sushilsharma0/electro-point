import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { listFrom } from '@/lib/api';
import { MegaMenuSkeleton } from '@/components/ui/skeleton';
import { WithTooltip } from '@/components/ui/tooltip';

export function MegaMenu({ categories, open, onClose, isLoading = false }) {
  const tree = listFrom(categories);
  const [active, setActive] = useState(tree[0]?._id || tree[0]?.id);

  if (!open) return null;
  if (isLoading) return <MegaMenuSkeleton />;
  if (!tree.length) return null;

  const current = tree.find((c) => (c._id || c.id) === active) || tree[0];
  const children = current?.children || [];

  function focusCategoryAt(index) {
    const buttons = document.querySelectorAll('#shop-megamenu [data-mega-cat]');
    const next = buttons[index];
    if (next) {
      next.focus();
      const id = next.getAttribute('data-mega-cat');
      if (id) setActive(id);
    }
  }

  return (
    <div
      id="shop-megamenu"
      role="region"
      aria-label="Shop categories"
      className="absolute left-0 right-0 top-full z-40 border-b border-border bg-surface-elevated shadow-md"
    >
      <div className="mx-auto grid max-w-store grid-cols-12 gap-0 px-4 sm:px-6 lg:px-8">
        <ul className="col-span-4 border-r border-border py-6 pr-4 lg:col-span-3" role="list">
          {tree.map((cat, index) => {
            const id = cat._id || cat.id;
            return (
              <li key={id}>
                <button
                  type="button"
                  data-mega-cat={id}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm transition-colors duration-200',
                    id === (current?._id || current?.id) ? 'text-accent' : 'text-foreground hover:bg-muted-bg',
                  )}
                  aria-current={id === (current?._id || current?.id) ? 'true' : undefined}
                  onMouseEnter={() => setActive(id)}
                  onFocus={() => setActive(id)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      focusCategoryAt((index + 1) % tree.length);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      focusCategoryAt((index - 1 + tree.length) % tree.length);
                    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                      e.preventDefault();
                      document.querySelector('#shop-megamenu [data-mega-panel] a')?.focus();
                    } else if (e.key === 'Home') {
                      e.preventDefault();
                      focusCategoryAt(0);
                    } else if (e.key === 'End') {
                      e.preventDefault();
                      focusCategoryAt(tree.length - 1);
                    }
                  }}
                >
                  {cat.name}
                  <WithTooltip label="Open category">
                    <ChevronRight className="h-3.5 w-3.5 text-muted" />
                  </WithTooltip>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="col-span-8 py-6 pl-8 lg:col-span-9" data-mega-panel>
          <Link
            to={`/category/${current.slug}`}
            className="font-display text-lg font-semibold hover:text-accent"
            onClick={onClose}
          >
            {current.name}
          </Link>
          {current.description ? <p className="mt-1 max-w-xl text-sm text-muted">{current.description}</p> : null}
          <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 md:grid-cols-3">
            {children.map((child) => (
              <li key={child._id || child.id}>
                <Link
                  to={`/category/${child.slug}`}
                  className="text-sm text-foreground hover:text-accent"
                  onClick={onClose}
                >
                  {child.name}
                </Link>
              </li>
            ))}
            {!children.length ? (
              <li>
                <Link to={`/category/${current.slug}`} className="text-sm text-accent" onClick={onClose}>
                  Shop all {current.name}
                </Link>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
