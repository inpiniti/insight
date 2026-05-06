export interface PortfolioStock {
  stock: string;
  name: string;
  logo: string;
  sector: string;
  person_count: number;
  sum_ratio: number;
  avg_ratio: number;
  dcf_vs_market_cap_pct: number;
  close: number;
  rsi: number;
}

export const PORTFOLIO_DATA: PortfolioStock[] = [
  { stock: "MSFT", name: "Microsoft", logo: "MS", sector: "Information Tech", person_count: 35, sum_ratio: 209.63, avg_ratio: 5.99, dcf_vs_market_cap_pct: 495.95, close: 411.38, rsi: 52.6 },
  { stock: "GOOGL", name: "Alphabet", logo: "GO", sector: "Communication", person_count: 32, sum_ratio: 142.11, avg_ratio: 4.44, dcf_vs_market_cap_pct: 284.53, close: 388.43, rsi: 81.3 },
  { stock: "META", name: "Meta Platforms", logo: "ME", sector: "Communication", person_count: 28, sum_ratio: 118.42, avg_ratio: 4.23, dcf_vs_market_cap_pct: 144.21, close: 612.40, rsi: 58.2 },
  { stock: "AAPL", name: "Apple", logo: "AP", sector: "Information Tech", person_count: 41, sum_ratio: 132.85, avg_ratio: 3.24, dcf_vs_market_cap_pct: 88.34, close: 192.55, rsi: 47.1 },
  { stock: "NVDA", name: "NVIDIA", logo: "NV", sector: "Information Tech", person_count: 24, sum_ratio: 88.91, avg_ratio: 3.70, dcf_vs_market_cap_pct: 62.18, close: 1187.42, rsi: 64.5 },
  { stock: "BRK-B", name: "Berkshire Hathaway", logo: "BR", sector: "Financials", person_count: 38, sum_ratio: 178.34, avg_ratio: 4.69, dcf_vs_market_cap_pct: 142.7, close: 412.18, rsi: 53.2 },
  { stock: "AMZN", name: "Amazon", logo: "AM", sector: "Consumer Disc.", person_count: 30, sum_ratio: 124.55, avg_ratio: 4.15, dcf_vs_market_cap_pct: 173.88, close: 188.42, rsi: 56.9 },
  { stock: "JPM", name: "JPMorgan Chase", logo: "JP", sector: "Financials", person_count: 22, sum_ratio: 78.21, avg_ratio: 3.55, dcf_vs_market_cap_pct: 165.32, close: 198.41, rsi: 49.8 },
  { stock: "V", name: "Visa", logo: "VS", sector: "Financials", person_count: 25, sum_ratio: 92.18, avg_ratio: 3.69, dcf_vs_market_cap_pct: 132.4, close: 285.12, rsi: 51.4 },
  { stock: "MA", name: "Mastercard", logo: "MA", sector: "Financials", person_count: 23, sum_ratio: 85.34, avg_ratio: 3.71, dcf_vs_market_cap_pct: 119.7, close: 478.65, rsi: 54.2 },
  { stock: "UNH", name: "UnitedHealth", logo: "UH", sector: "Health Care", person_count: 18, sum_ratio: 65.42, avg_ratio: 3.63, dcf_vs_market_cap_pct: 187.4, close: 502.18, rsi: 38.4 },
  { stock: "JNJ", name: "Johnson & Johnson", logo: "JN", sector: "Health Care", person_count: 26, sum_ratio: 87.91, avg_ratio: 3.38, dcf_vs_market_cap_pct: 152.6, close: 158.42, rsi: 46.8 },
  { stock: "WMT", name: "Walmart", logo: "WM", sector: "Consumer Staples", person_count: 19, sum_ratio: 58.12, avg_ratio: 3.06, dcf_vs_market_cap_pct: 71.3, close: 92.18, rsi: 62.4 },
  { stock: "XOM", name: "ExxonMobil", logo: "XO", sector: "Energy", person_count: 17, sum_ratio: 52.18, avg_ratio: 3.07, dcf_vs_market_cap_pct: 94.2, close: 118.42, rsi: 51.8 },
  { stock: "PG", name: "Procter & Gamble", logo: "PG", sector: "Consumer Staples", person_count: 20, sum_ratio: 61.32, avg_ratio: 3.07, dcf_vs_market_cap_pct: 78.5, close: 162.18, rsi: 48.2 },
];

export default PORTFOLIO_DATA;
