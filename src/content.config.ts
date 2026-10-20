import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const stocks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stocks' }),
  schema: z.object({
    ticker: z.string(),
    company: z.string(),
    headline: z.string(),
    kicker: z.string(),
    summary: z.string(),
    category: z.string(),
    weirdFactor: z.number().int().min(1).max(10),
    marketCap: z.string(),
    exchange: z.string(),
    publishDate: z.coerce.date(),
    featured: z.boolean(),
  }),
});

export const collections = { stocks };
