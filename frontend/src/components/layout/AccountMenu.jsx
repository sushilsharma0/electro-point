import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function AccountMenu() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const closeTimer = useRef(null);

  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const hide = () => {
    clearTimeout(closeTimer.current);
    setOpen(false);
  };

  const scheduleHide = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  };

  useEffect(() => {
    hide();
  }, [loc.pathname]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') hide();
    }
    function onPointerDown(e) {
      if (wrapRef.current?.contains(e.target)) return;
      hide();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') show();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') scheduleHide();
      }}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        tooltip={open ? false : undefined}
        aria-label={user ? 'Account' : 'Sign in'}
        aria-expanded={open}
        aria-haspopup="menu"
        className={open ? 'bg-muted-bg' : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <User />
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-48 border border-border bg-surface-elevated p-2 shadow-md"
        >
          {user ? (
            <>
              <p className="truncate px-2 py-1.5 text-xs text-muted">{user.email || user.name}</p>
              <Link
                role="menuitem"
                to="/account"
                className="block cursor-pointer rounded-sm px-2 py-2 text-sm hover:bg-muted-bg"
                onClick={hide}
              >
                Account
              </Link>
              <Link
                role="menuitem"
                to="/account/orders"
                className="block cursor-pointer rounded-sm px-2 py-2 text-sm hover:bg-muted-bg"
                onClick={hide}
              >
                Orders
              </Link>
              <button
                type="button"
                role="menuitem"
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-danger hover:bg-muted-bg"
                disabled={logout.isPending}
                onClick={() => {
                  logout.mutate();
                  hide();
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                role="menuitem"
                to="/login"
                className="block cursor-pointer rounded-sm px-2 py-2 text-sm hover:bg-muted-bg"
                onClick={hide}
              >
                Sign in
              </Link>
              <Link
                role="menuitem"
                to="/register"
                className="block cursor-pointer rounded-sm px-2 py-2 text-sm hover:bg-muted-bg"
                onClick={hide}
              >
                Create account
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
