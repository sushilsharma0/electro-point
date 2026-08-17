import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/label';
import { Container } from '@/components/layout/Container';
import { Seo } from '@/components/Seo';
import { toast } from 'sonner';
import { StaffLoginLink } from '@/components/layout/StaffLoginLink';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Minimum 8 characters'),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2),
  phone: z.string().optional(),
});

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const rawNext = sp.get('next') || '/account';
  const next = rawNext.startsWith('/admin') ? '/account' : rawNext;
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  return (
    <Container className="max-w-md py-16">
      <Seo title="Sign in" canonical="/login" noindex />
      <h1 className="font-display text-h1">Sign in</h1>
      <p className="mt-2 text-sm text-muted">Guests can browse. An account is required for checkout and wishlist.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await login.mutateAsync(values);
            toast.success('Signed in');
            nav(next);
          } catch (err) {
            toast.error(err.message || 'Could not sign in');
          }
        })}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" className="mt-1" autoComplete="email" {...form.register('email')} />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" className="mt-1" autoComplete="current-password" {...form.register('password')} />
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </div>
        <Button type="submit" className="w-full" disabled={login.isPending}>
          Sign in
        </Button>
      </form>
      <p className="mt-4 text-sm">
        <Link to="/forgot-password" className="text-accent hover:underline">
          Forgot password
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted">
        New here?{' '}
        <Link to={`/register?next=${encodeURIComponent(next)}`} className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted">
        Staff?{' '}
        <StaffLoginLink className="text-accent hover:underline" />
      </p>
    </Container>
  );
}

export function RegisterPage() {
  const { register: registerMut } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get('next') || '/account';
  const form = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', password: '', phone: '' } });

  return (
    <Container className="max-w-md py-16">
      <Seo title="Create account" canonical="/register" noindex />
      <h1 className="font-display text-h1">Create account</h1>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await registerMut.mutateAsync(values);
            toast.success('Account created');
            nav(next);
          } catch (err) {
            toast.error(err.message || 'Could not register');
          }
        })}
      >
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" className="mt-1" autoComplete="name" {...form.register('name')} />
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" className="mt-1" autoComplete="email" {...form.register('email')} />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" className="mt-1" autoComplete="tel" {...form.register('phone')} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" className="mt-1" autoComplete="new-password" {...form.register('password')} />
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </div>
        <Button type="submit" className="w-full" disabled={registerMut.isPending}>
          Register
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </Container>
  );
}

export function ForgotPasswordPage() {
  const form = useForm({ resolver: zodResolver(z.object({ email: z.string().email() })) });
  return (
    <Container className="max-w-md py-16">
      <Seo title="Forgot password" noindex />
      <h1 className="font-display text-h1">Reset password</h1>
      <p className="mt-2 text-sm text-muted">If the email exists, we send a reset link. We do not reveal whether the account is registered. You will see an error if email delivery is not configured on the server.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await authApi.forgotPassword(values);
            toast.success('If that email is registered, a reset link is on its way.');
          } catch (err) {
            toast.error(err.message);
          }
        })}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" className="mt-1" {...form.register('email')} />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </div>
        <Button type="submit" className="w-full">
          Send link
        </Button>
      </form>
    </Container>
  );
}

export function ResetPasswordPage() {
  const [sp] = useSearchParams();
  const token = sp.get('token') || '';
  const form = useForm({
    resolver: zodResolver(z.object({ password: z.string().min(8), confirm: z.string().min(8) }).refine((d) => d.password === d.confirm, { message: 'Passwords must match', path: ['confirm'] })),
  });
  const nav = useNavigate();

  return (
    <Container className="max-w-md py-16">
      <Seo title="Set new password" noindex />
      <h1 className="font-display text-h1">New password</h1>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await authApi.resetPassword({ token, password: values.password });
            toast.success('Password updated');
            nav('/login');
          } catch (err) {
            toast.error(err.message);
          }
        })}
      >
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" className="mt-1" {...form.register('password')} />
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="confirm">Confirm</Label>
          <Input id="confirm" type="password" className="mt-1" {...form.register('confirm')} />
          <FieldError>{form.formState.errors.confirm?.message}</FieldError>
        </div>
        <Button type="submit" className="w-full">
          Update password
        </Button>
      </form>
    </Container>
  );
}
