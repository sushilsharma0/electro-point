import { Outlet } from 'react-router-dom';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export function AdminLoginLayout() {
  return (
    <div className="dark flex min-h-screen flex-col bg-background text-foreground">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
        <p className="font-display text-sm font-semibold tracking-tight">ElectroPoint Admin</p>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-foreground"
          >
            Storefront
          </a>
        </div>
      </header>
      <main id="main" className="flex flex-1">
        <Outlet />
      </main>
    </div>
  );
}
