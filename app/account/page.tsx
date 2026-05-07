"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { useAccountStore, parseAccountNo, Account } from "@/lib/account-store";

export default function AccountPage() {
  const [lang, setLang] = useState<"ko" | "en">("ko");
  const [theme, setTheme] = useState<"light" | "dark">("light");

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
    showKey: false,
    showSecret: false,
  });

  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [balanceData, setBalanceData] = useState<any>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");

  const selectedAccount = accounts.find((a) => a.id === selectedId);

  const T = lang === "ko"
    ? {
        title: "계좌 관리",
        addTitle: "계좌 추가",
        nameLabel: "별명 (선택)",
        namePh: "예) 내 계좌 #1",
        appkeyLabel: "App Key",
        appsecretLabel: "Secret Key",
        accountNoLabel: "계좌번호",
        accountNoPh: "12345678-01",
        addBtn: "계좌 추가",
        listTitle: "등록된 계좌",
        noAccounts: "등록된 계좌가 없습니다.",
        empty: "계좌를 선택해주세요",
        balanceTitle: "잔고 조회",
        refreshBtn: "조회",
        refreshing: "조회 중...",
        krwLabel: "원화",
        usdLabel: "달러",
        holdings: "보유 종목",
        ticker: "티커",
        name: "종목명",
        quantity: "보유수량",
        avgPrice: "평균단가",
        currentPrice: "현재가",
        value: "평가금액",
        pnl: "손익",
        tokenValid: "유효",
        tokenExpired: "만료",
        tokenNone: "미발급",
        delete: "삭제",
      }
    : {
        title: "Account Management",
        addTitle: "Add Account",
        nameLabel: "Nickname (optional)",
        namePh: "e.g. My Account #1",
        appkeyLabel: "App Key",
        appsecretLabel: "Secret Key",
        accountNoLabel: "Account Number",
        accountNoPh: "12345678-01",
        addBtn: "Add Account",
        listTitle: "Registered Accounts",
        noAccounts: "No accounts registered.",
        empty: "Please select an account",
        balanceTitle: "Balance",
        refreshBtn: "Refresh",
        refreshing: "Loading...",
        krwLabel: "KRW",
        usdLabel: "USD",
        holdings: "Holdings",
        ticker: "Ticker",
        name: "Name",
        quantity: "Quantity",
        avgPrice: "Avg Price",
        currentPrice: "Price",
        value: "Value",
        pnl: "P&L",
        tokenValid: "Valid",
        tokenExpired: "Expired",
        tokenNone: "Not issued",
        delete: "Delete",
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
    setFormInput({ name: "", appkey: "", appsecret: "", accountNo: "", showKey: false, showSecret: false });
  };

  const handleIssueToken = async () => {
    if (!selectedAccount) {
      setTokenError(lang === "ko" ? "계좌를 선택해주세요" : "Please select an account");
      return;
    }

    setTokenLoading(true);
    setTokenError("");

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
        throw new Error(err.error || (lang === "ko" ? "토큰 발급 실패" : "Token issue failed"));
      }

      const tokenData = await tokenRes.json();
      updateToken(selectedAccount.id, tokenData.access_token, tokenData.expiresAt);
      setTokenError("");
    } catch (error) {
      setTokenError(error instanceof Error ? error.message : (lang === "ko" ? "오류 발생" : "Error occurred"));
    } finally {
      setTokenLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedAccount) {
      setBalanceError(lang === "ko" ? "계좌를 선택해주세요" : "Please select an account");
      return;
    }

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
          const err = await tokenRes.json();
          throw new Error(err.error || "토큰 발급 실패");
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

      const balanceRes = await fetch(
        `/api/account/balance?${params.toString()}`
      );

      if (!balanceRes.ok) {
        const err = await balanceRes.json();
        throw new Error(err.error || "잔고 조회 실패");
      }

      const data = await balanceRes.json();
      setBalanceData(data);
    } catch (error) {
      setBalanceError(error instanceof Error ? error.message : "오류 발생");
    } finally {
      setBalanceLoading(false);
    }
  };

  return (
    <div data-theme={theme}>
      <Nav lang={lang} theme={theme} currentPage="account" onLangChange={setLang} onThemeChange={setTheme} />

      <div className="container">
        <section className="hero" style={{ paddingTop: 56, paddingBottom: 16 }}>
          <div className="hero-eyebrow">{lang === "ko" ? "포트폴리오 관리" : "Portfolio Management"}</div>
          <h1 className="hero-title">{T.title}</h1>
        </section>

        <div className="acc-grid">
          {/* LEFT PANEL: Account List + Add Form */}
          <div className="acc-list-wrap">
            {/* Account List */}
            {accounts.length > 0 && (
              <div>
                {accounts.map((account) => {
                  const isSelected = account.id === selectedId;
                  const tokenStatus = !account.token
                    ? "none"
                    : isTokenExpired(account)
                      ? "expired"
                      : "valid";
                  const tokenLabel =
                    tokenStatus === "none"
                      ? T.tokenNone
                      : tokenStatus === "expired"
                        ? T.tokenExpired
                        : `${T.tokenValid} · ${new Date(account.tokenExpiresAt!).toLocaleTimeString(lang === "ko" ? "ko-KR" : "en-US", { hour: "2-digit", minute: "2-digit" })}`;

                  return (
                    <div
                      key={account.id}
                      className={`acc-item ${isSelected ? "selected" : ""}`}
                      onClick={() => selectAccount(account.id)}
                    >
                      <input
                        type="radio"
                        className="acc-radio"
                        checked={isSelected}
                        readOnly
                      />
                      <div className="acc-item-content">
                        <div className="acc-item-name">
                          {account.name || account.accountNo}
                        </div>
                        <div className="acc-item-no">{account.accountNo}</div>
                        <div className={`acc-token-badge ${tokenStatus}`}>{tokenLabel}</div>
                      </div>
                      <button
                        type="button"
                        className="acc-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAccount(account.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {accounts.length === 0 && (
              <p style={{ padding: "20px", textAlign: "center", color: "var(--ink-3)", fontSize: "13px" }}>
                {T.noAccounts}
              </p>
            )}

            {/* Add Account Form */}
            <form onSubmit={handleAddAccount} className="acc-form">
              <div className="acc-form-field">
                <label className="acc-form-label">{T.nameLabel}</label>
                <input
                  type="text"
                  placeholder={T.namePh}
                  value={formInput.name}
                  onChange={(e) => setFormInput({ ...formInput, name: e.target.value })}
                  className="acc-form-input"
                />
              </div>
              <div className="acc-form-field">
                <label className="acc-form-label">{T.appkeyLabel}</label>
                <div className="acc-form-input-wrap">
                  <input
                    type={formInput.showKey ? "text" : "password"}
                    placeholder={T.appkeyLabel}
                    value={formInput.appkey}
                    onChange={(e) => setFormInput({ ...formInput, appkey: e.target.value })}
                    className="acc-form-input"
                  />
                  <button
                    type="button"
                    className="acc-form-eye-btn"
                    onClick={() => setFormInput({ ...formInput, showKey: !formInput.showKey })}
                  >
                    {formInput.showKey ? "👁" : "🙈"}
                  </button>
                </div>
              </div>
              <div className="acc-form-field">
                <label className="acc-form-label">{T.appsecretLabel}</label>
                <div className="acc-form-input-wrap">
                  <input
                    type={formInput.showSecret ? "text" : "password"}
                    placeholder={T.appsecretLabel}
                    value={formInput.appsecret}
                    onChange={(e) => setFormInput({ ...formInput, appsecret: e.target.value })}
                    className="acc-form-input"
                  />
                  <button
                    type="button"
                    className="acc-form-eye-btn"
                    onClick={() => setFormInput({ ...formInput, showSecret: !formInput.showSecret })}
                  >
                    {formInput.showSecret ? "👁" : "🙈"}
                  </button>
                </div>
              </div>
              <div className="acc-form-field">
                <label className="acc-form-label">{T.accountNoLabel}</label>
                <input
                  type="text"
                  placeholder={T.accountNoPh}
                  value={formInput.accountNo}
                  onChange={(e) => setFormInput({ ...formInput, accountNo: e.target.value })}
                  className="acc-form-input"
                />
              </div>
              <button type="submit" className="acc-form-submit">
                {T.addBtn}
              </button>
            </form>
          </div>

          {/* RIGHT PANEL: Account Details & Balance */}
          {selectedAccount ? (
            <div className="acc-detail">
              {/* Detail Head */}
              <div className="acc-detail-head">
                <h2 className="acc-detail-title">
                  {selectedAccount.name || selectedAccount.accountNo}
                </h2>
                <div className="acc-detail-info">
                  {lang === "ko" ? "계좌번호: " : "Account: "}{selectedAccount.accountNo}
                </div>
              </div>

              {/* Token Management Row */}
              <div className="acc-token-row">
                <button
                  className="acc-token-btn"
                  onClick={handleIssueToken}
                  disabled={tokenLoading}
                >
                  {tokenLoading ? (lang === "ko" ? "발급 중..." : "Issuing...") : (lang === "ko" ? "토큰 발급" : "Issue Token")}
                </button>
                <div className="acc-token-status">
                  {tokenError ? (
                    <div style={{ color: "var(--up)", fontSize: "12px" }}>{tokenError}</div>
                  ) : selectedAccount && !isTokenExpired(selectedAccount) && selectedAccount.token ? (
                    <div style={{ color: "var(--down)", fontSize: "12px" }}>
                      ✓ {lang === "ko" ? "토큰 유효" : "Token valid"}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Balance Section */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "600" }}>{T.balanceTitle}</h3>
                  <button
                    className="acc-balance-btn"
                    onClick={handleRefresh}
                    disabled={balanceLoading}
                  >
                    {balanceLoading ? T.refreshing : T.refreshBtn}
                  </button>
                </div>

                {balanceError && (
                  <div style={{ color: "var(--up)", fontSize: "12px", marginBottom: "12px" }}>
                    {balanceError}
                  </div>
                )}

                {balanceData && (
                  <>
                    {/* Balance Grid */}
                    <div className="acc-balance-grid">
                      {balanceData.krw && (
                        <>
                          <div className="acc-balance-cell">
                            <div className="acc-balance-label">
                              {lang === "ko" ? "실자산" : "Total Asset"}
                            </div>
                            <div className="acc-balance-value">₩{Number(balanceData.krw.totalAsset).toLocaleString()}</div>
                          </div>
                          <div className="acc-balance-cell">
                            <div className="acc-balance-label">
                              {lang === "ko" ? "총예수금" : "Total Deposit"}
                            </div>
                            <div className="acc-balance-value">₩{Number(balanceData.krw.totalDeposit).toLocaleString()}</div>
                          </div>
                          <div className="acc-balance-cell">
                            <div className="acc-balance-label">
                              {lang === "ko" ? "평가금액" : "Evaluation"}
                            </div>
                            <div className="acc-balance-value">₩{Number(balanceData.krw.evaluationAmount).toLocaleString()}</div>
                          </div>
                          <div className="acc-balance-cell">
                            <div className="acc-balance-label">
                              {lang === "ko" ? "평가손익" : "P&L"}
                            </div>
                            <div className="acc-balance-value" style={{ color: Number(balanceData.krw.evaluationPnl) >= 0 ? "var(--up)" : "var(--down)" }}>
                              {Number(balanceData.krw.evaluationPnl) >= 0 ? "+" : ""}₩{Number(balanceData.krw.evaluationPnl).toLocaleString()}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Holdings */}
                    {balanceData.holdings && balanceData.holdings.length > 0 && (
                      <div className="acc-holdings">
                        <h3 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>
                          📊 {T.holdings} ({balanceData.holdings.length})
                        </h3>
                        <div className="holding-table">
                          <div className="holding-row holding-row-head">
                            <div style={{ minWidth: "60px" }}>{T.ticker}</div>
                            <div style={{ flex: 1 }}>{T.name}</div>
                            <div style={{ minWidth: "50px" }}>{T.quantity}</div>
                            <div style={{ minWidth: "70px" }}>{lang === "ko" ? "매수가" : "Buy"}</div>
                            <div style={{ minWidth: "70px" }}>{lang === "ko" ? "현재가" : "Price"}</div>
                            <div style={{ minWidth: "70px" }}>{T.value}</div>
                            <div style={{ minWidth: "60px" }}>{lang === "ko" ? "수익률" : "Return"}</div>
                            <div style={{ minWidth: "100px" }}>{lang === "ko" ? "손익" : "P&L"}</div>
                          </div>
                          {balanceData.holdings.map((h: any) => {
                            const qty = parseFloat(h.ccld_qty_smtl1 || h.cblc_qty13 || 0);
                            const avgPrice = parseFloat(h.avg_unpr3 || 0);
                            const currentPrice = parseFloat(h.ovrs_now_pric1 || 0);
                            const value = qty * currentPrice;
                            const pnlAmount = value - qty * avgPrice;
                            const pnlPercent = qty > 0 ? (pnlAmount / (qty * avgPrice)) * 100 : 0;
                            const isPnlPos = pnlAmount >= 0;

                            const baseExrt = parseFloat(h.bass_exrt || 1300);
                            const avgPriceKrw = avgPrice * baseExrt;
                            const currentPriceKrw = currentPrice * baseExrt;
                            const valueKrw = value * baseExrt;
                            const pnlAmountKrw = pnlAmount * baseExrt;

                            return (
                              <div key={h.pdno} className="holding-row">
                                <div className="holding-ticker">{h.pdno}</div>
                                <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>{h.prdt_name}</div>
                                <div className="holding-cell">{qty.toFixed(0)}</div>
                                <div className="holding-cell" title={`${avgPrice.toFixed(2)} USD`}>
                                  ${avgPrice.toFixed(2)}<br/><span style={{ fontSize: "10px", color: "var(--ink-4)" }}>₩{(avgPriceKrw).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="holding-cell" title={`${currentPrice.toFixed(2)} USD`}>
                                  ${currentPrice.toFixed(2)}<br/><span style={{ fontSize: "10px", color: "var(--ink-4)" }}>₩{(currentPriceKrw).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="holding-cell" title={`${value.toFixed(2)} USD`}>
                                  ${value.toFixed(2)}<br/><span style={{ fontSize: "10px", color: "var(--ink-4)" }}>₩{(valueKrw).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className={`holding-cell ${isPnlPos ? "holding-pnl pos" : "holding-pnl neg"}`}>
                                  {pnlPercent.toFixed(1)}%
                                </div>
                                <div className={`holding-cell ${isPnlPos ? "holding-pnl pos" : "holding-pnl neg"}`}>
                                  {isPnlPos ? "+" : ""}{pnlAmount.toFixed(2)}$<br/><span style={{ fontSize: "10px" }}>{isPnlPos ? "+" : ""}₩{(pnlAmountKrw).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {!balanceData.holdings || balanceData.holdings.length === 0 && (
                      <p style={{ paddingTop: "20px", textAlign: "center", color: "var(--ink-3)", fontSize: "12px" }}>
                        {lang === "ko" ? "보유 종목이 없습니다" : "No holdings"}
                      </p>
                    )}
                  </>
                )}

                {!balanceData && !balanceError && (
                  <p style={{ paddingTop: "20px", textAlign: "center", color: "var(--ink-3)", fontSize: "12px" }}>
                    {T.refreshBtn} {lang === "ko" ? "버튼을 눌러 잔고를 조회하세요." : "to view balance"}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="acc-detail" style={{ opacity: 0.5, pointerEvents: "none" }}>
              <p style={{ textAlign: "center", color: "var(--ink-3)", fontSize: "13px", paddingTop: "40px" }}>
                {T.empty}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
