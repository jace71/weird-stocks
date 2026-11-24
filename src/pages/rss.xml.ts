import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { defaultDescription, siteName } from '../lib/site';

export async function GET(context: APIContext) {
  if (!context.site) {
    throw new Error('Set `site` in astro.config.mjs so the RSS feed can build absolute links.');
  }

  const stocks = (await getCollection('stocks')).sort((a, b) => {
    const dateDiff = b.data.publishDate.getTime() - a.data.publishDate.getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.data.ticker.localeCompare(b.data.ticker, 'en');
  });

  return rss({
    title: siteName,
    description: defaultDescription,
    site: context.site,
    trailingSlash: true,
    customData: '<language>en-us</language>',
    items: stocks.map((stock) => ({
      title: `${stock.data.ticker}: ${stock.data.headline}`,
      description: stock.data.summary,
      pubDate: stock.data.publishDate,
      categories: [stock.data.category],
      link: `/stocks/${stock.id}/`,
    })),
  });
}
