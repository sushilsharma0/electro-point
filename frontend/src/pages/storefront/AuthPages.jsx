import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useCatalog';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/label';
import { PhoneCountryField } from '@/components/ui/PhoneCountryField';
import { Container } from '@/components/layout/Container';
import { Seo } from '@/components/Seo';
import { toast } from 'sonner';
import { StaffLoginLink } from '@/components/layout/StaffLoginLink';
import { PASSWORD_HINT, applyApiFieldErrors, apiErrorMessage, passwordSchema } from '@/lib/validation';
import { DEFAULT_COUNTRY_CODES, isNationalMobile } from '@/lib/phone';

const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or mobile number'),
  password: z.string().min(1, 'Enter your password'),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is required'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
    countryCode: z.string().trim().min(1, 'Select a country code'),
    phone: z.string().trim().min(1, 'Mobile number is required'),
    password: passwordSchema(z),
  })
  .superRefine((data, ctx) => {
    if (!isNationalMobile(data.phone, data.countryCode)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid mobile number', path: ['phone'] });
    }
  });

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const rawNext = sp.get('next') || '/account';
  const next = rawNext.startsWith('/admin') ? '/account' : rawNext;
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { identifier: '', password: '' } });

  return (
    <Container className="max-w-md py-16">
      <Seo title="Sign in" canonical="/login" noindex />
      <h1 className="font-display text-h1">Sign in</h1>
      <p className="mt-2 text-sm text-muted">Sign in with the email or mobile number on your account. Country code is not needed. Guests can browse; an account is required for checkout and wishlist.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await login.mutateAsync({
              identifier: values.identifier.trim(),
              password: values.password,
            });
            toast.success('Signed in');
            nav(next);
          } catch (err) {
            toast.error(err.message || 'Could not sign in');
          }
        })}
      >
        <div>
          <Label htmlFor="identifier">Email or mobile number</Label>
          <Input
            id="identifier"
            type="text"
            inputMode="email"
            className="mt-1"
            autoComplete="username"
            placeholder="you@email.com or 98XXXXXXXX"
            {...form.register('identifier')}
          />
          <FieldError>{form.formState.errors.identifier?.message}</FieldError>
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
  const { settings } = useSettings();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get('next') || '/account';
  const codes = settings.countryCodes?.length ? settings.countryCodes : DEFAULT_COUNTRY_CODES;
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', phone: '', countryCode: codes[0]?.dial || '977' },
  });

  useEffect(() => {
    const allowed = codes.map((row) => row.dial);
    const current = form.getValues('countryCode');
    if (!current || !allowed.includes(current)) {
      form.setValue('countryCode', codes[0]?.dial || '977');
    }
  }, [codes, form]);

  return (
    <Container className="max-w-md py-16">
      <Seo title="Create account" canonical="/register" noindex />
      <h1 className="font-display text-h1">Create account</h1>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await registerMut.mutateAsync({
              ...values,
              countryCode: values.countryCode || codes[0]?.dial,
              phone: values.phone.trim(),
            });
            toast.success('Account created');
            nav(next);
          } catch (err) {
            const emailTaken =
              (err.status === 409 || err.code === 'CONFLICT') &&
              /email already registered/i.test(err.message || '');
            if (emailTaken) {
              form.setError('email', {
                type: 'server',
                message: 'This email is already registered. Sign in instead.',
              });
              toast.error('This email is already registered.');
              return;
            }
            applyApiFieldErrors(form.setError, err);
            toast.error(apiErrorMessage(err, 'Could not register'));
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
          <Input
            id="email"
            type="email"
            className="mt-1"
            autoComplete="email"
            {...form.register('email', { onChange: () => form.clearErrors('email') })}
          />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="phone">Mobile number</Label>
          <PhoneCountryField
            id="phone"
            codes={codes}
            control={form.control}
            register={form.register('phone')}
          />
          <FieldError>{form.formState.errors.phone?.message || form.formState.errors.countryCode?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" className="mt-1" autoComplete="new-password" {...form.register('password')} />
          <p className="mt-1 text-xs text-muted">{PASSWORD_HINT}</p>
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </div>
        <Button type="submit" className="w-full" disabled={registerMut.isPending}>
          Register
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{' '}
        <Link to={`/login?next=${encodeURIComponent(next)}`} className="text-accent hover:underline">
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
    resolver: zodResolver(
      z
        .object({ password: passwordSchema(z), confirm: z.string().min(8) })
        .refine((d) => d.password === d.confirm, { message: 'Passwords must match', path: ['confirm'] }),
    ),
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
            applyApiFieldErrors(form.setError, err);
            toast.error(apiErrorMessage(err, 'Could not update password'));
          }
        })}
      >
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" className="mt-1" autoComplete="new-password" {...form.register('password')} />
          <p className="mt-1 text-xs text-muted">{PASSWORD_HINT}</p>
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
