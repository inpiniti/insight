"use client";

import { useState, useEffect } from "react";
import tickerStore, { TickerPayload, TickerState } from "@/lib/ticker-store";
import TradeModal from "./TradeModal";

function useTicker() {
  const [state, setState] = useState<TickerState>({ ticker: null });
  useEffect(() => {
    return tickerStore.subscribe(setState);
  }, []);
  return state.ticker;
}

// Helpers
const fmtUsd = (v: number) => "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct2 = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

// Find holdings from localStorage
function findHolding(ticker: string) {
  try {
    const activeId = JSON.parse(localStorage.getItem("bunseok_active_account_v1") || "null");
    if (!activeId) return null;
    const cache = JSON.parse(localStorage.getItem("bunseok_balance_cache_v1") || "{}");
    const bal = cache[activeId];
    if (!bal) return null;
    return bal.holdings?.find((h: any) => h.ticker === ticker) || null;
  } catch {
    return null;
  }
}

// Assemble ticker info from all sources
function lookupTicker(t: TickerPayload) {
  const appData = (window as any).APP_DATA?.stocks || [];
  const portfolioData = (window as any).PORTFOLIO_DATA || [];

  const newsHit = appData.find((s: any) => s.ticker === t.ticker);
  const pfHit = portfolioData.find((p: any) => p.stock === t.ticker);

  return {
    ticker: t.ticker,
    name: t.name || newsHit?.name || pfHit?.name || t.ticker,
    sector: t.sector || newsHit?.sector || pfHit?.sector || "—",
    price: t.price ?? newsHit?.price ?? pfHit?.close ?? 0,
    changePct: t.changePct ?? newsHit?.changePct ?? 0,
    spark: newsHit?.spark || null,
    news: newsHit ? newsHit : null,
    portfolio: pfHit || null,
    holding: findHolding(t.ticker),
    source: t.source,
  };
}

