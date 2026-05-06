"use client";

import { Sparkline } from "./Sparkline";
import { Stock } from "@/lib/data";

interface I18NDict {
  consensus: (c: string) => string;
  [key: string]: any;
}

const fmtPct = (n: number) => (n >= 0 ? `+${n.toFixed(2)}%` : `${n.toFixed(2)}%`);
const fmtPrice = (n: number) => `$${n.toFixed(2)}`;
const arrow = (dir: string) => (dir === "up" ? "▲" : dir === "down" ? "▼" : "–");

interface StockCardProps {
  stock: Stock;
  lang: "ko" | "en";
  t: I18NDict;
  onClick: (stock: Stock) => void;
}

export function StockCard({ stock, lang, t, onClick }: StockCardProps) {
  const summary = lang === "ko" ? stock.summary_ko : stock.summary_en;
  const rumorNote = lang === "ko" ? stock.rumor_note_ko : stock.rumor_note_en;
  return (
    <div
      className="stock-card"
      role="button"
      tabIndex={0}
      onClick={() => onClick(stock)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(stock)}
    >
      <div className="rank-badge">{String(stock.rank).padStart(2, "0")}</div>
      <div className="stock-main">
        <div className="stock-head">
          <span className="stock-ticker">{stock.ticker}</span>
          <span className="stock-name">{stock.name}</span>
          <span className="sector-badge">{stock.sector}</span>
          <span className="consensus-pill">{t.consensus(stock.consensus)}</span>
        </div>
        <p className="stock-summary">{summary}</p>
        <div className="stock-rumor">
          <span className={`rumor-tag ${stock.rumor}`}>{stock.rumor}</span>
          <span className="rumor-text">{rumorNote}</span>
        </div>
        <div className="models-row">
          {Object.entries(stock.models || {}).map(([k, v]) => (
            <span key={k} className={`model-chip ${v}`}>
              <span className="model-arrow">{arrow(v)}</span>
              {k}
            </span>
          ))}
        </div>
      </div>
      <div className="stock-side">
        <Sparkline data={stock.spark} tone={stock.sentiment} ticker={stock.ticker} />
        <div className="spark-meta">
          <span className="price">{fmtPrice(stock.price)}</span>
          <span className={`pct ${stock.changePct >= 0 ? "up" : "down"}`}>{fmtPct(stock.changePct)}</span>
        </div>
      </div>
      <div className="stock-score">
        <div className={`score-num ${stock.sentiment}`}>{stock.confidence}<span style={{fontSize:18, opacity:0.7}}>%</span></div>
        <div className="score-label">{t.confidence}</div>
        <div className={`sentiment-pill ${stock.sentiment}`}>
          {stock.sentiment === "bullish" ? "▲" : stock.sentiment === "bearish" ? "▼" : "—"}
          {t[stock.sentiment]}
        </div>
      </div>
    </div>
  );
}
