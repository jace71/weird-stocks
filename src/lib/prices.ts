/**
 * src/lib/prices.ts
 * -----------------------------------------------------------------------------
 * Fetches recent end-of-day (EOD) prices from Marketstack AT BUILD TIME.
 *
 * - Runs only during `npm run build` / `npm run dev` (server side). The API key
 *   is never sent to visitors' browsers.
 * - Each ticker is fetched at most ONCE per build (in-memory cache), so 30 stock
 *   pages = 30 API calls per build, no matter how often a page asks.
 * - Requests are spaced out and retried on HTTP 429 (rate limit).
 * - It NEVER throws. If anything goes wrong (no key, network down, bad ticker,
 *   quota used up), it returns `null` and the page simply renders without a price.
 *
 * Docs: https://marketstack.com/documentation_v2  (endpoint: GET /v2/eod)
 * Response shape used here: { pagination: {...}, data: [{ symbol, exchange,
 *   date, open, high, low, close, volume, adj_close, ... }] }
 */

export interface PricePoint {
  date: string; // "YYYY-MM-DD"
  close: number;
}

export interface PriceData {
  symbol: string;
  exchange: string | null; // MIC reported by the API, e.g. "XNAS"
  lastClose: number;
  prevClose: number | null;
  change: number | null; // lastClose - prevClose
  changePct: number | null; // percent, e.g. -2.15
  asOf: string; // date of lastClose, "YYYY-MM-DD"
  history: PricePoint[]; // oldest -> newest, for the sparkline
  source: { name: string; url: string };
}

// ---- Settings you might want to tweak --------------------------------------
const API_BASE = "https://api.marketstack.com/v2/eod";
const HISTORY_DAYS = 90; // calendar days of history for the sparkline (~60 trading days)
const MIN_GAP_MS = 300; // wait at least this long between API calls
const MAX_RETRIES = 2; // extra attempts after a 429 / 5xx / network error
const TIMEOUT_MS = 10_000; // give up on a single request after 10 s

// Our frontmatter `exchange` -> the MIC code Marketstack uses.
// Only used to double-check that we got the right company (see LUNR note below).
const EXCHANGE_TO_MIC: Record<string, string> = {
  NASDAQ: "XNAS",
  NYSE: "XNYS",
  "NYSE AMERICAN": "XASE",
  AMEX: "XASE",
};

// ---- Reading the API key ---------------------------------------------------
function getApiKey(): string | undefined {
  // Amplify (and your terminal) expose env vars on process.env during the build.
  // Locally, Astro/Vite also loads a `.env` file into import.meta.env.
  const fromProcess =
    typeof process !== "undefined" ? process.env?.MARKETSTACK_API_KEY : undefined;
  let fromVite: string | undefined;
  try {
    fromVite = (import.meta as any).env?.MARKETSTACK_API_KEY;
  } catch {
    fromVite = undefined;
  }
  const key = (fromProcess || fromVite || "").trim();
  return key.length > 0 ? key : undefined;
}

// ---- Small helpers ---------------------------------------------------------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let lastCallAt = 0;
let quotaExhausted = false; // once we hit the monthly limit, stop calling for this build
let warnedNoKey = false;

