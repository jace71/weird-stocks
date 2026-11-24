import type { CollectionEntry } from 'astro:content';

export const siteName = 'Weird Stocks';
export const siteOrigin = 'https://www.weird-stocks.com';
export const defaultDescription =
  'A playful archive of the oddest, funniest, and most unexpectedly fascinating tickers.';
export const defaultOgImage = '/og.png';

const gaIdPattern = /^G-[A-Z0-9]+$/;
let warnedAboutGaId = false;

export function googleAnalyticsId(): string | undefined {
  const fromVite = import.meta.env.PUBLIC_GA_MEASUREMENT_ID;
  const fromProcess = typeof process !== 'undefined' ? process.env.PUBLIC_GA_MEASUREMENT_ID : undefined;
  const raw = firstNonEmpty(fromVite, fromProcess);
  if (!raw) return undefined;
  if (!gaIdPattern.test(raw)) {
    if (!warnedAboutGaId) {
      warnedAboutGaId = true;
      console.warn(
        `PUBLIC_GA_MEASUREMENT_ID must look like G-XXXXXXXX. Received "${raw}". The analytics tag was left out of this build.`,
      );
    }
    return undefined;
  }
  return raw;
}

function firstNonEmpty(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

export function absoluteUrl(path: string, site?: URL): string {
  return new URL(path, site ?? siteOrigin).href;
}

export function canonicalUrl(pathname: string, site?: URL): string {
  const url = new URL(pathname, site ?? siteOrigin);
  const leaf = url.pathname.split('/').pop() ?? '';
  if (url.pathname !== '/' && !leaf.includes('.') && !url.pathname.endsWith('/')) {
    url.pathname = `${url.pathname}/`;
  }
  url.search = '';
  url.hash = '';
  return url.href;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function jsonLdScript(data: unknown): string {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

export function websiteJsonLd() {
  const home = `${siteOrigin}/`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteOrigin}/#website`,
        name: siteName,
        url: home,
        description: defaultDescription,
        inLanguage: 'en-US',
        publisher: { '@id': `${siteOrigin}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${siteOrigin}/#organization`,
        name: siteName,
        url: home,
        logo: {
          '@type': 'ImageObject',
          url: `${siteOrigin}/favicon.jpg`,
        },
      },
    ],
  };
}

export function articleJsonLd(stock: CollectionEntry<'stocks'>) {
  const pageUrl = `${siteOrigin}/stocks/${stock.id}/`;
  const imageUrl = `${siteOrigin}/og/stocks/${stock.id}.png`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: stock.data.headline,
    description: stock.data.summary,
    datePublished: isoDate(stock.data.publishDate),
    inLanguage: 'en-US',
    articleSection: stock.data.category,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    image: [imageUrl],
    author: {
      '@type': 'Organization',
      name: siteName,
      url: `${siteOrigin}/`,
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: `${siteOrigin}/`,
      logo: {
        '@type': 'ImageObject',
        url: `${siteOrigin}/favicon.jpg`,
      },
    },
    about: {
      '@type': 'Corporation',
      name: stock.data.company,
      tickerSymbol: stock.data.ticker,
    },
  };
}
