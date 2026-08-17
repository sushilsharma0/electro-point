import { Link, NavLink, useLocation } from 'react-router-dom';
import { GitCompare, Heart, Menu, ShoppingBag, User } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/layout/Logo';
import { SearchBox } from '@/components/layout/SearchBox';
import { MegaMenu } from '@/components/layout/MegaMenu';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { MobileNav } from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useCategories } from '@/hooks/useCatalog';
import { useCompareStore } from '@/store/compare';
import { listFrom } from '@/lib/api';
import { cn } from '@/lib/cn';

export function Navbar() {
  const { user, isAdmin } = useAuth();
  const { count } = useCart();
  const cats = useCategories();
  const categories = listFrom(cats.data);
  const compareCount = useCompareStore((s) => s.ids.length);
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const loc = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-store items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Button type="button" variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setMobile(true)}>
          <Menu />
        </Button>
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          <div onMouseEnter={() => setMega(true)}>
            <button
              type="button"
              className={cn(
                'relative py-5 text-sm font-medium cursor-pointer after:absolute after:bottom-3 after:left-0 after:h-px after:w-full after:bg-accent after:opacity-0 after:transition-opacity',
                mega || loc.pathname.startsWith('/category') || loc.pathname === '/shop' ? 'after:opacity-100' : 'hover:after:opacity-100',
              )}
              aria-expanded={mega}
              aria-haspopup="true"
            >
              Shop
            </button>
          </div>
          <NavLink
            to="/compare"
            className={({ isActive }) =>
              cn('relative py-5 text-sm font-medium after:absolute after:bottom-3 after:left-0 after:h-px after:w-full after:bg-accent', isActive ? 'after:opacity-100' : 'after:opacity-0 hover:after:opacity-100')
            }
          >
            Compare
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              cn('relative py-5 text-sm font-medium after:absolute after:bottom-3 after:left-0 after:h-px after:w-full after:bg-accent', isActive ? 'after:opacity-100' : 'after:opacity-0 hover:after:opacity-100')
            }
          >
            About
          </NavLink>
        </nav>
        <SearchBox />
        <div className="ml-auto flex items-center gap-0.5">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Button asChild variant="ghost" size="icon" aria-label={`Compare ${compareCount} products`}>
            <Link to="/compare" className="relative">
              <GitCompare />
              {compareCount ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-sm bg-accent px-0.5 text-[10px] text-white">
                  {compareCount}
                </span>
              ) : null}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
            <Link to="/account/wishlist">
              <Heart />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label={user ? 'Account' : 'Sign in'}>
            <Link to={user ? (isAdmin ? '/admin' : '/account') : '/login'}>
              <User />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label={`Cart, ${count} items`}>
            <Link to="/cart" className="relative">
              <ShoppingBag />
              {count ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-sm bg-primary px-0.5 text-[10px] text-primary-fg">
                  {count}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>
      <MegaMenu categories={categories} open={mega} onClose={() => setMega(false)} />
      <MobileNav open={mobile} onOpenChange={setMobile} categories={categories} />
    </header>
  );
}