async function throttle() {
  const wait = lastCallAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function log(msg: string) {
  // Shows up in the Amplify build log — handy for debugging.
  console.warn(`[prices] ${msg}`);
}

// ---- Turning the raw API response into PriceData (exported for tests) -------
export function parseEodResponse(
  json: any,
  ticker: string,
  expectedExchange?: string,
): PriceData | null {
  const rows: any[] = Array.isArray(json?.data) ? json.data : [];
  const points: PricePoint[] = rows
    .filter((r) => r && typeof r.close === "number" && typeof r.date === "string")
    .map((r) => ({ date: String(r.date).slice(0, 10), close: Number(r.close) }))
    // API may return newest-first; sort oldest -> newest and drop duplicate dates.
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((p, i, arr) => i === 0 || p.date !== arr[i - 1].date);

  if (points.length === 0) return null;

  // Sanity check: are we looking at the right listing? (e.g. "LUNR" also
  // exists as a different company in Canada). We only warn, never fail.
  const reportedExchange: string | null = rows[0]?.exchange ?? null;
  const expectedMic = expectedExchange
    ? EXCHANGE_TO_MIC[expectedExchange.toUpperCase()]
    : undefined;
  if (expectedMic && reportedExchange && reportedExchange !== expectedMic) {
    log(
      `${ticker}: expected exchange ${expectedMic} but API returned ${reportedExchange}. ` +
        `Check that this is the right company.`,
    );
  }

  const last = points[points.length - 1];
  const prev = points.length > 1 ? points[points.length - 2] : null;
  const change = prev ? last.close - prev.close : null;
  const changePct = prev && prev.close !== 0 ? (change! / prev.close) * 100 : null;

  return {
    symbol: ticker,
    exchange: reportedExchange,
    lastClose: last.close,
    prevClose: prev ? prev.close : null,
    change,
    changePct,
    asOf: last.date,
    history: points,
    source: { name: "Marketstack", url: "https://marketstack.com" },
  };
}

// ---- One real API call (with retries) --------------------------------------
async function fetchFromMarketstack(
  ticker: string,
  exchange: string | undefined,
  apiKey: string,
): Promise<PriceData | null> {
  const to = new Date();
  const from = new Date(to.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    access_key: apiKey,
    symbols: ticker,
    date_from: isoDate(from),
    date_to: isoDate(to),
    sort: "DESC",
    limit: "100",
  });
  const url = `${API_BASE}?${params.toString()}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (quotaExhausted) return null;
    await throttle();

    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (err) {
      log(`${ticker}: network error/timeout (attempt ${attempt + 1}): ${String(err)}`);
      if (attempt < MAX_RETRIES) await sleep(1000 * 2 ** attempt);
      continue;
    }

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    const errCode: string | undefined = json?.error?.code;

    if (res.ok && !json?.error) {
      const parsed = parseEodResponse(json, ticker, exchange);
      if (!parsed) log(`${ticker}: no price rows returned (unknown ticker or no coverage?)`);
      return parsed;
    }

    // Monthly quota used up -> don't waste time on the other tickers.
    if (errCode === "usage_limit_reached") {
      quotaExhausted = true;
      log(`monthly API quota reached; skipping prices for the rest of this build`);
      return null;
    }

    // Per-second/minute rate limit or temporary server trouble -> back off and retry.
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : 1500 * 2 ** attempt;
      log(`${ticker}: HTTP ${res.status} ${errCode ?? ""}, retrying in ${waitMs} ms`);
      await sleep(waitMs);
      continue;
    }

    // Anything else (bad key, plan doesn't allow it, bad symbol): give up quietly.
    log(`${ticker}: HTTP ${res.status} ${errCode ?? ""} ${json?.error?.message ?? ""}`.trim());
    return null;
  }

  log(`${ticker}: giving up after ${MAX_RETRIES + 1} attempts`);
  return null;
}

// ---- The function your pages call ------------------------------------------
const cache = new Map<string, Promise<PriceData | null>>();

/**
 * getPrice("LUNR", "NASDAQ") -> PriceData or null.
 * Safe to call from any .astro file; never throws.
 */
export function getPrice(ticker: string, exchange?: string): Promise<PriceData | null> {
  const symbol = (ticker || "").trim().toUpperCase();
  if (!symbol) return Promise.resolve(null);

  const apiKey = getApiKey();
  if (!apiKey) {
    if (!warnedNoKey) {
      log("MARKETSTACK_API_KEY is not set, so prices are skipped (the site still builds).");
      warnedNoKey = true;
    }
    return Promise.resolve(null);
  }

  // Cache the *promise*, so even simultaneous calls share one request.
  if (!cache.has(symbol)) {
    cache.set(
      symbol,
      fetchFromMarketstack(symbol, exchange, apiKey).catch((err) => {
        log(`${symbol}: unexpected error ${String(err)}`);
        return null;
      }),
    );
  }
  return cache.get(symbol)!;
}

// ---- Sparkline math (exported so the component and tests can use it) --------
/**
 * Turns a list of closing prices into an SVG path "M x,y L x,y ...".
 * width/height are in SVG units; `pad` keeps the line off the edges.
 */
export function sparklinePath(
  values: number[],
  width = 240,
  height = 60,
  pad = 3,
): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // flat line if all equal
  const stepX = (width - pad * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (height - pad * 2) * (1 - (v - min) / range);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
