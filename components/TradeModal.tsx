"use client";

import { useState, useEffect } from "react";

interface TickerInfo {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  exchange?: string;
}

interface TradeModalProps {
  mode: "buy" | "sell";
  info: TickerInfo;
  lang: "ko" | "en";
  onClose: () => void;
  onSubmit: () => void;
}

const fmtUsd = (v: number) =>
  "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct2 = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

export default function TradeModal({ mode, info, lang, onClose, onSubmit }: TradeModalProps) {
  const [priceMode, setPriceMode] = useState("market");
  const [price, setPrice] = useState(info.price);
  const [qty, setQty] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [priceDetail, setPriceDetail] = useState<any>(null);
  const [exchange, setExchange] = useState(info.exchange || "NASD");

  // 모달 열릴 때 현재가 상세 정보 조회
  useEffect(() => {
    const fetchPriceDetail = async () => {
      try {
        setLoading(true);
        const ex = info.exchange || "NASD";

        // localStorage에서 계좌 정보 조회
        const accountId = localStorage.getItem("bunseok_active_account_v1");
        if (!accountId) {
          console.error("계좌가 선택되지 않았습니다");
          setLoading(false);
          return;
        }

        const accountStr = localStorage.getItem("bunseok_accounts_v1");
        const accountData = accountStr ? JSON.parse(accountStr) : {};
        const account = accountData[accountId];
        if (!account?.token || !account?.appkey) {
          console.error("토큰 또는 appkey가 없습니다");
          return;
        }

        const params = new URLSearchParams({
          symbol: info.ticker,
          exchange: ex,
          appkey: account.appkey,
          appsecret: account.appsecret,
          token: account.token,
        });

        const response = await fetch(`/api/account/price-detail?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setPriceDetail(data);
          if (data.prices) {
            setPrice(data.prices.current);
            setExchange(ex);
          }
        } else {
          console.error("Price detail 조회 실패");
        }
      } catch (err) {
        console.error("Price detail 조회 중 오류:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceDetail();
  }, [info.ticker, info.exchange]);

  const refOpen = priceDetail?.prices?.open || +(info.price * 0.992).toFixed(2);
  const refHigh = priceDetail?.prices?.high || +(info.price * 1.013).toFixed(2);
  const refLow = priceDetail?.prices?.low || +(info.price * 0.978).toFixed(2);

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
    maxQty: (n: number) => `보유 ${n}주`,
    totalLabel: "주문 총액",
    cancel: "취소",
    confirmBuy: "매수 주문",
    confirmSell: "매도 주문",
    notice: "이 화면은 데모입니다. 실제 주문은 발생하지 않습니다.",
    success: "주문이 접수되었습니다",
    successSub: (m: string, t: string, q: number, p: number) =>
      `${m} · ${t} · ${q}주 @ ${fmtUsd(p)}`,
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
    maxQty: (n: number) => `holding ${n}`,
    totalLabel: "Order total",
    cancel: "Cancel",
    confirmBuy: "Buy",
    confirmSell: "Sell",
    notice: "Demo only. No real order is placed.",
    success: "Order accepted",
    successSub: (m: string, t: string, q: number, p: number) =>
      `${m} · ${t} · ${q} @ ${fmtUsd(p)}`,
    close: "Close",
  };

  const setPriceFor = (pm: string) => {
    setPriceMode(pm);
    if (pm === "market") setPrice(info.price);
    else if (pm === "open") setPrice(refOpen);
    else if (pm === "high") setPrice(refHigh);
    else if (pm === "low") setPrice(refLow);
  };

  const total = price * qty;
  const maxQty = null; // holding?.qty would go here

  const handleSubmit = async () => {
    try {
      setOrdering(true);

      // localStorage에서 계좌 정보 조회
      const accountId = localStorage.getItem("bunseok_active_account_v1");
      if (!accountId) {
        alert(lang === "ko" ? "계좌가 선택되지 않았습니다" : "No account selected");
        setOrdering(false);
        return;
      }

      const accountData = JSON.parse(localStorage.getItem("bunseok_accounts_v1") || "{}");
      const account = accountData[accountId];

      if (!account?.accountNo || !account?.token || !account?.appkey) {
        alert(lang === "ko" ? "계좌 정보가 없습니다" : "Account info is missing");
        return;
      }

      // 주문 API 호출
      const response = await fetch("/api/account/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNo: account.accountNo,
          accountCode: account.accountCode || "01",
          appkey: account.appkey,
          appsecret: account.appsecret,
          token: account.token,
          symbol: info.ticker,
          exchange: exchange,
          orderType: mode,
          quantity: qty,
          price: price,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setTimeout(() => {
          onSubmit();
          setOrdering(false);
        }, 1400);
      } else {
        alert(data.error || (lang === "ko" ? "주문 실패" : "Order failed"));
        setOrdering(false);
      }
    } catch (err) {
      console.error("Order error:", err);
      alert(lang === "ko" ? "주문 중 오류 발생" : "Order error");
      setOrdering(false);
    }
  };

  return (
    <div className="trade-overlay" onClick={onClose}>
      <div className={`trade-modal trade-${mode}`} onClick={(e) => e.stopPropagation()}>
        <div className="trade-modal-head">
          <div className={`trade-mode-pill trade-${mode}-pill`}>
            {mode === "buy" ? "▲" : "▼"} {mode === "buy" ? T.buyTitle : T.sellTitle}
          </div>
          <button className="detail-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path
                d="M3 3 L11 11 M11 3 L3 11"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="trade-success">
            <div className={`trade-success-icon ${mode}`}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 17 L13 22 L24 11" />
              </svg>
            </div>
            <div className="trade-success-msg">{T.success}</div>
            <div className="trade-success-sub">
              {T.successSub(
                mode === "buy" ? T.confirmBuy : T.confirmSell,
                info.ticker,
                qty,
                price
              )}
            </div>
            <button className="chip" onClick={onClose} style={{ marginTop: 16 }}>
              {T.close}
            </button>
          </div>
        ) : (
          <div className="trade-modal-body">
            {/* Market/Ticker/Price info */}
            <div className="trade-target">
              <div>
                <div className="trade-field-label">{T.market}</div>
                <div className="trade-field-value">NASDAQ · USD</div>
              </div>
              <div>
                <div className="trade-field-label">{T.ticker}</div>
                <div className="trade-field-value">
                  <span className="num" style={{ fontWeight: 700 }}>
                    {info.ticker}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-3)", marginLeft: 8, fontWeight: 400 }}>
                    {info.name}
                  </span>
                </div>
              </div>
              <div>
                <div className="trade-field-label">{lang === "ko" ? "현재가" : "Last"}</div>
                <div className="trade-field-value num">
                  {fmtUsd(info.price)}
                  <span
                    className={`detail-pct ${info.changePct >= 0 ? "up" : "down"}`}
                    style={{ fontSize: 12, marginLeft: 4 }}
                  >
                    {fmtPct2(info.changePct)}
                  </span>
                </div>
              </div>
            </div>

            {/* Price input */}
            <div className="trade-field">
              <label className="trade-field-label">{T.priceLabel}</label>
              <div className="trade-price-segs">
                <button
                  className={priceMode === "market" ? "active" : ""}
                  onClick={() => setPriceFor("market")}
                >
                  {T.p_market}
                  <span className="num">{fmtUsd(info.price)}</span>
                </button>
                <button
                  className={priceMode === "open" ? "active" : ""}
                  onClick={() => setPriceFor("open")}
                >
                  {T.p_open}
                  <span className="num">{fmtUsd(refOpen)}</span>
                </button>
                <button
                  className={priceMode === "high" ? "active" : ""}
                  onClick={() => setPriceFor("high")}
                >
                  {T.p_high}
                  <span className="num">{fmtUsd(refHigh)}</span>
                </button>
                <button
                  className={priceMode === "low" ? "active" : ""}
                  onClick={() => setPriceFor("low")}
                >
                  {T.p_low}
                  <span className="num">{fmtUsd(refLow)}</span>
                </button>
              </div>
              <div className="trade-price-input-row">
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => {
                    setPrice(parseFloat(e.target.value) || 0);
                    setPriceMode("manual");
                  }}
                  className="trade-input num"
                />
                <span className="trade-input-unit">USD</span>
              </div>
            </div>

            {/* Qty input */}
            <div className="trade-field">
              <label className="trade-field-label">
                {T.qtyLabel}
                {mode === "sell" && maxQty != null && (
                  <span style={{ marginLeft: 8, color: "var(--ink-3)", fontWeight: 400 }}>
                    · {T.maxQty(maxQty)}
                  </span>
                )}
              </label>
              <div className="trade-qty-row">
                <button className="qty-step" onClick={() => setQty(Math.max(1, qty - 1))}>
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={mode === "sell" && maxQty != null ? maxQty : undefined}
                  value={qty}
                  onChange={(e) => {
                    let v = parseInt(e.target.value) || 1;
                    if (mode === "sell" && maxQty != null) v = Math.min(v, maxQty);
                    setQty(Math.max(1, v));
                  }}
                  className="trade-input num"
                />
                <button
                  className="qty-step"
                  onClick={() => {
                    const next = qty + 1;
                    if (mode === "sell" && maxQty != null && next > maxQty) return;
                    setQty(next);
                  }}
                >
                  +
                </button>
                {mode === "sell" && maxQty != null && (
                  <button className="qty-max" onClick={() => setQty(maxQty)}>
                    MAX
                  </button>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="trade-total">
              <span className="trade-field-label">{T.totalLabel}</span>
              <span className={`trade-total-amt ${mode}`}>{fmtUsd(total)}</span>
            </div>

            <div className="trade-notice">{T.notice}</div>

            <div className="trade-actions-row">
              <button className="chip" onClick={onClose} disabled={ordering}>
                {T.cancel}
              </button>
              <button className={`trade-confirm ${mode}`} onClick={handleSubmit} disabled={loading || ordering}>
                {ordering ? (lang === "ko" ? "주문 중..." : "Ordering...") : (mode === "buy" ? T.confirmBuy : T.confirmSell)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
