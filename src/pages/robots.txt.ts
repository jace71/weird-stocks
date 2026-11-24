import type { APIRoute } from 'astro';

const robotsTxt = (sitemapUrl: URL) => `\
User-agent: *
Allow: /

Sitemap: ${sitemapUrl.href}
`;

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error('Set `site` in astro.config.mjs so robots.txt can point at the sitemap.');
  }

  return new Response(robotsTxt(new URL('/sitemap-index.xml', site)), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
