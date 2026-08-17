import { Link } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SearchBox } from '@/components/layout/SearchBox';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

export function MobileNav({ open, onOpenChange, categories = [] }) {
  const { user, isAdmin, logout } = useAuth();
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" title="Menu" className="flex flex-col gap-6 pt-12">
        <SearchBox compact onNavigate={close} />
        <nav className="flex flex-col gap-1" aria-label="Mobile">
          <Link to="/shop" onClick={close} className="py-2 text-base font-medium">
            All products
          </Link>
          {categories.map((c) => (
            <Link key={c._id || c.slug} to={`/category/${c.slug}`} onClick={close} className="py-2 text-sm text-muted hover:text-foreground">
              {c.name}
            </Link>
          ))}
        </nav>
        <Separator />
        <nav className="flex flex-col gap-2 text-sm">
          <Link to="/compare" onClick={close}>Compare</Link>
          <Link to="/account/wishlist" onClick={close}>Wishlist</Link>
          <Link to={user ? '/account' : '/login'} onClick={close}>{user ? 'Account' : 'Sign in'}</Link>
          {isAdmin ? (
            <Link to="/admin" onClick={close}>Admin</Link>
          ) : null}
          <Link to="/contact" onClick={close}>Contact</Link>
          {user ? (
            <button type="button" className="cursor-pointer py-2 text-left text-danger" onClick={() => { logout.mutate(); close(); }}>
              Sign out
            </button>
          ) : null}
        </nav>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm text-muted">Appearance</span>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
