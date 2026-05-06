"use client";

import { useEffect, useMemo } from "react";
import { DetailChart } from "./Sparkline";
import { Stock, APP_DATA } from "@/lib/data";

const fmtPct = (n: number) => (n >= 0 ? `+${n.toFixed(2)}%` : `${n.toFixed(2)}%`);
const fmtPrice = (n: number) => `$${n.toFixed(2)}`;
const arrow = (dir: string) => (dir === "up" ? "▲" : dir === "down" ? "▼" : "–");

interface I18NDict {
  [key: string]: any;
}

interface DetailPanelProps {
  stock: Stock;
  lang: "ko" | "en";
  t: I18NDict;
  onClose: () => void;
}

export function DetailPanel({ stock, lang, t, onClose }: DetailPanelProps) {
  const summary = lang === "ko" ? stock.summary_ko : stock.summary_en;
  const rumorNote = lang === "ko" ? stock.rumor_note_ko : stock.rumor_note_en;
  const models = APP_DATA.models;
  const headlines = useMemo(() => {
    const seed = stock.ticker.charCodeAt(0);
    let rng = seed;
    const random = () => {
      rng = (rng * 9301 + 49297) % 233280;
      return rng / 233280;
    };
    return APP_DATA.headlines.filter((h) => h.ticker === stock.ticker || random() < 0.4).slice(0, 5);
  }, [stock.ticker]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onEsc); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-head">
          <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 500 }}>
            #{String(stock.rank).padStart(2, "0")} · {stock.sector}
          </div>
          <button className="detail-close" onClick={onClose} aria-label="close" autoFocus>
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="detail-body">
          <div className="detail-ticker-row">
            <span className="detail-ticker">{stock.ticker}</span>
            <span className="detail-name">{stock.name}</span>
          </div>
          <div className="detail-price-row">
            <span className="detail-price">{fmtPrice(stock.price)}</span>
            <span className={`detail-pct ${stock.changePct >= 0 ? "up" : "down"}`}>{fmtPct(stock.changePct)}</span>
            <span className={`sentiment-pill ${stock.sentiment}`} style={{ marginLeft: "auto" }}>
              {stock.sentiment === "bullish" ? "▲" : stock.sentiment === "bearish" ? "▼" : "—"}
              {t[stock.sentiment]} · {stock.confidence}%
            </span>
          </div>

          <div className="detail-block">
            <h3 className="detail-block-title">{t.detail_chart}</h3>
            <DetailChart data={stock.spark} tone={stock.sentiment} ticker={stock.ticker} />
          </div>

          <div className="detail-block">
            <h3 className="detail-block-title">{t.detail_summary}</h3>
            <p className="detail-summary">{summary}</p>
            <div className="detail-rumor">
              <span className={`rumor-tag ${stock.rumor}`} style={{ flexShrink: 0 }}>{stock.rumor}</span>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.detail_rumor}</div>
                {rumorNote}
              </div>
            </div>
          </div>

          <div className="detail-block">
            <h3 className="detail-block-title">{t.detail_models}</h3>
            <div className="detail-models">
              {models.map((m) => {
                const dir = (stock.models && stock.models[m.id as keyof typeof stock.models]) || "neutral";
                return (
                  <div key={m.id} className="model-tile">
                    <div className="model-tile-head">
                      <span className="model-tile-name">{m.name || m.id}</span>
                      <span className={`model-tile-arrow ${dir}`}>{arrow(dir)}</span>
                    </div>
                    <span className="model-tile-desc">{lang === "ko" ? m.desc_ko : m.desc_en}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="detail-block">
            <h3 className="detail-block-title">{t.detail_news}</h3>
            {headlines.length > 0 ? headlines.map((h, i) => (
              <div className="news-row" key={i}>
                <span className="ticker-mini">{h.ticker}</span>
                <span className="news-row-text">{lang === "ko" ? h.ko : h.en}</span>
                <span className="news-row-time">{h.time}</span>
              </div>
            )) : <div style={{ color: "var(--ink-3)", fontSize: 14 }}>—</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
