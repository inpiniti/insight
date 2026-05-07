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

  const handleRefresh = async () => {
    if (!selectedAccount) {
      setBalanceError(lang === "ko" ? "계좌를 선택해주세요" : "Please select an account");
      return;
    }

    setBalanceLoading(true);
    setBalanceError("");
    setBalanceData(null);

    try {
      let token = selectedAccount.token;
      let expiresAt = selectedAccount.tokenExpiresAt;

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

      const balanceRes = await fetch(
        `/api/account/balance?accountNo=${selectedAccount.accountNo}&accountCode=${selectedAccount.accountCode}&appkey=${selectedAccount.appkey}&appsecret=${selectedAccount.appsecret}&token=${token}`
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

        <form onSubmit={handleAddAccount} className="account-form">
          <h2 className="account-form-title">{T.addTitle}</h2>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">{T.nameLabel}</label>
              <input
                type="text"
                placeholder={T.namePh}
                value={formInput.name}
                onChange={(e) => setFormInput({ ...formInput, name: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label className="form-label">{T.appkeyLabel}</label>
              <div className="form-input-wrap">
                <input
                  type={formInput.showKey ? "text" : "password"}
                  placeholder={T.appkeyLabel}
                  value={formInput.appkey}
                  onChange={(e) => setFormInput({ ...formInput, appkey: e.target.value })}
                  className="form-input"
                />
                <button
                  type="button"
                  className="form-eye-btn"
                  onClick={() => setFormInput({ ...formInput, showKey: !formInput.showKey })}
                >
                  {formInput.showKey ? "👁" : "🙈"}
                </button>
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">{T.appsecretLabel}</label>
              <div className="form-input-wrap">
                <input
                  type={formInput.showSecret ? "text" : "password"}
                  placeholder={T.appsecretLabel}
                  value={formInput.appsecret}
                  onChange={(e) => setFormInput({ ...formInput, appsecret: e.target.value })}
                  className="form-input"
                />
                <button
                  type="button"
                  className="form-eye-btn"
                  onClick={() => setFormInput({ ...formInput, showSecret: !formInput.showSecret })}
                >
                  {formInput.showSecret ? "👁" : "🙈"}
                </button>
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">{T.accountNoLabel}</label>
              <input
                type="text"
                placeholder={T.accountNoPh}
                value={formInput.accountNo}
                onChange={(e) => setFormInput({ ...formInput, accountNo: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
          <button type="submit" className="form-submit">
            {T.addBtn}
          </button>
        </form>

        {accounts.length > 0 && (
          <div className="account-list">
            <div className="account-list-title">{T.listTitle}</div>
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
                  className={`account-row ${isSelected ? "selected" : ""}`}
                  onClick={() => selectAccount(account.id)}
                >
                  <input
                    type="radio"
                    className="account-radio"
                    checked={isSelected}
                    readOnly
                  />
                  <div className="account-name">
                    {account.name || account.accountNo}
                  </div>
                  <div className="account-no">{account.accountNo}</div>
                  <div className={`token-badge ${tokenStatus}`}>{tokenLabel}</div>
                  <button
                    type="button"
                    className="account-delete-btn"
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

        {accounts.length === 0 && <p style={{ padding: "40px", textAlign: "center", color: "var(--ink-3)" }}>{T.noAccounts}</p>}

        {selectedAccount ? (
          <div className="balance-section">
            <div className="balance-section-head">
              <h2 className="balance-title">{T.balanceTitle}</h2>
              <button
                className="balance-refresh-btn"
                onClick={handleRefresh}
                disabled={balanceLoading}
              >
                {balanceLoading ? T.refreshing : T.refreshBtn}
              </button>
            </div>

            {balanceError && <div className="balance-error">{balanceError}</div>}

            {balanceData && (
              <>
                <div className="balance-summary">
                  {balanceData.krw && (
                    <div className="balance-card">
                      <div className="balance-card-label">{T.krwLabel}</div>
                      <div className="balance-card-value">
                        ₩{Number(balanceData.krw.balance).toLocaleString()}
                      </div>
                      <div className="balance-card-sub">
                        {lang === "ko" ? "사용가능:" : "Available:"} ₩{Number(balanceData.krw.availableBalance).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {balanceData.usd && (
                    <div className="balance-card">
                      <div className="balance-card-label">{T.usdLabel}</div>
                      <div className="balance-card-value">
                        ${Number(balanceData.usd.balance).toFixed(2)}
                      </div>
                      <div className="balance-card-sub">
                        {lang === "ko" ? "사용가능:" : "Available:"} ${Number(balanceData.usd.availableBalance).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                {balanceData.holdings && balanceData.holdings.length > 0 && (
                  <div>
                    <h3 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>
                      {T.holdings}
                    </h3>
                    <div className="holding-table">
                      <div className="holding-row holding-row-head">
                        <div>{T.ticker}</div>
                        <div>{T.name}</div>
                        <div>{T.quantity}</div>
                        <div>{T.avgPrice}</div>
                        <div>{T.currentPrice}</div>
                        <div>{T.value}</div>
                        <div>{T.pnl}</div>
                      </div>
                      {balanceData.holdings.map((h: any) => {
                        const qty = parseFloat(h.ccld_qty_smtl1 || h.cblc_qty13 || 0);
                        const avgPrice = parseFloat(h.avg_unpr3 || 0);
                        const currentPrice = parseFloat(h.ovrs_now_pric1 || 0);
                        const value = qty * currentPrice;
                        const pnlAmount = value - qty * avgPrice;
                        const pnlPercent = qty > 0 ? (pnlAmount / (qty * avgPrice)) * 100 : 0;
                        const isPnlPos = pnlAmount >= 0;

                        return (
                          <div key={h.pdno} className="holding-row">
                            <div className="holding-ticker">{h.pdno}</div>
                            <div>{h.prdt_name}</div>
                            <div className="holding-cell">{qty.toFixed(0)}</div>
                            <div className="holding-cell">${avgPrice.toFixed(2)}</div>
                            <div className="holding-cell">${currentPrice.toFixed(2)}</div>
                            <div className="holding-cell">${value.toFixed(2)}</div>
                            <div className={`holding-cell holding-pnl ${isPnlPos ? "pos" : "neg"}`}>
                              {isPnlPos ? "+" : ""}{pnlAmount.toFixed(2)} ({isPnlPos ? "+" : ""}{pnlPercent.toFixed(1)}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {!balanceData && !balanceError && (
              <p style={{ paddingTop: "32px", textAlign: "center", color: "var(--ink-3)" }}>
                {T.refreshBtn} {lang === "ko" ? "버튼을 눌러 잔고를 조회하세요." : "to view balance"}
              </p>
            )}
          </div>
        ) : (
          <div className="balance-section" style={{ opacity: 0.6, pointerEvents: "none" }}>
            <h2 className="balance-title">{T.balanceTitle}</h2>
            <p style={{ paddingTop: "32px", textAlign: "center", color: "var(--ink-3)" }}>{T.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
}
