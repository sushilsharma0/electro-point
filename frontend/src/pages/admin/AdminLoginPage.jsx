import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/label';
import { Seo } from '@/components/Seo';
import { toast } from 'sonner';
import { WithTooltip } from '@/components/ui/tooltip';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Minimum 8 characters'),
});

export function AdminLoginPage() {
  const { login, user, isLoading } = useAdminAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get('next')?.startsWith('/admin') ? sp.get('next') : '/admin/dashboard';
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  useEffect(() => {
    if (!isLoading && user) nav(next, { replace: true });
  }, [isLoading, user, nav, next]);

  if (isLoading) return null;

  return (
    <div className="grid min-h-[calc(100vh-56px)] w-full lg:grid-cols-2">
      <Seo title="Admin sign in" canonical="/admin/login" noindex />
      <section className="hidden flex-col justify-between border-r border-border bg-surface p-10 lg:flex">
        <div>
          <p className="caption">Staff console</p>
          <h1 className="mt-4 max-w-sm font-display text-h1">Catalog, orders, and payouts — not the storefront.</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            This session stays in the admin tab. Signing in here does not sign you into the customer shop, account, or checkout.
          </p>
        </div>
        <ul className="space-y-2 text-sm text-muted">
          <li>Separate cookies from customer accounts</li>
          <li>NPR pricing verified on the server</li>
          <li>eSewa and Khalti status checked against the gateway</li>
        </ul>
      </section>
      <section className="flex items-center justify-center bg-background px-4 py-16 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 text-accent">
            <WithTooltip label="Staff only">
              <Shield className="h-4 w-4" />
            </WithTooltip>
            <p className="caption text-accent">Authorized staff only</p>
          </div>
          <h2 className="font-display text-h2">Sign in to admin</h2>
          <p className="mt-2 text-sm text-muted">Use the superadmin email from your server environment. Customer accounts cannot enter this console.</p>
          <form
            className="mt-8 space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await login.mutateAsync(values);
                toast.success('Admin session started');
                nav(next, { replace: true });
              } catch (err) {
                toast.error(err.message || 'Could not sign in');
              }
            })}
          >
            <div>
              <Label htmlFor="admin-email">Staff email</Label>
              <Input id="admin-email" type="email" className="mt-1" autoComplete="username" {...form.register('email')} />
              <FieldError>{form.formState.errors.email?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input id="admin-password" type="password" className="mt-1" autoComplete="current-password" {...form.register('password')} />
              <FieldError>{form.formState.errors.password?.message}</FieldError>
            </div>
            <Button type="submit" className="w-full" disabled={login.isPending}>
              Enter console
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