export default function GlobalTickerPanel({ lang }: { lang: "ko" | "en" }) {
  const ticker = useTicker();
  const [tradeMode, setTradeMode] = useState<"buy" | "sell" | null>(null);

  useEffect(() => {
    if (!ticker) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (tradeMode) setTradeMode(null);
        else tickerStore.close();
      }
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [ticker, tradeMode]);

  if (!ticker) return null;

  const info = lookupTicker(ticker);
  const canSell = !!info.holding;

  const T = lang === "ko" ? {
    sector: "섹터",
    confidence: "AI 신뢰도",
    holding: "보유",
    avgCost: "평균단가",
    qty: "수량",
    eval: "평가",
    pnl: "평가손익",
    buy: "매수",
    sell: "매도",
    sellDisabled: "보유 종목이 아닙니다",
    sentimentLabel: "AI 종합 의견",
    rumorLabel: "커뮤니티 소문",
    chartLabel: "30일 추이",
    investors: "투자자 정보",
    pcLabel: "투자자 수",
    srLabel: "투자 비율 합",
    dcfLabel: "DCF 저평가율",
    bullish: "낙관",
    bearish: "비관",
    neutral: "중립",
  } : {
    sector: "Sector",
    confidence: "AI confidence",
    holding: "Holding",
    avgCost: "Avg cost",
    qty: "Qty",
    eval: "Eval",
    pnl: "P&L",
    buy: "Buy",
    sell: "Sell",
    sellDisabled: "Not in holdings",
    sentimentLabel: "AI synthesis",
    rumorLabel: "Community signal",
    chartLabel: "30-day trend",
    investors: "Investor data",
    pcLabel: "Investors",
    srLabel: "Σ ratio",
    dcfLabel: "DCF discount",
    bullish: "Bullish",
    bearish: "Bearish",
    neutral: "Neutral",
  };

  const close = () => tickerStore.close();

  return (
    <>
      <div className="detail-overlay" onClick={close}>
        <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
          <div className="detail-head">
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 500 }}>
              {info.sector}
            </div>
            <button className="detail-close" onClick={close} aria-label="close">
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="detail-body">
            <div className="detail-ticker-row">
              <span className="detail-ticker">{info.ticker}</span>
              <span className="detail-name">{info.name}</span>
            </div>
            <div className="detail-price-row">
              <span className="detail-price">{fmtUsd(info.price)}</span>
              <span className={`detail-pct ${info.changePct >= 0 ? "up" : "down"}`}>
                {fmtPct2(info.changePct)}
              </span>
              {info.news && (
                <span
                  className={`sentiment-pill ${info.news.sentiment}`}
                  style={{ marginLeft: "auto" }}
                >
                  {info.news.sentiment === "bullish"
                    ? "▲"
                    : info.news.sentiment === "bearish"
                      ? "▼"
                      : "—"}
                  {T[info.news.sentiment as keyof typeof T]} · {info.news.confidence}%
                </span>
              )}
            </div>

            {/* Trade buttons */}
            <div className="trade-actions">
              <button
                className="trade-btn buy"
                onClick={() => setTradeMode("buy")}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 13 V3 M3 8 L8 3 L13 8" />
                </svg>
                {T.buy}
              </button>
              <button
                className="trade-btn sell"
                onClick={() => canSell && setTradeMode("sell")}
                disabled={!canSell}
                title={canSell ? "" : T.sellDisabled}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3 V13 M3 8 L8 13 L13 8" />
                </svg>
                {T.sell}
              </button>
            </div>

            {/* Holding summary if any */}
            {info.holding && (
              <div className="detail-block holding-block">
                <div className="holding-grid">
                  <div>
                    <div className="hg-label">{T.qty}</div>
                    <div className="hg-value num">{info.holding.qty}</div>
                  </div>
                  <div>
                    <div className="hg-label">{T.avgCost}</div>
                    <div className="hg-value num">{fmtUsd(info.holding.avg)}</div>
                  </div>
                  <div>
                    <div className="hg-label">{T.eval}</div>
                    <div className="hg-value num">{fmtUsd(info.holding.qty * info.holding.cur)}</div>
                  </div>
                  <div>
                    <div className="hg-label">{T.pnl}</div>
                    <div
                      className={`hg-value num ${info.holding.cur >= info.holding.avg ? "up" : "down"}`}
                    >
                      {fmtPct2(
                        ((info.holding.cur - info.holding.avg) / info.holding.avg) * 100
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chart - note: DetailChart component not implemented in design */}
            {info.spark && (
              <div className="detail-block">
                <h3 className="detail-block-title">{T.chartLabel}</h3>
                {/* Chart would be rendered here - placeholder for now */}
              </div>
            )}

            {/* News block */}
            {info.news && (
              <div className="detail-block">
                <h3 className="detail-block-title">{T.sentimentLabel}</h3>
                <p className="detail-summary">
                  {lang === "ko" ? info.news.summary_ko : info.news.summary_en}
                </p>
                {info.news.rumor && (
                  <div className="detail-rumor">
                    <span className={`rumor-tag ${info.news.rumor}`} style={{ flexShrink: 0 }}>
                      {info.news.rumor}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--ink-3)",
                          marginBottom: 4,
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        {T.rumorLabel}
                      </div>
                      {lang === "ko"
                        ? info.news.rumor_note_ko
                        : info.news.rumor_note_en}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Portfolio block */}
            {info.portfolio && (
              <div className="detail-block">
                <h3 className="detail-block-title">{T.investors}</h3>
                <div className="holding-grid">
                  <div>
                    <div className="hg-label">{T.pcLabel}</div>
                    <div className="hg-value num">
                      {info.portfolio.person_count}
                      <span style={{ fontSize: 13, color: "var(--ink-3)", marginLeft: 4 }}>
                        {lang === "ko" ? "명" : ""}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="hg-label">{T.srLabel}</div>
                    <div className="hg-value num">{info.portfolio.sum_ratio.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="hg-label">{T.dcfLabel}</div>
                    <div
                      className="hg-value num"
                      style={{
                        color:
                          info.portfolio.dcf_vs_market_cap_pct >= 100
                            ? "var(--up)"
                            : "var(--ink-2)",
                      }}
                    >
                      {info.portfolio.dcf_vs_market_cap_pct.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trade modal */}
      {tradeMode && (
        <TradeModal
          mode={tradeMode}
          info={{
            ...info,
            exchange: ticker?.exchange || "NASD",
          }}
          lang={lang}
          onClose={() => setTradeMode(null)}
          onSubmit={() => setTradeMode(null)}
        />
      )}
    </>
  );
}
