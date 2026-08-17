import { NavLink, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { Container } from '@/components/layout/Container';
import { cn } from '@/lib/cn';
import { AccountSkeleton } from '@/components/ui/skeleton';

const LINKS = [
  { to: '/account', label: 'Overview', end: true },
  { to: '/account/orders', label: 'Orders' },
  { to: '/account/profile', label: 'Profile' },
  { to: '/account/addresses', label: 'Addresses' },
  { to: '/account/wishlist', label: 'Wishlist' },
  { to: '/account/reviews', label: 'Reviews' },
];

export function AccountLayout() {
  return (
    <Container className="py-10">
      <h1 className="font-display text-h1">Account</h1>
      <nav className="mt-6 flex gap-4 overflow-x-auto border-b border-border" aria-label="Account">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              cn(
                'whitespace-nowrap border-b-2 pb-3 text-sm transition-colors duration-200',
                isActive ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground',
              )
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="py-8">
        <Suspense fallback={<AccountSkeleton />}>
          <Outlet />
        </Suspense>
      </div>
    </Container>
  );
}
