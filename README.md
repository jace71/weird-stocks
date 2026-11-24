# Weird Stocks

A tabloid-style archive of unusual public companies. Built with Astro and Tailwind, and deployed to AWS Amplify from `main`.

Production: https://www.weird-stocks.com

## Commands

| Command | Action |
| :------ | :----- |
| `npm install` | Installs dependencies |
| `npm run dev` | Starts the local dev server at `localhost:4321` |
| `npm run build` | Builds the production site to `./dist/` |
| `npm run preview` | Previews the production build locally |

## Environment variables

Copy `.env.example` to `.env` for local work. `.env` is gitignored and must not be committed.

### `MARKETSTACK_API_KEY`

Server-side key for end-of-day prices, fetched at build time. It has no `PUBLIC_` prefix, so it is not sent to the browser. If the key is missing, stock pages still build and simply omit the price.

### `PUBLIC_GA_MEASUREMENT_ID`

Optional Google Analytics 4 measurement ID, shaped like `G-XXXXXXXXXX`.

- When this variable is unset or blank at build time, the site does not render an analytics tag and does not load any Google script.
- Astro inlines `PUBLIC_` variables during `npm run build`. A value in `.env` only affects local builds. For production, add `PUBLIC_GA_MEASUREMENT_ID` to this app's environment variables in the Amplify console, then rebuild. No change to `amplify.yml` is required.
- A value that is not a `G-` measurement ID is ignored, and the build prints a warning.

## Search and feeds

`npm run build` writes:

- `sitemap-index.xml` and `sitemap-0.xml` (home, archive pages, and every stock profile)
- `robots.txt`, which allows crawling and points at the sitemap index
- `rss.xml`, a feed of stock profiles, newest first

Share images are generated in the same build: `/og.png` for the site, and `/og/stocks/<slug>.png` for each profile. Pages also include canonical URLs, Open Graph and Twitter card tags, and JSON-LD (`WebSite` and `Organization` on the home page, `Article` on each stock profile).

After a production deploy, submit `https://www.weird-stocks.com/sitemap-index.xml` in [Google Search Console](https://search.google.com/search-console).
