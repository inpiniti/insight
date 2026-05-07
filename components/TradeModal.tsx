"use client";

import { useState } from "react";
import { TickerPayload } from "@/lib/ticker-store";

interface TradeModalProps {
  mode: "buy" | "sell";
  ticker: TickerPayload;
  lang: "ko" | "en";
  onClose: () => void;
  onSubmit: () => void;
}

export default function TradeModal({ mode, ticker, lang, onClose, onSubmit }: TradeModalProps) {
  const [priceMode, setPriceMode] = useState("market");
  const [price, setPrice] = useState(ticker.price || 0);
  const [qty, setQty] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const refOpen = +(((ticker.price || 0) * 0.992).toFixed(2));
  const refHigh = +(((ticker.price || 0) * 1.013).toFixed(2));
  const refLow = +(((ticker.price || 0) * 0.978).toFixed(2));

  const T = lang === "ko" ? {
    buyTitle: "매수 주문",
    sellTitle: "매도 주문",
    market: "시장",
    ticker: "종목",
    priceLabel: "주문 가격",
    p_market: "현재가",
    p_open: "시가",
    p_high: "고가",
    p_low: "저가",
    p_manual: "직접입력",
    qtyLabel: "수량",
    totalLabel: "주문 총액",
    cancel: "취소",
    confirmBuy: "매수 주문",
    confirmSell: "매도 주문",
    notice: "이 화면은 데모입니다. 실제 주문은 발생하지 않습니다.",
    success: "주문이 접수되었습니다",
    close: "닫기",
  } : {
    buyTitle: "Buy order",
    sellTitle: "Sell order",
    market: "Market",
    ticker: "Ticker",
    priceLabel: "Order price",
    p_market: "Current",
    p_open: "Open",
    p_high: "High",
    p_low: "Low",
    p_manual: "Manual",
    qtyLabel: "Qty",
    totalLabel: "Order total",
    cancel: "Cancel",
    confirmBuy: "Buy",
    confirmSell: "Sell",
    notice: "Demo only. No real order is placed.",
    success: "Order accepted",
    close: "Close",
  };

  const setPriceFor = (pm: string) => {
    setPriceMode(pm);
    if (pm === "market") setPrice(ticker.price || 0);
    else if (pm === "open") setPrice(refOpen);
    else if (pm === "high") setPrice(refHigh);
    else if (pm === "low") setPrice(refLow);
  };

  const total = price * qty;

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onSubmit();
    }, 2000);
  };

  return (
    <div className="trade-overlay" onClick={onClose}>
      <div className="trade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trade-modal-head">
          <span className={`trade-mode-pill trade-${mode}-pill`}>
            {mode === "buy" ? "🔴" : "🔵"} {mode === "buy" ? T.buyTitle : T.sellTitle}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>
            ✕
          </button>
        </div>

        {!submitted ? (
          <div className="trade-modal-body">
            {/* Ticker target */}
            <div className="trade-target">
              <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase" }}>
                {T.ticker}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{ticker.ticker}</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{ticker.name || ticker.ticker}</div>
            </div>

            {/* Price selection */}
            <div className="trade-field">
              <label className="trade-field-label">{T.priceLabel}</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {(["market", "open", "high", "low"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPriceFor(mode)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: priceMode === mode ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: priceMode === mode ? "var(--accent)" : "var(--bg-soft)",
                      color: priceMode === mode ? "white" : "var(--ink-2)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "all 0.15s",
                    }}
                  >
                    {T[`p_${mode}` as keyof typeof T]}
                  </button>
                ))}
                <button
                  onClick={() => setPriceMode("manual")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: priceMode === "manual" ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: priceMode === "manual" ? "var(--accent)" : "var(--bg-soft)",
                    color: priceMode === "manual" ? "white" : "var(--ink-2)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    transition: "all 0.15s",
                  }}
                >
                  {T.p_manual}
                </button>
              </div>

              {priceMode === "manual" ? (
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "var(--bg-elev)",
                    color: "var(--ink)",
                    fontSize: 14,
                  }}
                />
              ) : (
                <div className="trade-field-value">
                  ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="trade-field">
              <label className="trade-field-label">{T.qtyLabel}</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{
                    width: 40,
                    height: 40,
                    border: "1px solid var(--border)",
                    background: "var(--bg-soft)",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "var(--bg-elev)",
                    color: "var(--ink)",
                    fontSize: 14,
                    textAlign: "center",
                  }}
                />
                <button
                  onClick={() => setQty(qty + 1)}
                  style={{
                    width: 40,
                    height: 40,
                    border: "1px solid var(--border)",
                    background: "var(--bg-soft)",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Order total */}
            <div
              style={{
                padding: "12px 14px",
                background: "var(--bg-soft)",
                borderRadius: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{T.totalLabel}</span>
              <span style={{ fontSize: 18, fontWeight: 700 }}>
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Notice */}
            <div style={{ fontSize: 12, color: "var(--ink-3)", padding: 12, textAlign: "center" }}>
              {T.notice}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-soft)",
                  color: "var(--ink)",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {T.cancel}
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: mode === "buy" ? "var(--up)" : "var(--down)",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {mode === "buy" ? T.confirmBuy : T.confirmSell}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{T.success}</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
              {mode === "buy" ? T.confirmBuy : T.confirmSell} · {ticker.ticker} · {qty} @ $
              {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
