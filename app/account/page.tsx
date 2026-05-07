"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { useAccountStore, parseAccountNo, Account } from "@/lib/account-store";
import tickerStore from "@/lib/ticker-store";
import GlobalTickerPanel from "@/components/GlobalTickerPanel";

export default function AccountPage() {
  const [lang, setLang] = useState<"ko" | "en">("ko");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [currency, setCurrency] = useState<"KRW" | "USD">("KRW");
  const [showAddForm, setShowAddForm] = useState(false);

  const accounts = useAccountStore((s) => s.accounts);
  const selectedId = useAccountStore((s) => s.selectedId);
  const addAccount = useAccountStore((s) => s.addAccount);
  const removeAccount = useAccountStore((s) => s.removeAccount);
  const selectAccount = useAccountStore((s) => s.selectAccount);
  const updateToken = useAccountStore((s) => s.updateToken);
  const isTokenExpired = useAccountStore((s) => s.isTokenExpired);

  const [formInput, setFormInput] = useState({
    name: "",
    appkey: "",
    appsecret: "",
    accountNo: "",
  });

  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [balanceData, setBalanceData] = useState<any>(null);
  const [lastInquireTime, setLastInquireTime] = useState<number | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  // Load balance data from localStorage when selectedId changes
  useEffect(() => {
    if (typeof window === "undefined" || !selectedId) return;

    try {
      const cached = localStorage.getItem("account_balance_cache");
      if (cached) {
        const { accountId, data, time } = JSON.parse(cached);
        if (accountId === selectedId) {
          // Load cached balance for this account
          setBalanceData(data);
          setLastInquireTime(time);
        } else {
          // Different account, clear balance
          setBalanceData(null);
          setLastInquireTime(null);
          setBalanceError("");
        }
      } else {
        // No cache, clear balance
        setBalanceData(null);
        setLastInquireTime(null);
        setBalanceError("");
      }
    } catch (e) {
      console.error("Failed to load balance cache:", e);
    }
  }, [selectedId]);

  // Save balance data to localStorage when it changes
  useEffect(() => {
    if (balanceData && selectedId) {
      try {
        localStorage.setItem(
          "account_balance_cache",
          JSON.stringify({
            accountId: selectedId,
            data: balanceData,
            time: lastInquireTime,
          })
        );
      } catch (e) {
        console.error("Failed to save balance cache:", e);
      }
    }
  }, [balanceData, lastInquireTime, selectedId]);

  const selectedAccount = accounts.find((a) => a.id === selectedId);

  const T = lang === "ko"
    ? {
        title: "내 계좌",
        sub: "계좌 정보를 안전하게 브라우저에 저장합니다.",
        accountList: "계좌 목록",
        add: "+ 계좌 추가",
        addTitle: "계좌 추가",
        nameLabel: "별명",
        namePh: "My main account",
        appkeyLabel: "App Key",
        appsecretLabel: "Secret Key",
        accountNoLabel: "계좌번호",
        accountNoPh: "50012345-01",
        cancel: "취소",
        save: "저장",
        noAccounts: "등록된 계좌가 없습니다. 계좌를 추가해 주세요.",
        empty_select: "왼쪽에서 계좌를 선택하면 잔고와 보유 종목을 조회할 수 있습니다.",
        tokenValid: "토큰 유효",
        tokenExpired: "토큰 만료",
        issue: "토큰 발급",
        refresh: "재발급",
        inquire: "계좌 조회",
        issuing: "발급 중…",
        inquiring: "조회 중…",
        issued: "발급됨",
        delete: "삭제",
        confirmDelete: "정말 삭제하시겠습니까?",
        total: "총자산",
        cash: "총예수금",
        pnl: "평가손익",
        evalAmt: "평가금액",
        holdings: "보유 종목",
        h_ticker: "종목",
        h_qty: "수량",
        h_avg: "평균단가",
        h_cur: "현재가",
        h_chg: "변동률",
        h_eval: "평가금액",
        fxNote: "환율: 1 USD = ₩",
        selected: "선택됨",
      }
    : {
        title: "My Accounts",
        sub: "Account info is stored in your browser only.",
        accountList: "Accounts",
        add: "+ Add account",
        addTitle: "Add Account",
        nameLabel: "Nickname",
        namePh: "My main account",
        appkeyLabel: "App Key",
        appsecretLabel: "Secret Key",
        accountNoLabel: "Account No.",
        accountNoPh: "50012345-01",
        cancel: "Cancel",
        save: "Save",
        noAccounts: "No accounts yet. Add one to get started.",
        empty_select: "Select an account on the left to view balance and holdings.",
        tokenValid: "Token valid",
        tokenExpired: "Token expired",
        issue: "Issue token",
        refresh: "Refresh",
        inquire: "Inquire",
        issuing: "Issuing…",
        inquiring: "Loading…",
        issued: "issued",
        delete: "Delete",
        confirmDelete: "Are you sure?",
        total: "Total assets",
        cash: "Cash",
        pnl: "Unrealized P&L",
        evalAmt: "Evaluation",
        holdings: "Holdings",
        h_ticker: "Ticker",
        h_qty: "Qty",
        h_avg: "Avg cost",
        h_cur: "Current",
        h_chg: "Change",
        h_eval: "Eval",
        fxNote: "FX: 1 USD = ₩",
        selected: "Selected",
      };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInput.appkey || !formInput.appsecret || !formInput.accountNo) {
      alert(lang === "ko" ? "필수 정보를 입력해주세요" : "Please fill in required fields");
      return;
    }

    const { accountNo, accountCode } = parseAccountNo(formInput.accountNo);
    const id = addAccount({
      name: formInput.name || undefined,
      appkey: formInput.appkey,
      appsecret: formInput.appsecret,
      accountNo,
      accountCode,
    });

    selectAccount(id);
    setFormInput({ name: "", appkey: "", appsecret: "", accountNo: "" });
    setShowAddForm(false);
  };

  const handleIssueToken = async () => {
    if (!selectedAccount) return;

    setTokenLoading(true);
    try {
      const tokenRes = await fetch("/api/account/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appkey: selectedAccount.appkey,
          appsecret: selectedAccount.appsecret,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json();
        throw new Error(err.error || "Token issue failed");
      }

      const tokenData = await tokenRes.json();
      updateToken(selectedAccount.id, tokenData.access_token, tokenData.expiresAt);
    } catch (error) {
      console.error("Token issue error:", error);
    } finally {
      setTokenLoading(false);
    }
  };

  const handleInquire = async () => {
    if (!selectedAccount) return;

    setBalanceLoading(true);
    setBalanceError("");
    setBalanceData(null);

    try {
      let token: string = selectedAccount.token || "";
      let expiresAt: number = selectedAccount.tokenExpiresAt || 0;

      if (!token || isTokenExpired(selectedAccount)) {
        const tokenRes = await fetch("/api/account/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appkey: selectedAccount.appkey,
            appsecret: selectedAccount.appsecret,
          }),
        });

        if (!tokenRes.ok) {
          throw new Error("Token issue failed");
        }

        const tokenData = await tokenRes.json();
        token = tokenData.access_token;
        expiresAt = tokenData.expiresAt;
        updateToken(selectedAccount.id, token, expiresAt);
      }

      const params = new URLSearchParams({
        accountNo: selectedAccount.accountNo,
        accountCode: selectedAccount.accountCode,
        appkey: selectedAccount.appkey,
        appsecret: selectedAccount.appsecret,
        token,
      });

      const balanceRes = await fetch(`/api/account/balance?${params.toString()}`);

      if (!balanceRes.ok) {
        const err = await balanceRes.json();
        throw new Error(err.error || "Balance inquiry failed");
      }

      const data = await balanceRes.json();
      setBalanceData(data);
      setLastInquireTime(Date.now());
    } catch (error) {
      setBalanceError(error instanceof Error ? error.message : "Error occurred");
      setLastInquireTime(Date.now());
    } finally {
      setBalanceLoading(false);
    }
  };

  const timeAgo = (ts?: number) => {
    if (!ts) return "";
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return lang === "ko" ? "방금" : "just now";
    if (m < 60) return lang === "ko" ? `${m}분 전` : `${m}m ago`;
    const h = Math.floor(m / 60);
    return lang === "ko" ? `${h}시간 전` : `${h}h ago`;
  };

  const fmt = (krwValue: number) => {
    if (!balanceData?.krw) return "—";
    if (currency === "USD") {
      const fx = 1380; // default
      return "$" + (krwValue / fx).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return "₩" + Math.round(krwValue).toLocaleString();
  };

  const fmtPrice = (usdValue: number) => {
    if (currency === "USD") {
      return "$" + usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    const krwValue = usdValue * 1380;
    return "₩" + Math.round(krwValue).toLocaleString();
  };

  return (
    <div data-theme={theme}>
      <GlobalTickerPanel lang={lang} />
      <Nav lang={lang} theme={theme} currentPage="account" onLangChange={setLang} onThemeChange={setTheme} />

      <div className="container">
        <section className="hero" style={{ paddingTop: 56, paddingBottom: 28 }}>
          <div className="hero-eyebrow">{lang === "ko" ? "계좌 관리" : "Account"}</div>
          <h1 className="hero-title">{T.title}</h1>
          <p className="hero-sub">{T.sub}</p>
        </section>

        <section className="acc-grid">
          {/* LEFT PANEL: Account List + Add Form */}
          <div className="acc-list-wrap">
            <div className="acc-list-head">
              <div className="pf-section-title">
                {T.accountList} <span className="num" style={{ color: "var(--ink-4)" }}>{accounts.length}</span>
              </div>
              <button className="chip active" onClick={() => setShowAddForm(true)}>
                {T.add}
              </button>
            </div>

            {accounts.length === 0 && !showAddForm && (
              <div className="acc-empty">{T.noAccounts}</div>
            )}

            <div className="acc-list">
              {accounts.map((account) => {
                const isSelected = account.id === selectedId;
                const tokenStatus = !account.token
                  ? "expired"
                  : isTokenExpired(account)
                    ? "expired"
                    : "valid";

                return (
                  <div
                    key={account.id}
                    className={`acc-item ${isSelected ? "active" : ""}`}
                    onClick={() => selectAccount(account.id)}
                  >
                    <div className="acc-item-head">
                      <span className="acc-name">{account.name || account.accountNo}</span>
                      {isSelected && <span className="acc-active-pill">{T.selected}</span>}
                    </div>
                    <div className="acc-no num">{account.accountNo}</div>
                    <div className="acc-meta">
                      <span className={`acc-token-dot ${tokenStatus === "valid" ? "ok" : "off"}`}></span>
                      <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                        {tokenStatus === "valid" ? T.tokenValid : T.tokenExpired}
                        {tokenStatus === "valid" && account.tokenExpiresAt && ` · ${timeAgo(account.tokenExpiresAt)}`}
                      </span>
                      <button
                        className="acc-del"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(T.confirmDelete)) removeAccount(account.id);
                        }}
                        aria-label="delete"
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round">
                          <path d="M3 4 H10 M5 4 V2.5 H8 V4 M4 4 L4.5 11 H8.5 L9 4"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {showAddForm && (
              <form onSubmit={handleAddAccount} className="acc-form">
                <div className="acc-form-head">{T.addTitle}</div>
                <label className="acc-field">
                  <span>{T.nameLabel}</span>
                  <input
                    value={formInput.name}
                    onChange={(e) => setFormInput({ ...formInput, name: e.target.value })}
                    placeholder={T.namePh}
                  />
                </label>
                <label className="acc-field">
                  <span>{T.appkeyLabel}</span>
                  <input
                    value={formInput.appkey}
                    onChange={(e) => setFormInput({ ...formInput, appkey: e.target.value })}
                    placeholder="P********"
                  />
                </label>
                <label className="acc-field">
                  <span>{T.appsecretLabel}</span>
                  <input
                    type="password"
                    value={formInput.appsecret}
                    onChange={(e) => setFormInput({ ...formInput, appsecret: e.target.value })}
                    placeholder="••••••••"
                  />
                </label>
                <label className="acc-field">
                  <span>{T.accountNoLabel}</span>
                  <input
                    value={formInput.accountNo}
                    onChange={(e) => setFormInput({ ...formInput, accountNo: e.target.value })}
                    placeholder={T.accountNoPh}
                  />
                </label>
                <div className="acc-form-actions">
                  <button
                    type="button"
                    className="chip"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormInput({ name: "", appkey: "", appsecret: "", accountNo: "" });
                    }}
                  >
                    {T.cancel}
                  </button>
                  <button type="submit" className="chip active">
                    {T.save}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* RIGHT PANEL: Account Details */}
          <div className="acc-detail">
            {!selectedAccount ? (
              <div className="acc-detail-empty">
                <div className="acc-detail-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="4" y="9" width="24" height="16" rx="2"/>
                    <path d="M4 14 H28 M9 20 H14"/>
                  </svg>
                </div>
                <p>{T.empty_select}</p>
              </div>
            ) : (
              <>
                {/* Detail Head with Currency Toggle */}
                <div className="acc-detail-head">
                  <div>
                    <div className="acc-detail-name">{selectedAccount.name || selectedAccount.accountNo}</div>
                    <div className="acc-detail-no num">{selectedAccount.accountNo}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div className="lang-toggle">
                      <button
                        className={currency === "KRW" ? "active" : ""}
                        onClick={() => setCurrency("KRW")}
                      >
                        ₩ KRW
                      </button>
                      <button
                        className={currency === "USD" ? "active" : ""}
                        onClick={() => setCurrency("USD")}
                      >
                        $ USD
                      </button>
                    </div>
                  </div>
                </div>

                {/* Token Row */}
                <div className="acc-token-row">
                  <div className="acc-token-info">
                    <span className={`acc-token-dot ${selectedAccount.token && !isTokenExpired(selectedAccount) ? "ok" : "off"}`}></span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {selectedAccount.token && !isTokenExpired(selectedAccount) ? T.tokenValid : T.tokenExpired}
                    </span>
                    {selectedAccount.token && !isTokenExpired(selectedAccount) && selectedAccount.tokenExpiresAt && (
                      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>· {T.issued} {timeAgo(selectedAccount.tokenExpiresAt)}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="chip"
                      onClick={handleIssueToken}
                      disabled={tokenLoading}
                    >
                      {tokenLoading ? T.issuing : (selectedAccount.token && !isTokenExpired(selectedAccount) ? T.refresh : T.issue)}
                    </button>
                    <button
                      className="chip active"
                      onClick={handleInquire}
                      disabled={!selectedAccount.token || isTokenExpired(selectedAccount) || balanceLoading}
                    >
                      {balanceLoading ? T.inquiring : T.inquire}
                    </button>
                  </div>
                </div>

                {/* Inquiry Status Row */}
                {lastInquireTime && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "var(--bg-soft)",
                    borderRadius: "12px",
                    marginBottom: "18px",
                    fontSize: "12px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={`acc-token-dot ${balanceError ? "off" : "ok"}`}></span>
                      <span style={{ fontWeight: 600, color: balanceError ? "var(--up)" : "var(--down)" }}>
                        {balanceError
                          ? (lang === "ko" ? "조회 실패" : "Inquiry failed")
                          : (lang === "ko" ? "조회 완료" : "Inquired")}
                      </span>
                      <span style={{ color: "var(--ink-3)" }}>· {timeAgo(lastInquireTime)}</span>
                    </div>
                  </div>
                )}

                {/* Balance Section */}
                {balanceData && (
                  <>
                    <div className="acc-balance-grid">
                      {balanceData.krw && (
                        <>
                          <div className="acc-balance-cell">
                            <div className="strip-label">{T.total}</div>
                            <div className="strip-value">{fmt(balanceData.krw.totalAsset)}</div>
                          </div>
                          <div className="acc-balance-cell">
                            <div className="strip-label">{T.pnl}</div>
                            <div className={`strip-value ${Number(balanceData.krw.evaluationPnl) >= 0 ? "strip-tone-up" : "strip-tone-down"}`}>
                              {Number(balanceData.krw.evaluationPnl) >= 0 ? "+" : ""}{fmt(balanceData.krw.evaluationPnl)}
                            </div>
                          </div>
                          <div className="acc-balance-cell">
                            <div className="strip-label">{T.cash}</div>
                            <div className="strip-value">{fmt(balanceData.krw.totalDeposit)}</div>
                          </div>
                          <div className="acc-balance-cell">
                            <div className="strip-label">{T.evalAmt}</div>
                            <div className="strip-value">{fmt(balanceData.krw.evaluationAmount)}</div>
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-4)", textAlign: "right", marginBottom: 16 }}>
                      {T.fxNote}1380
                    </div>

                    {/* Holdings Table */}
                    {balanceData.holdings && balanceData.holdings.length > 0 && (
                      <div className="acc-holdings">
                        <div className="pf-section-title" style={{ marginBottom: 12 }}>
                          {T.holdings} <span className="num" style={{ color: "var(--ink-4)" }}>{balanceData.holdings.length}</span>
                        </div>
                        <div className="pf-table">
                          <div className="pf-row pf-row-head" style={{ gridTemplateColumns: "1fr 70px 110px 110px 90px 130px" }}>
                            <div>{T.h_ticker}</div>
                            <div style={{ textAlign: "right" }}>{T.h_qty}</div>
                            <div style={{ textAlign: "right" }}>{T.h_avg}</div>
                            <div style={{ textAlign: "right" }}>{T.h_cur}</div>
                            <div style={{ textAlign: "right" }}>{T.h_chg}</div>
                            <div style={{ textAlign: "right" }}>{T.h_eval}</div>
                          </div>
                          {balanceData.holdings.map((h: any) => {
                            const qty = parseFloat(h.ccld_qty_smtl1 || h.cblc_qty13 || 0);
                            const avgPrice = parseFloat(h.avg_unpr3 || 0);
                            const currentPrice = parseFloat(h.ovrs_now_pric1 || 0);
                            const chg = qty > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
                            const evalUsd = qty * currentPrice;

                            return (
                              <div
                                key={h.pdno}
                                className="pf-row pf-row-clickable"
                                style={{ gridTemplateColumns: "1fr 70px 110px 110px 90px 130px", cursor: "pointer" }}
                                onClick={() => {
                                  tickerStore.open({
                                    ticker: h.pdno,
                                    name: h.prdt_name,
                                    price: currentPrice,
                                    changePct: chg,
                                    source: "account",
                                  });
                                }}
                              >
                                <div className="pf-c-tk">
                                  <span className="pf-logo" style={{ background: "var(--accent)" }}>
                                    {h.pdno.slice(0, 2)}
                                  </span>
                                  <div>
                                    <div style={{ fontWeight: 700 }}>{h.pdno}</div>
                                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 400 }}>
                                      {h.prdt_name}
                                    </div>
                                  </div>
                                </div>
                                <div className="num" style={{ textAlign: "right" }}>{qty.toFixed(0)}</div>
                                <div className="num" style={{ textAlign: "right" }}>{fmtPrice(avgPrice)}</div>
                                <div className="num" style={{ textAlign: "right" }}>{fmtPrice(currentPrice)}</div>
                                <div
                                  className="num"
                                  style={{ textAlign: "right", color: chg >= 0 ? "var(--up)" : "var(--down)", fontWeight: 600 }}
                                >
                                  {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
                                </div>
                                <div className="num" style={{ textAlign: "right", fontWeight: 600 }}>
                                  {currency === "USD"
                                    ? "$" + evalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : "₩" + Math.round(evalUsd * 1380).toLocaleString()
                                  }
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!balanceData && !balanceLoading && !balanceError && (
                  <div className="acc-detail-empty" style={{ padding: 40 }}>
                    <p style={{ fontSize: 14 }}>
                      {selectedAccount.token && !isTokenExpired(selectedAccount)
                        ? (lang === "ko" ? "「계좌 조회」 버튼을 눌러 잔고를 가져오세요." : "Press Inquire to fetch balance.")
                        : (lang === "ko" ? "토큰을 먼저 발급해 주세요." : "Issue a token first.")
                      }
                    </p>
                  </div>
                )}

                {balanceError && (
                  <div style={{ color: "var(--up)", fontSize: 12, padding: 20, textAlign: "center" }}>
                    {balanceError}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
