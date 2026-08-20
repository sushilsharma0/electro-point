import { Container } from '@/components/layout/Container';
import { Seo } from '@/components/Seo';
import { RichText } from '@/components/content/RichText';
import { interpolate } from '@/lib/contentPages';

export function LegalShell({ kicker, title, description, vars, updated, seoTitle, seoDescription, canonical, toc, children }) {
  const metaTitle = seoTitle || title;
  const metaDescription = seoDescription || interpolate(description, vars);
  return (
    <>
      <Seo title={metaTitle} description={metaDescription} canonical={canonical} />
      <Container className="py-16 lg:py-24">
        <LegalHeader kicker={kicker} title={title} updated={updated} description={description} vars={vars} />
        <LegalToc items={toc} />
        <div className="mt-12 max-w-3xl space-y-12">{children}</div>
      </Container>
    </>
  );
}

function LegalHeader({ kicker, title, updated, description, vars }) {
  return (
    <div className="max-w-3xl">
      <Caption text={kicker} />
      <h1 className="mt-3 font-display text-h1">{title}</h1>
      <UpdatedLine text={updated} />
      <RichText text={description} vars={vars} className="mt-6 space-y-3 text-muted" />
    </div>
  );
}

function Caption({ text }) {
  if (!text) return null;
  return <p className="caption">{text}</p>;
}

function UpdatedLine({ text }) {
  if (!text) return null;
  return <p className="mt-3 text-sm text-muted">Last updated {text}</p>;
}

function LegalToc({ items }) {
  if (!items || !items.length) return null;
  return (
    <nav className="mt-10 max-w-3xl border border-border bg-surface p-6">
      <p className="caption">Contents</p>
      <ol className="mt-4 columns-1 gap-x-8 text-sm sm:columns-2">
        {items.map((item) => (
          <TocItem key={item.id} item={item} />
        ))}
      </ol>
    </nav>
  );
}

function TocItem({ item }) {
  const href = '#' + item.id;
  return (
    <li className="mb-2 break-inside-avoid">
      <a href={href} className="hover:text-accent">
        {item.label}
      </a>
    </li>
  );
}

export function LegalSection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-display text-h3">{title}</h2>
      <div className="mt-4 text-muted">{children}</div>
    </section>
  );
}
