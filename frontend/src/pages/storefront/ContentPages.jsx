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
import { contentVars, interpolate, isSafeHref, sectionAnchor } from '@/lib/contentPages';
import { RichText } from '@/components/content/RichText';
import { LegalSection, LegalShell } from '@/components/content/LegalLayout';

const FACT_ICONS = [Shield, BadgeCheck, Truck, Package];

export function AboutPage() {
  const { settings } = useSettings();
  const vars = contentVars(settings);
  const page = settings.contentPages?.about || {};
  const contact = settings.contact || {};
  const facts = (page.facts || []).filter((f) => f.title || f.body);
  const links = (page.policiesLinks || []).filter((l) => l.label && l.href);

  return (
    <>
      <Seo
        title={interpolate(page.seoTitle || page.headline || 'About', vars)}
        description={interpolate(page.seoDescription || page.intro, vars)}
        canonical="/about"
      />
      <section className="border-b border-border bg-surface">
        <Container className="max-w-3xl py-16 lg:py-24">
          {page.kicker ? <p className="caption">{interpolate(page.kicker, vars)}</p> : null}
          <h1 className="mt-3 font-display text-h1">{interpolate(page.headline, vars)}</h1>
          <RichText text={page.intro} vars={vars} className="mt-6 space-y-3 text-muted" />
        </Container>
      </section>

      <Container className="grid gap-12 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
        <div className="lg:col-span-7">
          {page.bodyTitle ? <h2 className="font-display text-h2">{interpolate(page.bodyTitle, vars)}</h2> : null}
          <RichText text={page.body} vars={vars} className="mt-4 space-y-4 text-muted" />
          <div className="mt-8 flex flex-wrap gap-3">
            {page.shopLabel && page.shopHref ? (
              <PageButton href={page.shopHref} label={interpolate(page.shopLabel, vars)} />
            ) : null}
            {page.contactLabel && page.contactHref ? (
              <PageButton href={page.contactHref} label={interpolate(page.contactLabel, vars)} variant="outline" />
            ) : null}
          </div>
        </div>
        <aside className="border border-border bg-surface p-6 lg:col-span-5">
          <p className="caption">{interpolate(page.storeCardTitle || 'Store', vars)}</p>
          <dl className="mt-4 space-y-4 text-sm">
            {contact.address ? (
              <div>
                <dt className="text-muted">Location</dt>
                <dd className="mt-1 flex gap-2">
                  <WithTooltip label="Address">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                  </WithTooltip>
                  <span>{contact.address}</span>
                </dd>
              </div>
            ) : null}
            {contact.email ? (
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="mt-1">
                  <a className="text-accent hover:underline" href={`mailto:${contact.email}`}>
                    {contact.email}
                  </a>
                </dd>
              </div>
            ) : null}
            {contact.phone ? (
              <div>
                <dt className="text-muted">Phone</dt>
                <dd className="mt-1">
                  <a className="text-accent hover:underline" href={`tel:${contact.phone}`}>
                    {contact.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {page.paymentsText ? (
              <div>
                <dt className="text-muted">Payments</dt>
                <dd className="mt-1">{interpolate(page.paymentsText, vars)}</dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </Container>

      {facts.length ? (
        <section className="border-y border-border bg-surface py-16 lg:py-24">
          <Container>
            {page.factsTitle ? <h2 className="font-display text-h2">{interpolate(page.factsTitle, vars)}</h2> : null}
            <div className="mt-10 grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
              {facts.map((fact, i) => {
                const Icon = FACT_ICONS[i % FACT_ICONS.length];
                return (
                  <div key={`${fact.title}-${i}`} className={`py-6 sm:px-6 ${i ? 'lg:border-l lg:border-border' : ''}`}>
                    <WithTooltip label={fact.title}>
                      <Icon className="h-5 w-5" />
                    </WithTooltip>
                    <h3 className="mt-4 font-display text-base font-semibold">{interpolate(fact.title, vars)}</h3>
                    <p className="mt-2 text-sm text-muted">{interpolate(fact.body, vars)}</p>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      ) : null}

      <Container className="max-w-3xl py-16 lg:py-24">
        {page.policiesTitle ? <h2 className="font-display text-h2">{interpolate(page.policiesTitle, vars)}</h2> : null}
        <RichText text={page.policiesIntro} vars={vars} className="mt-4 space-y-3 text-muted" />
        {links.length ? (
          <ul className="mt-6 space-y-2 text-sm">
            {links.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <PageLink href={item.href} className="text-accent hover:underline">
                  {interpolate(item.label, vars)}
                </PageLink>
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </>
  );
}

export function ContactPage() {
  const { settings } = useSettings();
  const vars = contentVars(settings);
  const page = settings.contentPages?.contact || {};
  const form = useForm({ defaultValues: { name: '', email: '', message: '' } });
  return (
    <Container className="grid gap-12 py-16 lg:grid-cols-2">
      <Seo
        title={interpolate(page.seoTitle || page.headline || 'Contact', vars)}
        description={interpolate(page.seoDescription || page.intro, vars)}
        canonical="/contact"
      />
      <div>
        {page.kicker ? <p className="caption">{interpolate(page.kicker, vars)}</p> : null}
        <h1 className="font-display text-h1">{interpolate(page.headline || 'Contact', vars)}</h1>
        <RichText text={page.intro} vars={vars} className="mt-4 space-y-3 text-sm text-muted" />
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
  const { settings } = useSettings();
  const vars = contentVars(settings);
  const page = settings.contentPages?.faq || {};
  const items = (page.items || []).filter((item) => item.q);
  return (
    <Container className="max-w-2xl py-16">
      <Seo
        title={interpolate(page.seoTitle || page.title || 'FAQ', vars)}
        description={interpolate(page.seoDescription, vars)}
        canonical="/faq"
      />
      <h1 className="font-display text-h1">{interpolate(page.title || 'FAQ', vars)}</h1>
      <Accordion type="single" collapsible className="mt-8">
        {items.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger>{interpolate(item.q, vars)}</AccordionTrigger>
            <AccordionContent>
              <RichText text={item.a} vars={vars} className="space-y-3" />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Container>
  );
}

export function TermsPage() {
  return <LegalPage canonical="/terms" pageKey="terms" />;
}

export function PrivacyPage() {
  return <LegalPage canonical="/privacy" pageKey="privacy" />;
}

function LegalPage({ canonical, pageKey }) {
  const { settings } = useSettings();
  const vars = contentVars(settings);
  const page = settings.contentPages?.[pageKey] || {};
  const sections = (page.sections || []).filter((s) => s.title || s.body);
  const toc = sections.map((section, i) => ({
    id: sectionAnchor(section, i),
    label: interpolate(section.title, vars),
  }));

  return (
    <LegalShell
      kicker={interpolate(page.kicker, vars)}
      title={interpolate(page.title, vars)}
      description={page.description}
      vars={vars}
      updated={interpolate(page.updated, vars)}
      seoTitle={interpolate(page.seoTitle || page.title, vars)}
      seoDescription={interpolate(page.seoDescription || page.description, vars)}
      canonical={canonical}
      toc={toc}
    >
      {sections.map((section, i) => (
        <LegalSection key={sectionAnchor(section, i)} id={sectionAnchor(section, i)} title={interpolate(section.title, vars)}>
          <RichText text={section.body} vars={vars} className="space-y-3" />
        </LegalSection>
      ))}
    </LegalShell>
  );
}

function PageLink({ href, className, children }) {
  if (!isSafeHref(href)) return <span className={className}>{children}</span>;
  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} {...(href.startsWith('http') ? { rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  );
}

function PageButton({ href, label, variant }) {
  if (!isSafeHref(href)) return null;
  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <Button asChild variant={variant}>
        <Link to={href}>{label}</Link>
      </Button>
    );
  }
  return (
    <Button asChild variant={variant}>
      <a href={href} {...(href.startsWith('http') ? { rel: 'noopener noreferrer' } : {})}>
        {label}
      </a>
    </Button>
  );
}
