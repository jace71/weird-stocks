// @ts-check
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const stockDir = fileURLToPath(new URL('./src/content/stocks', import.meta.url));

/** @type {Promise<Map<string, string>>} */
const stockPublishDates = (async () => {
  /** @type {Map<string, string>} */
  const dates = new Map();
  const files = await readdir(stockDir);

  await Promise.all(
    files.filter((file) => file.endsWith('.md')).map(async (file) => {
      const raw = await readFile(path.join(stockDir, file), 'utf8');
      const match = raw.match(/^publishDate:\s*["']?(\d{4}-\d{2}-\d{2})/m);
      if (!match) return;
      dates.set(file.slice(0, -'.md'.length).toLowerCase(), match[1]);
    }),
  );

  return dates;
})();

/**
 * @param {string} page
 */
function includeInSitemap(page) {
  const pathname = new URL(page).pathname.replace(/\/$/, '') || '/';
  if (pathname === '/rss.xml' || pathname === '/robots.txt' || pathname === '/og.png' || pathname === '/404') return false;
  if (pathname.startsWith('/og/')) return false;
  return true;
}

// https://astro.build/config
export default defineConfig({
  site: 'https://www.weird-stocks.com',
  integrations: [
    sitemap({
      filter: includeInSitemap,
      namespaces: {
        news: false,
        xhtml: false,
        image: false,
        video: false,
      },
      async serialize(item) {
        const dates = await stockPublishDates;
        const pathname = new URL(item.url).pathname.replace(/\/$/, '') || '/';
        const slug = pathname.startsWith('/stocks/') ? pathname.slice('/stocks/'.length) : '';
        const published = slug && !slug.includes('/') ? dates.get(slug) : undefined;
        if (published) item.lastmod = published;
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['@resvg/resvg-js', 'satori', 'satori/jsx'],
    },
  },
});
