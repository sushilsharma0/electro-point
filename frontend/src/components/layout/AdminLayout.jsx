import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Ticket,
  Users,
  Wallet,
} from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

const LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/payments', label: 'Payments', icon: Wallet },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Logo />
        </div>
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Admin">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-200',
                  isActive ? 'bg-muted-bg text-foreground' : 'text-muted hover:bg-muted-bg hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3 text-xs text-muted">
          {user?.email}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
          <span className="font-display text-sm font-semibold lg:hidden">Admin</span>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Storefront</Link>
            </Button>
            <ThemeToggle />
            <Button type="button" variant="ghost" size="icon" aria-label="Sign out" onClick={() => logout.mutate()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2 lg:hidden" aria-label="Admin mobile">
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn('whitespace-nowrap rounded-md px-3 py-1.5 text-xs', isActive ? 'bg-muted-bg' : 'text-muted')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <main id="main" className="mx-auto w-full max-w-admin flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
