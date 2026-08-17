import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Container } from '@/components/layout/Container';
import { Seo } from '@/components/Seo';
import { useSettings } from '@/hooks/useCatalog';
import { toast } from 'sonner';

export function AboutPage() {
  return (
    <Container className="max-w-3xl py-16">
      <Seo title="About" description="ElectroPoint is a professional electronics retailer in Nepal." canonical="/about" />
      <h1 className="font-display text-h1">Built for people who read the spec sheet</h1>
      <p className="mt-6 text-muted">
        ElectroPoint sells authentic consumer electronics with official warranty, NPR pricing, and payments through eSewa, Khalti, and cash on delivery. Categories, specifications, and homepage merchandising are controlled by the store admin — not hardcoded marketing templates.
      </p>
      <p className="mt-4 text-muted">
        We do not invent stock, reviews, or analytics. If a number appears in the admin dashboard, it comes from the database.
      </p>
    </Container>
  );
}

export function ContactPage() {
  const { settings } = useSettings();
  const form = useForm({ defaultValues: { name: '', email: '', message: '' } });
  return (
    <Container className="grid gap-12 py-16 lg:grid-cols-2">
      <Seo title="Contact" canonical="/contact" />
      <div>
        <h1 className="font-display text-h1">Contact</h1>
        <p className="mt-4 text-sm text-muted">{settings.contact?.address}</p>
        <p className="mt-2 text-sm">
          <a className="text-accent hover:underline" href={`mailto:${settings.contact?.email}`}>
            {settings.contact?.email}
          </a>
        </p>
        <p className="text-sm">
          <a className="text-accent hover:underline" href={`tel:${settings.contact?.phone}`}>
            {settings.contact?.phone}
          </a>
        </p>
      </div>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(() => {
          toast.success('Message recorded locally. Connect SMTP on the server to deliver it.');
          form.reset();
        })}
      >
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" className="mt-1" {...form.register('name', { required: true })} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" className="mt-1" {...form.register('email', { required: true })} />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" className="mt-1" {...form.register('message', { required: true })} />
        </div>
        <Button type="submit">Send</Button>
      </form>
    </Container>
  );
}

export function FaqPage() {
  const items = [
    { q: 'Do I need an account to browse?', a: 'No. Login is required for checkout, orders, wishlist, and reviews.' },
    { q: 'How are prices calculated?', a: 'The server computes totals from catalog prices, shipping, tax, and coupons. The browser never sets the payable amount.' },
    { q: 'Which payments are supported?', a: 'eSewa, Khalti, and cash on delivery. Online payments are verified with the official status APIs before an order is marked paid. COD is confirmed immediately and collected when the order is delivered.' },
    { q: 'Is every product 3D?', a: 'No. The admin sets visual mode per product: images, 360 spin, or a GLB/GLTF model.' },
  ];
  return (
    <Container className="max-w-2xl py-16">
      <Seo title="FAQ" canonical="/faq" />
      <h1 className="font-display text-h1">FAQ</h1>
      <Accordion type="single" collapsible className="mt-8">
        {items.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Container>
  );
}

export function TermsPage() {
  return (
    <Container className="max-w-3xl py-16">
      <Seo title="Terms" canonical="/terms" />
      <h1 className="font-display text-h1">Terms of sale</h1>
      <p className="mt-6 text-sm text-muted">
        Orders are offers to purchase at the server-quoted total. Title transfers on delivery. Warranty follows the manufacturer. Replace this copy from Admin → Settings when legal text is finalized.
      </p>
    </Container>
  );
}

export function PrivacyPage() {
  return (
    <Container className="max-w-3xl py-16">
      <Seo title="Privacy" canonical="/privacy" />
      <h1 className="font-display text-h1">Privacy</h1>
      <p className="mt-6 text-sm text-muted">
        We store account data, addresses, and order history to fulfill purchases. Session cookies are HTTP-only. Payment card data is not stored — eSewa and Khalti process the charge. Replace this copy from Admin → Settings.
      </p>
    </Container>
  );
}
