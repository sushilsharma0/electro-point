import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountApi, checkoutApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useSettings } from '@/hooks/useCatalog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CartSummary } from '@/components/cart/CartSummary';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { CheckoutPanel, CheckoutActions } from '@/components/checkout/CheckoutPanel';
import { Container } from '@/components/layout/Container';
import { Seo } from '@/components/Seo';
import { EmptyState } from '@/pages/errors/EmptyState';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { formatNpr } from '@/lib/money';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, CheckCircle2, Lock, ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import { CheckoutSkeleton } from '@/components/ui/skeleton';

const STEPS = ['Info', 'Address', 'Shipping', 'Summary', 'Payment', 'Done'];

const infoSchema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(7, 'Phone required'),
});

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  line1: z.string().min(3, 'Street address required'),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().default('Nepal'),
});

export function CheckoutPage() {
  const { user } = useAuth();
  const { cart, items, query: cartQuery } = useCart();
  const { settings } = useSettings();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [address, setAddress] = useState(null);
  const [shippingMethod, setShippingMethod] = useState(settings.shipping?.[0]?.code || 'standard');
  const [order, setOrder] = useState(null);
  const [paying, setPaying] = useState(false);
  const [placedMethod, setPlacedMethod] = useState(null);

  const quote = useQuery({
    queryKey: ['checkout-quote', shippingMethod],
    queryFn: () => checkoutApi.quote({ shippingMethod }),
  });

  if (cartQuery.isLoading) {
    return <CheckoutSkeleton />;
  }

  if (!items.length && !order) {
    return (
      <Container>
        <EmptyState title="Nothing to check out" body="Add a device first." actionTo="/shop" actionLabel="Shop" />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="max-w-lg py-8">
        <Seo title="Checkout" noindex />
        <CheckoutPanel
          kicker="Account required"
          title="Sign in to place an order"
          body="You can browse as a guest. Checkout needs an account so we can attach the order and payment."
        >
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/login?next=/checkout">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/register?next=/checkout">Create account</Link>
            </Button>
          </div>
        </CheckoutPanel>
      </Container>
    );
  }

  const shippingOptions = settings.shipping || [];
  const shippingLabel = shippingOptions.find((s) => s.code === shippingMethod)?.name || shippingMethod;
  const payments = settings.payments || {};

  const submitEsewa = async (orderId) => {
    setPaying(true);
    try {
      const data = await checkoutApi.initiateEsewa(orderId);
      const action = data.formUrl || data.formAction || data.action || data.paymentUrl;
      const fields = data.fields || data.formFields || data;
      if (!action) throw new Error('eSewa did not return a payment form URL');
      if (data.paymentUrl && !fields?.signature) {
        window.location.assign(data.paymentUrl);
        return;
      }
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = action;
      const skip = new Set(['formUrl', 'formAction', 'action', 'paymentUrl', 'fields', 'formFields', 'success', 'paymentId', 'orderId', 'orderNumber', 'amountPaisa']);
      Object.entries(fields).forEach(([k, v]) => {
        if (skip.has(k) || v == null || typeof v === 'object') return;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        input.value = String(v);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      toast.error(err.message || 'Could not start eSewa');
      setPaying(false);
    }
  };

  const submitKhalti = async (orderId) => {
    setPaying(true);
    try {
      const data = await checkoutApi.initiateKhalti(orderId);
      const url = data.paymentUrl || data.payment_url;
      if (!url) throw new Error('No Khalti payment URL');
      window.location.assign(url);
    } catch (err) {
      toast.error(err.message || 'Could not start Khalti');
      setPaying(false);
    }
  };

  const placeOrder = async (method) => {
    if (paying) return;
    setPaying(true);
    setPlacedMethod(method);
    try {
      let addressId = address?._id || address?.id;
      if (!addressId) {
        const saved = await accountApi.createAddress({
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 || '',
          city: address.city,
          state: address.state || '',
          postalCode: address.postalCode || '',
          country: address.country || 'Nepal',
          isDefault: true,
        });
        addressId = saved._id || saved.id;
        setAddress({ ...address, _id: addressId });
      }
      const created = await checkoutApi.createOrder({
        email: info.email,
        phone: info.phone,
        shippingMethod,
        paymentMethod: method,
        addressId,
      });
      const ord = created.order || created;
      setOrder(ord);
      setStep(5);
      const oid = ord._id || ord.id;
      if (method === 'cod') {
        await qc.invalidateQueries({ queryKey: ['cart'] });
        toast.success('Order placed. Pay cash on delivery.');
        setPaying(false);
        return;
      }
      if (method === 'esewa') await submitEsewa(oid);
      if (method === 'khalti') await submitKhalti(oid);
    } catch (err) {
      setPlacedMethod(null);
      toast.error(err.message || 'Could not create order');
      setPaying(false);
    }
  };

  const summary = <CartSummary cart={cart} quote={quote.data} quoteLoading={quote.isLoading} />;

  return (
    <Container>
      <Seo title="Checkout" noindex />
      <h1 className="sr-only">Checkout</h1>
      <details className="mb-6 lg:hidden">
        <summary className="cursor-pointer py-2 text-sm font-medium text-accent">Show order summary</summary>
        <div className="mt-3">{summary}</div>
      </details>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
      <div>
        <CheckoutStepper steps={STEPS} current={step} onSelect={order ? undefined : setStep} />

        <div className="mt-8">
          {step === 0 ? (
            <InfoStep
              defaultValues={info}
              onNext={(v) => {
                setInfo(v);
                setStep(1);
              }}
            />
          ) : null}
          {step === 1 ? (
            <AddressStep
              defaultValues={address}
              onBack={() => setStep(0)}
              onNext={(v) => {
                setAddress(v);
                setStep(2);
              }}
            />
          ) : null}
          {step === 2 ? (
            <CheckoutPanel kicker="Step 3 of 6" title="Shipping" body="Delivery windows are estimates for Kathmandu Valley. Outside the valley, the courier confirms a date after dispatch.">
              <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="space-y-3">
                {shippingOptions.map((s) => (
                  <label
                    key={s.code}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 border p-4 transition-colors duration-200',
                      shippingMethod === s.code ? 'border-foreground bg-muted-bg' : 'border-border hover:border-foreground/30',
                    )}
                  >
                    <RadioGroupItem value={s.code} id={s.code} className="mt-0.5" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-medium">{s.name}</span>
                        <span className="shrink-0 tabular text-sm">{s.pricePaisa ? formatNpr(s.pricePaisa) : 'Free'}</span>
                      </span>
                      <span className="mt-0.5 block text-sm text-muted">{s.eta}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
              <CheckoutActions>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  Continue
                </Button>
              </CheckoutActions>
            </CheckoutPanel>
          ) : null}
          {step === 3 ? (
            <CheckoutPanel kicker="Step 4 of 6" title="Confirm details" body="Prices in the summary are quoted by the server. The order total is calculated again when you place it.">
              <dl className="divide-y divide-border border-y border-border text-sm">
                <ReviewRow label="Contact" onEdit={() => setStep(0)}>
                  {info.name}
                  <span className="mt-0.5 block text-muted">
                    {info.email} · {info.phone}
                  </span>
                </ReviewRow>
                <ReviewRow label="Address" onEdit={() => setStep(1)}>
                  {address?.fullName}
                  <span className="mt-0.5 block text-muted">
                    {address?.line1}
                    {address?.line2 ? `, ${address.line2}` : ''}
                    {address?.city ? `, ${address.city}` : ''}
                    {address?.state ? `, ${address.state}` : ''}
                    {address?.postalCode ? ` ${address.postalCode}` : ''}
                  </span>
                </ReviewRow>
                <ReviewRow label="Shipping" onEdit={() => setStep(2)}>
                  {shippingLabel}
                </ReviewRow>
              </dl>
              <CheckoutActions>
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(4)}>
                  Continue to payment
                </Button>
              </CheckoutActions>
            </CheckoutPanel>
          ) : null}
          {step === 4 ? (
            <CheckoutPanel
              kicker="Step 5 of 6"
              title="Payment method"
              body="eSewa and Khalti redirect to their gateways. Cash on delivery is confirmed now and collected when your order arrives."
            >
              <div className="flex flex-col gap-3">
                {payments.esewaEnabled !== false ? (
                  <PaymentChoice
                    disabled={paying}
                    icon={Wallet}
                    title="eSewa"
                    hint="Official wallet. You will leave this page to pay."
                    onClick={() => placeOrder('esewa')}
                  />
                ) : null}
                {payments.khaltiEnabled !== false ? (
                  <PaymentChoice
                    disabled={paying}
                    icon={Smartphone}
                    title="Khalti"
                    hint="Official wallet. You will leave this page to pay."
                    onClick={() => placeOrder('khalti')}
                  />
                ) : null}
                {payments.codEnabled !== false ? (
                  <PaymentChoice
                    disabled={paying}
                    icon={Banknote}
                    title="Cash on delivery"
                    hint="Pay the courier in NPR when the order arrives."
                    onClick={() => placeOrder('cod')}
                  />
                ) : null}
              </div>
              <CheckoutActions>
                <Button type="button" variant="ghost" disabled={paying} onClick={() => setStep(3)}>
                  Back
                </Button>
              </CheckoutActions>
            </CheckoutPanel>
          ) : null}
          {step === 5 && placedMethod === 'cod' ? (
            <CheckoutPanel kicker="Complete">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted-bg text-success">
                <CheckCircle2 className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold">Order confirmed</h2>
              <p className="mt-2 max-w-md text-sm text-muted">
                {order?.orderNumber} is confirmed. Pay cash to the courier when your order arrives.
              </p>
              <CheckoutActions>
                <Button asChild>
                  <Link to={`/account/orders/${order?._id || order?.id}`}>View order</Link>
                </Button>
              </CheckoutActions>
            </CheckoutPanel>
          ) : null}
          {step === 5 && placedMethod !== 'cod' ? (
            <CheckoutPanel kicker="Payment pending" title="Redirecting to payment" body={`Order ${order?.orderNumber || order?._id} is created. Do not close this tab until the gateway loads.`}>
              {paying ? <p className="text-sm">Connecting to gateway…</p> : null}
            </CheckoutPanel>
          ) : null}
        </div>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
          <li className="inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Encrypted checkout
          </li>
          <li className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Official warranty on listed devices
          </li>
        </ul>
      </div>
      <div className="hidden lg:sticky lg:top-8 lg:block">{summary}</div>
      </div>
    </Container>
  );
}

function InfoStep({ defaultValues, onNext }) {
  const form = useForm({ resolver: zodResolver(infoSchema), defaultValues });
  return (
    <CheckoutPanel kicker="Step 1 of 6" title="Your information" body="We’ll use this for order updates and delivery calls.">
      <form onSubmit={form.handleSubmit(onNext)} className="max-w-md space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" className="mt-1.5 h-11" autoComplete="name" {...form.register('name')} />
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" className="mt-1.5 h-11" autoComplete="email" {...form.register('email')} />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" className="mt-1.5 h-11" autoComplete="tel" {...form.register('phone')} />
          <FieldError>{form.formState.errors.phone?.message}</FieldError>
        </div>
        <CheckoutActions>
          <Button type="submit">Continue</Button>
        </CheckoutActions>
      </form>
    </CheckoutPanel>
  );
}

function AddressStep({ defaultValues, onNext, onBack }) {
  const form = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: defaultValues || { country: 'Nepal', fullName: '', phone: '', line1: '', city: '', state: '', postalCode: '' },
  });
  return (
    <CheckoutPanel kicker="Step 2 of 6" title="Delivery address" body="Use a location the courier can reach by phone.">
      <form onSubmit={form.handleSubmit(onNext)} className="max-w-md space-y-4">
        <div>
          <Label htmlFor="fullName">Recipient</Label>
          <Input id="fullName" className="mt-1.5 h-11" autoComplete="name" {...form.register('fullName')} />
          <FieldError>{form.formState.errors.fullName?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="aphone">Phone</Label>
          <Input id="aphone" className="mt-1.5 h-11" autoComplete="tel" {...form.register('phone')} />
          <FieldError>{form.formState.errors.phone?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="line1">Address line 1</Label>
          <Input id="line1" className="mt-1.5 h-11" autoComplete="address-line1" {...form.register('line1')} />
          <FieldError>{form.formState.errors.line1?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="line2">Address line 2</Label>
          <Input id="line2" className="mt-1.5 h-11" autoComplete="address-line2" {...form.register('line2')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" className="mt-1.5 h-11" autoComplete="address-level2" {...form.register('city')} />
            <FieldError>{form.formState.errors.city?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="state">Province</Label>
            <Input id="state" className="mt-1.5 h-11" autoComplete="address-level1" {...form.register('state')} />
            <FieldError>{form.formState.errors.state?.message}</FieldError>
          </div>
        </div>
        <div>
          <Label htmlFor="postalCode">Postal code</Label>
          <Input id="postalCode" className="mt-1.5 h-11" autoComplete="postal-code" {...form.register('postalCode')} />
          <FieldError>{form.formState.errors.postalCode?.message}</FieldError>
        </div>
        <input type="hidden" {...form.register('country')} />
        <CheckoutActions>
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit">Continue</Button>
        </CheckoutActions>
      </form>
    </CheckoutPanel>
  );
}

function ReviewRow({ label, onEdit, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <dt className="caption">{label}</dt>
        <dd className="mt-1 font-medium">{children}</dd>
      </div>
      <button type="button" className="shrink-0 text-sm text-accent hover:underline" onClick={onEdit}>
        Edit
      </button>
    </div>
  );
}

function PaymentChoice({ icon: Icon, title, hint, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full cursor-pointer items-start gap-4 border border-border bg-surface p-4 text-left transition-colors duration-200 hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-muted-bg">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{hint}</span>
      </span>
    </button>
  );
}
