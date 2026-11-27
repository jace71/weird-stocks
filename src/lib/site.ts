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

export type BreadcrumbCrumb = {
  name: string;
  path: string;
};

function crumbName(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function pageNameFromTitle(title: string | undefined): string | undefined {
  const name = crumbName(title);
  if (!name) return undefined;
  const suffix = ` | ${siteName}`;
  return crumbName(name.endsWith(suffix) ? name.slice(0, -suffix.length) : name);
}

/**
 * Breadcrumb trail for archive pages, or undefined when the page should not
 * emit a BreadcrumbList (home, 404, and paths outside the archive).
 * Paths may omit the trailing slash. `currentName` is the current page's
 * label when the route does not imply it, such as a stock's company name.
 */
export function breadcrumbsForPath(
  pathname: string,
  options?: { currentName?: string; pageTitle?: string },
): BreadcrumbCrumb[] | undefined {
  const path = new URL(canonicalUrl(pathname)).pathname;
  if (path === '/' || path === '/404/' || path === '/404.html') return undefined;

  const home: BreadcrumbCrumb = { name: 'Home', path: '/' };
  const currentName = crumbName(options?.currentName);
  const pageName = pageNameFromTitle(options?.pageTitle);

  if (path === '/stocks/') return [home, { name: 'Stocks', path }];
  if (path === '/categories/') return [home, { name: 'Categories', path }];
  if (path === '/about/') return [home, { name: 'About', path }];

  if (path === '/teachers/') {
    const name = currentName ?? pageName;
    if (!name) throw new Error('The teachers page needs a title for its breadcrumb.');
    return [home, { name, path }];
  }

  const stock = /^\/stocks\/([^/]+)\/$/.exec(path);
  if (stock) {
    if (!currentName) {
      throw new Error(`Stock page ${path} needs breadcrumbName set to the company name.`);
    }
    return [home, { name: 'Stocks', path: '/stocks/' }, { name: currentName, path }];
  }

  const category = /^\/categories\/([^/]+)\/$/.exec(path);
  if (category) {
    const name = currentName ?? pageName;
    if (!name) throw new Error(`Category page ${path} needs a breadcrumb name.`);
    return [home, { name: 'Categories', path: '/categories/' }, { name, path }];
  }

  return undefined;
}

export function breadcrumbListJsonLd(crumbs: readonly BreadcrumbCrumb[]) {
  if (crumbs.length < 2) {
    throw new Error('BreadcrumbList needs a home crumb and the current page.');
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: canonicalUrl(crumb.path),
    })),
  };
}
