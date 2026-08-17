import { Helmet } from 'react-helmet-async';

const SITE = typeof window !== 'undefined' ? window.location.origin : 'https://electropoint.np';

export function Seo({
  title,
  description,
  canonical,
  image,
  type = 'website',
  jsonLd,
  noindex = false,
}) {
  const fullTitle = title?.includes('ElectroPoint') ? title : title ? `${title} · ElectroPoint` : 'ElectroPoint';
  const url = canonical ? (canonical.startsWith('http') ? canonical : `${SITE}${canonical}`) : undefined;
  const graph = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description ? <meta name="description" content={description} /> : null}
      {noindex ? <meta name="robots" content="noindex,nofollow" /> : null}
      {url ? <link rel="canonical" href={url} /> : null}
      <meta property="og:site_name" content="ElectroPoint" />
      <meta property="og:title" content={fullTitle} />
      {description ? <meta property="og:description" content={description} /> : null}
      {url ? <meta property="og:url" content={url} /> : null}
      <meta property="og:type" content={type} />
      {image ? <meta property="og:image" content={image} /> : null}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      {graph.map((node, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(node)}
        </script>
      ))}
    </Helmet>
  );
}

export function orgJsonLd(settings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings?.storeName || 'ElectroPoint',
    url: SITE,
    email: settings?.contact?.email,
    telephone: settings?.contact?.phone,
    address: settings?.contact?.address
      ? { '@type': 'PostalAddress', streetAddress: settings.contact.address, addressCountry: 'NP' }
      : undefined,
  };
}

export function productJsonLd(product, url) {
  const price = product.salePricePaisa && product.salePricePaisa < product.pricePaisa
    ? product.salePricePaisa
    : product.pricePaisa;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    description: product.shortDescription || product.seoDescription || product.description,
    image: (product.images || []).map((i) => i.url || i).filter(Boolean),
    url,
    aggregateRating: product.ratingCount
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.ratingAvg,
          reviewCount: product.ratingCount,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NPR',
      price: (Number(price) / 100).toFixed(2),
      availability:
        (product.stock || 0) - (product.reservedStock || 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };
}

export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.href ? `${SITE}${item.href}` : undefined,
    })),
  };
}
