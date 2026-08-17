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
import { Progress } from '@/components/ui/progress';
import { CartSummary } from '@/components/cart/CartSummary';
import { Container } from '@/components/layout/Container';
import { Seo } from '@/components/Seo';
import { EmptyState } from '@/pages/errors/EmptyState';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote } from 'lucide-react';

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
  const { cart, items } = useCart();
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
        <h1 className="font-display text-h2">Sign in to place an order</h1>
        <p className="mt-2 text-sm text-muted">You can browse as a guest. Checkout requires an account so we can attach the order and payment.</p>
        <div className="mt-6 flex gap-3">
          <Button asChild>
            <Link to="/login?next=/checkout">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/register?next=/checkout">Create account</Link>
          </Button>
        </div>
      </Container>
    );
  }

  const shippingOptions = settings.shipping || [];

  const submitEsewa = async (orderId) => {
    setPaying(true);
    try {
      const data = await checkoutApi.initiateEsewa(orderId);
      const action = data.formAction || data.action || data.paymentUrl;
      const fields = data.fields || data.formFields || data;
      if (data.paymentUrl && !fields?.signature) {
        window.location.assign(data.paymentUrl);
        return;
      }
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = action;
      const skip = new Set(['formAction', 'action', 'paymentUrl', 'fields', 'formFields', 'success']);
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

  return (
    <Container className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <Seo title="Checkout" noindex />
      <div>
        <ol className="mb-8 flex gap-2 overflow-x-auto text-xs uppercase tracking-wide">
          {STEPS.map((s, i) => (
            <li key={s} className={cn('shrink-0 border-b-2 pb-2 pr-4', i === step ? 'border-accent text-foreground' : 'border-transparent text-muted')}>
              {i + 1}. {s}
            </li>
          ))}
        </ol>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mb-8" />

        {step === 0 ? <InfoStep defaultValues={info} onNext={(v) => { setInfo(v); setStep(1); }} /> : null}
        {step === 1 ? <AddressStep defaultValues={address} onBack={() => setStep(0)} onNext={(v) => { setAddress(v); setStep(2); }} /> : null}
        {step === 2 ? (
          <div>
            <h2 className="font-display text-lg font-semibold">Shipping</h2>
            <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="mt-4 space-y-3">
              {shippingOptions.map((s) => (
                <label key={s.code} className="flex cursor-pointer items-start gap-3 border border-border p-4">
                  <RadioGroupItem value={s.code} id={s.code} />
                  <span>
                    <span className="block font-medium">{s.name}</span>
                    <span className="text-sm text-muted">{s.eta}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
            <div className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button type="button" onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div>
            <h2 className="font-display text-lg font-semibold">Confirm details</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-muted">Contact</dt><dd>{info.name} · {info.email} · {info.phone}</dd></div>
              <div><dt className="text-muted">Address</dt><dd>{address?.line1}, {address?.city}</dd></div>
              <div><dt className="text-muted">Shipping</dt><dd>{shippingMethod}</dd></div>
            </dl>
            <p className="mt-4 text-sm text-muted">Prices below are quoted by the server. The order total is calculated again when you place it.</p>
            <div className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button type="button" onClick={() => setStep(4)}>Continue to payment</Button>
            </div>
          </div>
        ) : null}
        {step === 4 ? (
          <div>
            <h2 className="font-display text-lg font-semibold">Payment method</h2>
            <p className="mt-2 text-sm text-muted">
              eSewa and Khalti redirect to their gateways. Cash on delivery is confirmed now and collected when your order arrives.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {settings.payments?.esewaEnabled !== false ? (
                <Button type="button" size="lg" disabled={paying} onClick={() => placeOrder('esewa')}>
                  Pay with eSewa
                </Button>
              ) : null}
              {settings.payments?.khaltiEnabled !== false ? (
                <Button type="button" size="lg" variant="outline" disabled={paying} onClick={() => placeOrder('khalti')}>
                  Pay with Khalti
                </Button>
              ) : null}
              {settings.payments?.codEnabled !== false ? (
                <Button type="button" size="lg" variant="outline" disabled={paying} onClick={() => placeOrder('cod')}>
                  <Banknote aria-hidden="true" />
                  Cash on delivery
                </Button>
              ) : null}
            </div>
            <Button type="button" variant="ghost" className="mt-4" onClick={() => setStep(3)}>Back</Button>
          </div>
        ) : null}
        {step === 5 && placedMethod === 'cod' ? (
          <div>
            <h2 className="font-display text-lg font-semibold">Order confirmed</h2>
            <p className="mt-2 text-sm text-muted">
              {order?.orderNumber} is confirmed. Pay cash to the courier when your order arrives.
            </p>
            <Button asChild className="mt-6">
              <Link to={`/account/orders/${order?._id || order?.id}`}>View order</Link>
            </Button>
          </div>
        ) : null}
        {step === 5 && placedMethod !== 'cod' ? (
          <div>
            <h2 className="font-display text-lg font-semibold">Redirecting to payment</h2>
            <p className="mt-2 text-sm text-muted">
              Order {order?.orderNumber || order?._id} created as payment pending. Do not close this tab until the gateway loads.
            </p>
            {paying ? <p className="mt-4 text-sm">Connecting to gateway…</p> : null}
          </div>
        ) : null}
      </div>
      <div>
        <details className="mb-4 border border-border p-4 lg:hidden">
          <summary className="cursor-pointer font-medium">Order summary</summary>
          <div className="mt-4">
            <CartSummary cart={cart} quote={quote.data} />
          </div>
        </details>
        <div className="hidden lg:sticky lg:top-8 lg:block">
          <CartSummary cart={cart} quote={quote.data} />
        </div>
      </div>
    </Container>
  );
}

function InfoStep({ defaultValues, onNext }) {
  const form = useForm({ resolver: zodResolver(infoSchema), defaultValues });
  return (
    <form onSubmit={form.handleSubmit(onNext)} className="max-w-md space-y-4">
      <h2 className="font-display text-lg font-semibold">Your information</h2>
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" className="mt-1" {...form.register('name')} />
        <FieldError>{form.formState.errors.name?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" className="mt-1" {...form.register('email')} />
        <FieldError>{form.formState.errors.email?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" className="mt-1" {...form.register('phone')} />
        <FieldError>{form.formState.errors.phone?.message}</FieldError>
      </div>
      <Button type="submit">Continue</Button>
    </form>
  );
}

function AddressStep({ defaultValues, onNext, onBack }) {
  const form = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: defaultValues || { country: 'Nepal', fullName: '', phone: '', line1: '', city: '', state: '', postalCode: '' },
  });
  return (
    <form onSubmit={form.handleSubmit(onNext)} className="max-w-md space-y-4">
      <h2 className="font-display text-lg font-semibold">Delivery address</h2>
      <div>
        <Label htmlFor="fullName">Recipient</Label>
        <Input id="fullName" className="mt-1" {...form.register('fullName')} />
        <FieldError>{form.formState.errors.fullName?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="aphone">Phone</Label>
        <Input id="aphone" className="mt-1" {...form.register('phone')} />
        <FieldError>{form.formState.errors.phone?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="line1">Address line 1</Label>
        <Input id="line1" className="mt-1" {...form.register('line1')} />
        <FieldError>{form.formState.errors.line1?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="line2">Address line 2</Label>
        <Input id="line2" className="mt-1" {...form.register('line2')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" className="mt-1" {...form.register('city')} />
          <FieldError>{form.formState.errors.city?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="state">Province</Label>
          <Input id="state" className="mt-1" {...form.register('state')} />
          <FieldError>{form.formState.errors.state?.message}</FieldError>
        </div>
      </div>
      <div>
        <Label htmlFor="postalCode">Postal code</Label>
        <Input id="postalCode" className="mt-1" {...form.register('postalCode')} />
        <FieldError>{form.formState.errors.postalCode?.message}</FieldError>
      </div>
      <input type="hidden" {...form.register('country')} />
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
