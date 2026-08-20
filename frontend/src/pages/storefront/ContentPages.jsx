import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BadgeCheck, MapPin, Package, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Container } from '@/components/layout/Container';
import { Seo } from '@/components/Seo';
import { useSettings } from '@/hooks/useCatalog';
import { toast } from 'sonner';
import { WithTooltip } from '@/components/ui/tooltip';

const UPDATED = '20 August 2026';

export function AboutPage() {
  const { settings } = useSettings();
  const name = settings.storeName || 'ElectroPoint';
  const contact = settings.contact || {};
  const facts = [
    { icon: Shield, title: 'Official warranty', body: 'Every device is sold with manufacturer warranty. Serial numbers are recorded on paid orders.' },
    { icon: BadgeCheck, title: 'Authentic stock', body: 'Sourced through authorized channels. Specs on the product page come from the catalog, not slogans.' },
    { icon: Truck, title: 'Tracked delivery', body: 'Kathmandu express and nationwide standard. Rates and ETAs come from store settings.' },
    { icon: Package, title: 'Clear orders', body: 'Totals are calculated on the server. Tracking is written by staff when the parcel actually moves.' },
  ];

  return (
    <>
      <Seo
        title="About"
        description={`${name} is a professional electronics retailer in Nepal. Authentic devices, NPR pricing, eSewa, Khalti, and cash on delivery.`}
        canonical="/about"
      />
      <section className="border-b border-border bg-surface">
        <Container className="max-w-3xl py-16 lg:py-24">
          <p className="caption">About</p>
          <h1 className="mt-3 font-display text-h1">Built for people who read the spec sheet</h1>
          <p className="mt-6 text-muted">
            {name} is a professional electronics store in Nepal. We sell authentic consumer devices with official warranty,
            prices in NPR, and checkout through eSewa, Khalti, or cash on delivery.
          </p>
        </Container>
      </section>

      <Container className="grid gap-12 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
        <div className="lg:col-span-7">
          <h2 className="font-display text-h2">What we sell</h2>
          <p className="mt-4 text-muted">
            Smartphones, laptops, desktops, monitors, audio, cameras, and accessories — specified clearly so you can
            compare before you buy. Categories, product photography, and homepage merchandising are controlled by the
            store admin. We do not invent stock, reviews, or analytics. If a number appears in the dashboard, it comes
            from the database.
          </p>
          <p className="mt-4 text-muted">
            Browse without an account. Sign in to check out, save a wishlist, write a review, or track an order. Compare
            up to four devices side by side using catalog specs: processor, memory, panel, battery, warranty.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/shop">Shop devices</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact">Contact</Link>
            </Button>
          </div>
        </div>
        <aside className="border border-border bg-surface p-6 lg:col-span-5">
          <p className="caption">Store</p>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-muted">Location</dt>
              <dd className="mt-1 flex gap-2">
                <WithTooltip label="Address">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                </WithTooltip>
                <span>{contact.address || 'Kathmandu, Nepal'}</span>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="mt-1">
                <a className="text-accent hover:underline" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="mt-1">
                <a className="text-accent hover:underline" href={`tel:${contact.phone}`}>
                  {contact.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Payments</dt>
              <dd className="mt-1">eSewa · Khalti · Cash on delivery · Amounts in NPR</dd>
            </div>
          </dl>
        </aside>
      </Container>

      <section className="border-y border-border bg-surface py-16 lg:py-24">
        <Container>
          <h2 className="font-display text-h2">How we operate</h2>
          <div className="mt-10 grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className={`py-6 sm:px-6 ${i ? 'lg:border-l lg:border-border' : ''}`}>
                <WithTooltip label={title}>
                  <Icon className="h-5 w-5" />
                </WithTooltip>
                <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Container className="max-w-3xl py-16 lg:py-24">
        <h2 className="font-display text-h2">Policies</h2>
        <p className="mt-4 text-muted">
          Sales are governed by our terms. Personal data is described in the privacy notice. Both apply when you create
          an account or place an order.
        </p>
        <ul className="mt-6 space-y-2 text-sm">
          <li>
            <Link to="/terms" className="text-accent hover:underline">
              Terms of sale
            </Link>
          </li>
          <li>
            <Link to="/privacy" className="text-accent hover:underline">
              Privacy notice
            </Link>
          </li>
          <li>
            <Link to="/faq" className="text-accent hover:underline">
              FAQ
            </Link>
          </li>
        </ul>
      </Container>
    </>
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
    { q: 'How do I track an order?', a: 'Open Track order in the footer, or Account → Orders. Enter the order number and the email used at checkout. Status, courier, and tracking number are written by staff when the parcel moves — they are not simulated.' },
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
  const { settings } = useSettings();
  const name = settings.storeName || 'ElectroPoint';
  const contact = settings.contact || {};
  const toc = [
    ['agreement', 'Agreement'],
    ['catalog', 'Catalog and pricing'],
    ['orders', 'Orders'],
    ['payment', 'Payment'],
    ['delivery', 'Delivery and title'],
    ['warranty', 'Warranty and returns'],
    ['accounts', 'Accounts'],
    ['liability', 'Liability'],
    ['law', 'Governing law'],
    ['contact', 'Contact'],
  ];

  return (
    <LegalShell
      kicker="Legal"
      title="Terms of sale"
      description={`Terms that apply when you buy from ${name}: orders, NPR pricing, eSewa, Khalti, COD, warranty, and delivery.`}
      canonical="/terms"
      toc={toc}
    >
      <LegalSection id="agreement" title="1. Agreement">
        <p>
          These terms govern browsing, accounts, and purchases on the {name} website. By placing an order you offer to
          buy the listed goods at the total quoted by our server at checkout. We accept that offer when the order is
          confirmed (paid online after gateway verification, or confirmed for cash on delivery).
        </p>
        <p>
          Related rules are in the{' '}
          <Link to="/privacy" className="text-accent hover:underline">
            privacy notice
          </Link>
          . If you do not agree, do not create an account or complete checkout.
        </p>
      </LegalSection>

      <LegalSection id="catalog" title="2. Catalog and pricing">
        <p>
          Product names, specifications, images, and stock come from the live catalog. Prices are in Nepalese rupees
          (NPR). The payable amount is calculated on the server from catalog prices, sale prices, shipping, tax, and
          any coupon. The browser cannot set the total.
        </p>
        <p>
          We may correct obvious errors, withdraw an offer, or refuse an order if stock, price, or payment cannot be
          fulfilled. Coupons apply only to eligible items and may have minimums, dates, and usage limits.
        </p>
      </LegalSection>

      <LegalSection id="orders" title="3. Orders">
        <p>
          You must provide accurate contact and delivery details. We may cancel an order that cannot be verified, that
          appears fraudulent, or that we cannot ship. Unpaid online orders may expire after the payment window set by
          the store.
        </p>
        <p>
          You can follow status from Account → Orders or the public{' '}
          <Link to="/track" className="text-accent hover:underline">
            track order
          </Link>{' '}
          page using the order number and the email used at checkout. Courier name and tracking number appear when
          staff record a shipment — they are not simulated.
        </p>
      </LegalSection>

      <LegalSection id="payment" title="4. Payment">
        <p>We accept:</p>
        <ul>
          <li>eSewa, when enabled by the store</li>
          <li>Khalti, when enabled by the store</li>
          <li>Cash on delivery, when enabled by the store, collected when the order is delivered</li>
        </ul>
        <p>
          Card and wallet credentials are processed by eSewa or Khalti. {name} does not store payment card numbers.
          Online orders are marked paid only after the official gateway status API confirms the charge. COD orders are
          confirmed immediately and remain payable on delivery.
        </p>
      </LegalSection>

      <LegalSection id="delivery" title="5. Delivery and title">
        <p>
          Shipping methods, prices, and estimates are those published in store settings at checkout. Delivery times are
          estimates, not guarantees. Risk and title in the goods pass to you on delivery to the address on the order,
          unless we agree otherwise in writing.
        </p>
        <p>You must inspect the parcel on arrival and report transit damage promptly through support.</p>
      </LegalSection>

      <LegalSection id="warranty" title="6. Warranty and returns">
        <p>
          Manufacturer warranty applies as stated on the product and in the box. {name} records serial numbers on paid
          orders to support warranty claims. Warranty does not cover misuse, unauthorized repair, or consumable wear
          unless the manufacturer says otherwise.
        </p>
        <p>
          Dead-on-arrival and eligible returns are handled through support. Keep the original packaging, accessories,
          and proof of purchase. Refunds, if approved, follow the original payment method where the gateway allows.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="7. Accounts">
        <p>
          You are responsible for the email and password on your account. We may suspend an account that abuses the
          site, posts false reviews, or is used for fraud. Reviews should reflect a genuine purchase where the store
          requires verified buyers.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="8. Liability">
        <p>
          To the extent permitted by Nepal law, {name} is not liable for indirect or consequential loss, lost profits,
          or data loss arising from use of the site or delay in delivery. Nothing in these terms limits liability for
          fraud, personal injury caused by our negligence, or rights that cannot be excluded under consumer law.
        </p>
        <p>Our total liability for a given order is limited to the amount you paid for that order.</p>
      </LegalSection>

      <LegalSection id="law" title="9. Governing law">
        <p>
          These terms are governed by the laws of Nepal. Courts in Kathmandu have jurisdiction, without limiting any
          mandatory consumer protections that apply to you.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="10. Contact">
        <p>
          Questions about an order or these terms:{' '}
          <a className="text-accent hover:underline" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
          {contact.phone ? (
            <>
              {' '}
              ·{' '}
              <a className="text-accent hover:underline" href={`tel:${contact.phone}`}>
                {contact.phone}
              </a>
            </>
          ) : null}
        </p>
        {contact.address ? <p>{contact.address}</p> : null}
        <p>
          See also{' '}
          <Link to="/contact" className="text-accent hover:underline">
            Contact
          </Link>{' '}
          and{' '}
          <Link to="/faq" className="text-accent hover:underline">
            FAQ
          </Link>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}

export function PrivacyPage() {
  const { settings } = useSettings();
  const name = settings.storeName || 'ElectroPoint';
  const contact = settings.contact || {};
  const toc = [
    ['collect', 'What we collect'],
    ['use', 'How we use data'],
    ['cookies', 'Cookies and sessions'],
    ['payments', 'Payments'],
    ['share', 'Sharing'],
    ['keep', 'Retention'],
    ['rights', 'Your rights'],
    ['security', 'Security'],
    ['children', 'Children'],
    ['contact', 'Contact'],
  ];

  return (
    <LegalShell
      kicker="Legal"
      title="Privacy notice"
      description={`How ${name} collects and uses account, order, and technical data. We do not store payment cards.`}
      canonical="/privacy"
      toc={toc}
    >
      <LegalSection id="collect" title="1. What we collect">
        <p>Depending on how you use the site, we may process:</p>
        <ul>
          <li>Account details: name, email, phone, password hash</li>
          <li>Delivery addresses and order history</li>
          <li>Wishlist, compare selections stored in your browser, and recently viewed products</li>
          <li>Reviews you submit, including rating and text</li>
          <li>Support messages you send through the contact form</li>
          <li>Technical logs needed to run the site (for example IP address on a request, session identifiers)</li>
        </ul>
        <p>We do not require an account to browse the catalog.</p>
      </LegalSection>

      <LegalSection id="use" title="2. How we use data">
        <p>We use personal data to:</p>
        <ul>
          <li>Create and secure your account</li>
          <li>Quote checkout totals, place orders, and record payments</li>
          <li>Ship goods and show order status and tracking written by staff</li>
          <li>Handle warranty, DOA, and support</li>
          <li>Show your wishlist, reviews, and order list when you are signed in</li>
          <li>Prevent fraud and keep the store running</li>
        </ul>
        <p>We do not sell your personal data. We do not build advertising profiles from your orders.</p>
      </LegalSection>

      <LegalSection id="cookies" title="3. Cookies and sessions">
        <p>
          Authentication uses HTTP-only cookies so scripts in the page cannot read the session token. We also use a CSRF
          cookie on state-changing requests. You can block cookies in the browser; checkout and account pages will not
          work without a session cookie.
        </p>
        <p>Recently viewed products and compare lists may be stored in local browser storage on your device.</p>
      </LegalSection>

      <LegalSection id="payments" title="4. Payments">
        <p>
          eSewa and Khalti process online payments. {name} does not store card numbers, wallet PINs, or gateway secrets
          in the storefront. We store order identifiers and payment status returned by those services so we can mark an
          order paid only after official confirmation.
        </p>
        <p>Cash on delivery does not send card data. Amount due is the server-quoted total shown at checkout.</p>
      </LegalSection>

      <LegalSection id="share" title="5. Sharing">
        <p>We share data only as needed to run the store:</p>
        <ul>
          <li>Payment gateways (eSewa, Khalti) to complete a charge you start</li>
          <li>Couriers, when we hand over a parcel and record a tracking number</li>
          <li>Authorities, if required by Nepal law</li>
        </ul>
        <p>Staff with admin access can see orders and customer records required to fulfill and support those orders.</p>
      </LegalSection>

      <LegalSection id="keep" title="6. Retention">
        <p>
          We keep account and order records for as long as needed to fulfill purchases, warranty, accounting, and legal
          duties. You may ask us to close an account; we may retain invoices and order rows that we must keep by law.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="7. Your rights">
        <p>
          You may request access to the personal data we hold about you, correction of inaccurate details, or deletion
          where we are not required to keep it. Sign in to update profile and addresses, or email us. We may need to
          verify that the request comes from the account holder.
        </p>
      </LegalSection>

      <LegalSection id="security" title="8. Security">
        <p>
          Passwords are stored as hashes, not plain text. Admin and customer sessions are separated. Payment secrets
          stay in server environment variables, not in the public settings form. No method of transmission over the
          internet is perfectly secure; we work to reduce risk, not to claim zero risk.
        </p>
      </LegalSection>

      <LegalSection id="children" title="9. Children">
        <p>
          The store is intended for adults who can enter a purchase contract. We do not knowingly collect personal data
          from children. If you believe we have, contact us and we will delete it where the law allows.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="10. Contact">
        <p>
          Privacy questions:{' '}
          <a className="text-accent hover:underline" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
          {contact.phone ? (
            <>
              {' '}
              ·{' '}
              <a className="text-accent hover:underline" href={`tel:${contact.phone}`}>
                {contact.phone}
              </a>
            </>
          ) : null}
        </p>
        {contact.address ? <p>{contact.address}</p> : null}
        <p>
          See{' '}
          <Link to="/terms" className="text-accent hover:underline">
            Terms of sale
          </Link>{' '}
          for how orders work, and{' '}
          <Link to="/contact" className="text-accent hover:underline">
            Contact
          </Link>{' '}
          for general support.
        </p>
      </LegalSection>
    </LegalShell>
  );
}

function LegalShell({ kicker, title, description, canonical, toc, children }) {
  return (
    <>
      <Seo title={title} description={description} canonical={canonical} />
      <Container className="py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="caption">{kicker}</p>
          <h1 className="mt-3 font-display text-h1">{title}</h1>
          <p className="mt-3 text-sm text-muted">Last updated {UPDATED}</p>
          <p className="mt-6 text-muted">{description}</p>
        </div>
        {toc?.length ? (
          <nav aria-label="Page contents" className="mt-10 max-w-3xl border border-border bg-surface p-6">
            <p className="caption">Contents</p>
            <ol className="mt-4 columns-1 gap-x-8 text-sm sm:columns-2">
              {toc.map(([id, label]) => (
                <li key={id} className="mb-2 break-inside-avoid">
                  <a href={`#${id}`} className="hover:text-accent">
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <div className="mt-12 max-w-3xl space-y-12">{children}</div>
      </Container>
    </>
  );
}

function LegalSection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-display text-h3">{title}</h2>
      <div className="mt-4 space-y-3 text-muted [&_a]:underline-offset-2 [&_li]:mt-1 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
