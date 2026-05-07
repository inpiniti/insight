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

  const T = lang === "ko" ? {
    close: "닫기",
    buy: "매수",
    sell: "매도",
    sellDisabled: "보유 종목이 아닙니다",
  } : {
    close: "Close",
    buy: "Buy",
    sell: "Sell",
    sellDisabled: "Not in holdings",
  };

  const close = () => tickerStore.close();
  const canSell = false; // TODO: 실제 보유 여부 확인

  return (
    <>
      <div className="detail-overlay" onClick={close}>
        <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
          <div className="detail-head">
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 500 }}>
              {ticker.sector || "—"}
            </div>
            <button className="detail-close" onClick={close} aria-label="close">
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="detail-body">
            <div className="detail-ticker-row">
              <span className="detail-ticker">{ticker.ticker}</span>
              <span className="detail-name">{ticker.name || ticker.ticker}</span>
            </div>
            <div className="detail-price-row">
              <span className="detail-price">${(ticker.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`detail-pct ${(ticker.changePct ?? 0) >= 0 ? "up" : "down"}`}>
                {(ticker.changePct ?? 0) >= 0 ? "+" : ""}{(ticker.changePct ?? 0).toFixed(2)}%
              </span>
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
          </div>
        </div>
      </div>

      {/* Trade modal */}
      {tradeMode && (
        <TradeModal
          mode={tradeMode}
          ticker={ticker}
          lang={lang}
          onClose={() => setTradeMode(null)}
          onSubmit={() => setTradeMode(null)}
        />
      )}
    </>
  );
}
