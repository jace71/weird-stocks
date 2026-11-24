/**
 * Builds the 1200x630 social share images.
 *
 * Satori turns a small flexbox tree into SVG (text becomes paths), and
 * resvg rasterizes that SVG to PNG. Anton is the site's headline face,
 * licensed under the SIL Open Font License (see src/assets/fonts/OFL.txt).
 * This module is plain JavaScript so the site does not need React, which
 * Satori's TypeScript types import.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { createElement as h } from 'satori/jsx';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const INK = '#111111';
const RED = '#E10600';
const YELLOW = '#FFD400';
const NEWSPRINT = '#F6F1E3';
const PAPER = '#FFFFFF';

const PADDING = 26;
const SHADOW = 12;
const BORDER = 8;
const CARD_WIDTH = OG_WIDTH - PADDING * 2 - SHADOW;
const CARD_HEIGHT = OG_HEIGHT - PADDING * 2 - SHADOW;
const CONTENT_WIDTH = CARD_WIDTH - BORDER * 2 - 72;

const fontPromise = readFile(path.join(process.cwd(), 'src/assets/fonts/Anton-Regular.ttf'));

function div(style, ...children) {
  return h('div', { style: { display: 'flex', ...style } }, ...children.flat());
}

function headlineFontSize(headline) {
  const length = headline.trim().length;
  if (length > 80) return 52;
  if (length > 64) return 60;
  if (length > 46) return 70;
  return 80;
}

function masthead(rightLabel) {
  return div(
    {
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: RED,
      padding: '18px 32px',
      borderBottom: `8px solid ${YELLOW}`,
    },
    div(
      { alignItems: 'center' },
      div(
        {
          backgroundColor: YELLOW,
          color: INK,
          border: `4px solid ${INK}`,
          padding: '2px 10px 0',
          fontSize: 36,
          marginRight: 16,
        },
        'WS!',
      ),
      div(
        {
          color: PAPER,
          fontSize: 42,
          letterSpacing: 1,
        },
        'WEIRD STOCKS',
      ),
    ),
    div(
      {
        backgroundColor: YELLOW,
        color: INK,
        border: `3px solid ${INK}`,
        padding: '6px 12px 2px',
        fontSize: 22,
        letterSpacing: 0.5,
      },
      rightLabel,
    ),
  );
}

function footer(leftLabel) {
  return div(
    {
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTop: `4px solid ${INK}`,
      padding: '16px 32px 18px',
      fontSize: 24,
      lineHeight: 1,
      letterSpacing: 0.4,
    },
    div({ color: INK }, leftLabel),
    div({ color: RED }, 'WEIRD-STOCKS.COM'),
  );
}

function frame(rightLabel, body, leftFooter) {
  return div(
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      padding: PADDING,
      backgroundColor: NEWSPRINT,
      color: INK,
      fontFamily: 'Anton',
      fontWeight: 400,
    },
    div(
      {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        flexDirection: 'column',
        backgroundColor: NEWSPRINT,
        border: `${BORDER}px solid ${INK}`,
        boxShadow: `${SHADOW}px ${SHADOW}px 0 0 ${INK}`,
      },
      masthead(rightLabel),
      body,
      footer(leftFooter),
    ),
  );
}

function stockCard({ ticker, headline, company, category }) {
  return frame(
    category.toUpperCase(),
    div(
      {
        flexGrow: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '28px 36px 24px',
      },
      div(
        {
          alignSelf: 'flex-start',
          backgroundColor: YELLOW,
          color: INK,
          border: `4px solid ${INK}`,
          boxShadow: `6px 6px 0 0 ${INK}`,
          padding: '6px 16px 2px',
          fontSize: 40,
          letterSpacing: 1,
        },
        ticker.toUpperCase(),
      ),
      div(
        {
          width: CONTENT_WIDTH,
          marginTop: 22,
          fontSize: headlineFontSize(headline),
          lineHeight: 0.96,
          textTransform: 'uppercase',
          color: INK,
        },
        headline,
      ),
    ),
    company.toUpperCase(),
  );
}

function defaultCard() {
  return frame(
    'READ ALL ABOUT IT',
    div(
      {
        flexGrow: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '20px 36px 16px',
      },
      div(
        {
          fontSize: 120,
          lineHeight: 0.92,
          color: RED,
          letterSpacing: 1,
        },
        'WEIRD',
      ),
      div(
        {
          fontSize: 120,
          lineHeight: 0.92,
          color: INK,
          letterSpacing: 1,
        },
        'STOCKS!',
      ),
      div(
        {
          alignSelf: 'flex-start',
          marginTop: 26,
          backgroundColor: YELLOW,
          color: INK,
          border: `4px solid ${INK}`,
          boxShadow: `6px 6px 0 0 ${INK}`,
          padding: '8px 14px 4px',
          fontSize: 30,
          letterSpacing: 0.6,
        },
        'THE ODDEST TICKERS IN THE MARKET',
      ),
    ),
    'NOT INVESTMENT ADVICE',
  );
}

async function render(node) {
  const font = await fontPromise;
  const svg = await satori(node, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [
      {
        name: 'Anton',
        data: font,
        weight: 400,
        style: 'normal',
      },
    ],
  });

  return new Resvg(svg, {
    background: NEWSPRINT,
    font: { loadSystemFonts: false },
    shapeRendering: 2,
    textRendering: 1,
  })
    .render()
    .asPng();
}

export function renderDefaultOgImage() {
  return render(defaultCard());
}

export function renderStockOgImage(stock) {
  return render(stockCard(stock));
}
