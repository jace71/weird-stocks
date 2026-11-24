import type { APIRoute } from 'astro';
import { renderDefaultOgImage } from '../lib/og-image.mjs';

export const GET: APIRoute = async () => {
  const png = await renderDefaultOgImage();
  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
};
