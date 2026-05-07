"use client";

import Link from "next/link";

interface NavProps {
  lang: "ko" | "en";
  theme: "light" | "dark";
  currentPage: "news" | "portfolio" | "account";
  onLangChange: (lang: "ko" | "en") => void;
  onThemeChange: (theme: "light" | "dark") => void;
}

export function Nav({ lang, theme, currentPage, onLangChange, onThemeChange }: NavProps) {
  const navNewsLabel = lang === "ko" ? "뉴스 분석" : "News";

  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="brand">
          <div className="brand-dot">✨</div>
          <span>인사이트</span>
        </div>
        <div className="nav-links">
          <Link href="/" className={`nav-link ${currentPage === "news" ? "active" : ""}`}>
            {navNewsLabel}
          </Link>
          <Link href="/portfolio" className={`nav-link ${currentPage === "portfolio" ? "active" : ""}`}>
            {lang === "ko" ? "포트폴리오" : "Portfolio"}
          </Link>
          <Link href="/account" className={`nav-link ${currentPage === "account" ? "active" : ""}`}>
            {lang === "ko" ? "계좌" : "Account"}
          </Link>
        </div>
        <div className="nav-spacer" />
        <div className="nav-actions">
          <div className="lang-toggle">
            <button className={lang === "ko" ? "active" : ""} onClick={() => onLangChange("ko")}>KO</button>
            <button className={lang === "en" ? "active" : ""} onClick={() => onLangChange("en")}>EN</button>
          </div>
          <button className="icon-btn" onClick={() => onThemeChange(theme === "light" ? "dark" : "light")} aria-label="theme">
            {theme === "light" ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3"/></svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
