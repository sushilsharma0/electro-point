import { Outlet } from 'react-router-dom';
import { Suspense, useState } from 'react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { AdminSpinnerScreen } from '@/components/ui/spinner';
import { ChunkLoadingSignal } from '@/components/loading/ChunkLoadingSignal';
import { useAdminAuth } from '@/hooks/useAuth';

export function AdminLoginLayout() {
  const { isLoading: authLoading } = useAdminAuth();
  const [chunkLoading, setChunkLoading] = useState(false);
  const showSpinner = authLoading || chunkLoading;

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
      <main id="main" className="relative flex flex-1">
        <Suspense fallback={<ChunkLoadingSignal onChange={setChunkLoading} />}>
          <Outlet />
        </Suspense>
        {showSpinner ? (
          <div className="absolute inset-0 z-10 bg-background">
            <AdminSpinnerScreen className="min-h-[calc(100vh-56px)]" />
          </div>
        ) : null}
      </main>
    </div>
  );
}
