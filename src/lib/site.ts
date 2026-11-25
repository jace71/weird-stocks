import type { CollectionEntry } from 'astro:content';

export const siteName = 'Weird Stocks';
export const siteOrigin = 'https://www.weird-stocks.com';
export const defaultDescription =
  'A playful archive of the oddest, funniest, and most unexpectedly fascinating tickers.';
export const defaultOgImage = '/og.png';

const gaIdPattern = /^G-[A-Z0-9]+$/;
const defaultGoogleAnalyticsId = 'G-JNVPP818JB';
let warnedAboutGaId = false;

export function googleAnalyticsId(): string {
  const fromVite = import.meta.env.PUBLIC_GA_MEASUREMENT_ID;
  const fromProcess = typeof process !== 'undefined' ? process.env.PUBLIC_GA_MEASUREMENT_ID : undefined;
  const raw = firstNonEmpty(fromVite, fromProcess);
  if (!raw) return defaultGoogleAnalyticsId;
  if (!gaIdPattern.test(raw)) {
    if (!warnedAboutGaId) {
      warnedAboutGaId = true;
      console.warn(
        `PUBLIC_GA_MEASUREMENT_ID must look like G-XXXXXXXX. Received "${raw}". Using ${defaultGoogleAnalyticsId}.`,
      );
    }
    return defaultGoogleAnalyticsId;
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

export function teachersPageJsonLd(input: {
  description: string;
  lessons: { name: string; description: string; url: string }[];
}) {
  const pageUrl = `${siteOrigin}/teachers/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    name: 'Weird Stocks for the Classroom',
    description: input.description,
    url: pageUrl,
    isPartOf: { '@id': `${siteOrigin}/#website` },
    inLanguage: 'en-US',
    publisher: { '@id': `${siteOrigin}/#organization` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: input.lessons.length,
      itemListElement: input.lessons.map((lesson, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'LearningResource',
          name: lesson.name,
          description: lesson.description,
          url: lesson.url.startsWith('http') ? lesson.url : `${siteOrigin}${lesson.url}`,
          learningResourceType: 'Lesson plan',
          educationalLevel: 'Grades 9–12',
          isAccessibleForFree: true,
          inLanguage: 'en-US',
        },
      })),
    },
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
