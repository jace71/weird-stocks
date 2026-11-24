export const OG_WIDTH: number;
export const OG_HEIGHT: number;

export interface StockOgImageInput {
  ticker: string;
  company: string;
  headline: string;
  category: string;
}

export function renderDefaultOgImage(): Promise<Uint8Array>;
export function renderStockOgImage(stock: StockOgImageInput): Promise<Uint8Array>;
