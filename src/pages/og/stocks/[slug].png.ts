import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderStockOgImage, type StockOgImageInput } from '../../../lib/og-image.mjs';

export async function getStaticPaths() {
  const stocks = await getCollection('stocks');

  return stocks.map((stock) => ({
    params: { slug: stock.id },
    props: {
      ticker: stock.data.ticker,
      company: stock.data.company,
      headline: stock.data.headline,
      category: stock.data.category,
    } satisfies StockOgImageInput,
  }));
}

export const GET: APIRoute<StockOgImageInput, { slug: string }> = async ({ props }) => {
  const png = await renderStockOgImage(props);
  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
};
