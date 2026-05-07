"use client";

import { useState, useMemo, useEffect } from "react";
import { Nav } from "@/components/Nav";
import { Calendar } from "@/components/Calendar";
import { StockCard } from "@/components/StockCard";
import { DetailPanel } from "@/components/DetailPanel";
import { TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle } from "@/components/TweaksPanel";
import APP_DATA, { Stock, AppData, fetchSP500Impact, fetchSP500Meta } from "@/lib/data";
import { I18N } from "@/lib/i18n";

interface Tweaks {
  cardStyle: "default" | "minimal" | "editorial";
  density: "comfy" | "compact";
  theme: "light" | "dark";
  accent: string;
}

export default function Home() {
  const [tweaks, setTweak] = useTweaks<Tweaks>({
    cardStyle: "default",
    density: "comfy",
    theme: "light",
    accent: "#2f6dff",
  });
  const [lang, setLang] = useState<"ko" | "en">("ko");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-04-30");
  const [activeStock, setActiveStock] = useState<Stock | null>(null);
  const [data, setData] = useState<AppData>(APP_DATA);
  const [loading, setLoading] = useState(true);

  // Backend에서 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [stocks, meta] = await Promise.all([
        fetchSP500Impact(selectedDate),
        fetchSP500Meta(selectedDate),
      ]);
      const newData = {
        meta,
        headlines: APP_DATA.headlines,
        models: APP_DATA.models,
        stocks,
      } as typeof APP_DATA;
      setData(newData);
      // Expose to window for GlobalTickerPanel lookup
      (window as any).APP_DATA = newData;
      setLoading(false);
    };
    loadData();
  }, [selectedDate]);

  // Ensure APP_DATA is always available to window
  useEffect(() => {
    (window as any).APP_DATA = data;
  }, [data]);

  const t = I18N[lang];

  const filteredStocks = useMemo(() => {
    return data.stocks.filter((s) => {
      if (filter !== "all" && s.sentiment !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.ticker.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [filter, search, data.stocks]);

  return (
    <>
      <div data-theme={tweaks.theme} data-cardstyle={tweaks.cardStyle} data-density={tweaks.density} style={{ "--accent": tweaks.accent } as any}>
        <Nav
          lang={lang}
          theme={tweaks.theme}
          currentPage="news"
          onLangChange={setLang}
          onThemeChange={(theme) => setTweak("theme", theme)}
        />

        {/* HEADLINE TICKER */}
        <div className="headline-ticker">
          <div className="headline-track">
            {[...data.headlines, ...data.headlines].map((h, i) => (
              <span key={i} className="headline-item">
                <span className="headline-tick">{h.ticker}</span>
                {lang === "ko" ? h.ko : h.en}
                <span className="headline-time">· {h.time}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="container">
          {/* HERO */}
          <section className="hero" id="news">
            <div className="hero-eyebrow">{t.eyebrow(data.meta.index)}</div>
            <h1 className="hero-title">{t.hero_title}</h1>
            <p className="hero-sub">{t.hero_sub}</p>

            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "stretch" }}>
              <Calendar selected={selectedDate} onSelect={setSelectedDate} lang={lang} />
              <div className="hero-strip">
                <div className="strip-cell">
                  <div className="strip-label">{t.strip_news}</div>
                  <div className="strip-value strip-tone-neutral">
                    {data.meta.newsCount}<span className="unit">{lang === "ko" ? "건" : ""}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {lang === "ko" ? `전체 ${data.meta.totalScanned}종목 분석` : `across ${data.meta.totalScanned} tickers`}
                  </div>
                </div>
                <div className="strip-cell">
                  <div className="strip-label">{t.strip_bearish}</div>
                  <div className="strip-value strip-tone-up">{data.meta.bearish}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{lang === "ko" ? "▲ 매수 검토" : "▲ buy candidates"}</div>
                </div>
                <div className="strip-cell">
                  <div className="strip-label">{t.strip_bullish}</div>
                  <div className="strip-value strip-tone-down">{data.meta.bullish}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{lang === "ko" ? "▼ 매도 검토" : "▼ sell candidates"}</div>
                </div>
                <div className="strip-cell">
                  <div className="strip-label">{t.strip_neutral}</div>
                  <div className="strip-value strip-tone-neutral">{data.meta.neutral}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{lang === "ko" ? "관망" : "watch"}</div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION HEAD + FILTERS */}
          <section className="section">
            <div className="section-head">
              <div>
                <h2 className="section-title">{t.section_stocks}</h2>
                <p className="section-sub">{t.section_stocks_sub}</p>
              </div>
            </div>

            <div className="filter-bar">
              <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
                {t.filter_all} <span style={{ opacity: 0.6, fontFamily: "Inter" }}>{data.stocks.length}</span>
              </button>
              <button className={`chip ${filter === "bearish" ? "active" : ""}`} onClick={() => setFilter("bearish")}>
                <span className="chip-dot bearish"></span>{t.filter_bear} <span style={{ opacity: 0.6, fontFamily: "Inter" }}>{data.stocks.filter(s=>s.sentiment==="bearish").length}</span>
              </button>
              <button className={`chip ${filter === "bullish" ? "active" : ""}`} onClick={() => setFilter("bullish")}>
                <span className="chip-dot bullish"></span>{t.filter_bull} <span style={{ opacity: 0.6, fontFamily: "Inter" }}>{data.stocks.filter(s=>s.sentiment==="bullish").length}</span>
              </button>
              <button className={`chip ${filter === "neutral" ? "active" : ""}`} onClick={() => setFilter("neutral")}>
                <span className="chip-dot neutral"></span>{t.filter_neu} <span style={{ opacity: 0.6, fontFamily: "Inter" }}>{data.stocks.filter(s=>s.sentiment==="neutral").length}</span>
              </button>
              <div style={{ flex: 1 }} />
              <input
                className="search-input"
                placeholder={t.search_ph}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="stock-list">
              {loading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <div key={`skeleton-${i}`} className="stock-card" style={{ opacity: 0.5, pointerEvents: "none" }}>
                      <div className="rank-badge" style={{ background: "var(--border)", width: 40, height: 24 }}></div>
                      <div className="stock-main">
                        <div className="stock-head">
                          <span className="stock-ticker" style={{ background: "var(--border)", width: 60, height: 16, display: "inline-block", borderRadius: 4 }}></span>
                          <span className="stock-name" style={{ background: "var(--border)", width: 120, height: 16, display: "inline-block", borderRadius: 4, marginLeft: 12 }}></span>
                        </div>
                        <p className="stock-summary" style={{ background: "var(--border)", height: 40, borderRadius: 4, margin: "12px 0" }}></p>
                      </div>
                      <div className="stock-side" style={{ background: "var(--border)", width: 80, height: 40, borderRadius: 4 }}></div>
                    </div>
                  ))}
                </>
              ) : filteredStocks.length > 0 ? (
                filteredStocks.map((s) => (
                  <StockCard key={s.ticker} stock={s} lang={lang} t={t} onClick={setActiveStock} />
                ))
              ) : (
                <div style={{ padding: 60, textAlign: "center", color: "var(--ink-3)" }}>
                  {lang === "ko" ? "검색 결과가 없습니다." : "No results."}
                </div>
              )}
            </div>
          </section>

          {/* ABOUT teaser */}
          <section className="section" id="about">
            <div className="section-head">
              <div>
                <h2 className="section-title">{lang === "ko" ? "분석은 어떻게 동작하나요?" : "How it works"}</h2>
                <p className="section-sub">
                  {lang === "ko"
                    ? "여섯 가지 신호를 결합해 매일 시장 심리를 만들어냅니다."
                    : "Six independent signals combined into a daily sentiment view."}
                </p>
              </div>
            </div>
            <div className="about-grid">
              <div className="about-tile">
                <div className="about-tile-icon">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 14 L6 8 L9 11 L16 4"/><circle cx="6" cy="8" r="1.2" fill="currentColor"/><circle cx="9" cy="11" r="1.2" fill="currentColor"/></svg>
                </div>
                <h3>{lang === "ko" ? "5개 시계열 모델" : "5 time-series models"}</h3>
                <p>{lang === "ko" ? "XGBoost, PPO 강화학습, TimesFM, Chronos, Moirai가 각자 독립적으로 방향성을 예측합니다." : "XGBoost, PPO·RL, TimesFM, Chronos, and Moirai each predict direction independently."}</p>
              </div>
              <div className="about-tile">
                <div className="about-tile-icon">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 5 H15 M3 9 H12 M3 13 H10"/></svg>
                </div>
                <h3>{lang === "ko" ? "뉴스 + 소문" : "News + community"}</h3>
                <p>{lang === "ko" ? "주요 매체의 헤드라인과 투자 커뮤니티의 소문 신호(BUY/SELL/HOLD)를 LLM이 종합합니다." : "LLM synthesizes major headlines and community BUY/SELL/HOLD chatter."}</p>
              </div>
              <div className="about-tile">
                <div className="about-tile-icon">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="9" cy="9" r="6"/><path d="M9 5 V9 L11.5 11"/></svg>
                </div>
                <h3>{lang === "ko" ? "매일 자동 갱신" : "Daily refresh"}</h3>
                <p>{lang === "ko" ? "S&P 500 전 종목을 매일 장 마감 1시간 전 자동으로 스캔합니다." : "All S&P 500 names auto-scanned 1 hour before market close, every trading day."}</p>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="footer">
            <div className="footer-inner">
              <div>
                <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>분석 · Bunseok</div>
                <div style={{ fontSize: 12, color: "var(--ink-4)" }}>{lang === "ko" ? "매일 무료로 제공됩니다." : "Free, every trading day."}</div>
              </div>
              <p className="footer-disclaimer">{t.footer_disclaimer}</p>
            </div>
          </footer>
        </div>

        {/* DETAIL */}
        {activeStock && <DetailPanel stock={activeStock} lang={lang} t={t} onClose={() => setActiveStock(null)} />}

        {/* TWEAKS PANEL */}
        <TweaksPanel title="Tweaks">
          <TweakSection label={lang === "ko" ? "카드 스타일" : "Card style"}>
            <TweakRadio
              value={tweaks.cardStyle}
              onChange={(v) => setTweak("cardStyle", v as any)}
              options={[
                { value: "default", label: lang === "ko" ? "기본" : "Default" },
                { value: "minimal", label: lang === "ko" ? "미니멀" : "Minimal" },
                { value: "editorial", label: lang === "ko" ? "에디토리얼" : "Editorial" },
              ]}
            />
          </TweakSection>
          <TweakSection label={lang === "ko" ? "정보 밀도" : "Density"}>
            <TweakRadio
              value={tweaks.density}
              onChange={(v) => setTweak("density", v as any)}
              options={[
                { value: "comfy", label: lang === "ko" ? "여유" : "Comfy" },
                { value: "compact", label: lang === "ko" ? "조밀" : "Compact" },
              ]}
            />
          </TweakSection>
          <TweakSection label={lang === "ko" ? "테마" : "Theme"}>
            <TweakRadio
              value={tweaks.theme}
              onChange={(v) => setTweak("theme", v as any)}
              options={[
                { value: "light", label: lang === "ko" ? "라이트" : "Light" },
                { value: "dark", label: lang === "ko" ? "다크" : "Dark" },
              ]}
            />
          </TweakSection>
        </TweaksPanel>
      </div>
    </>
  );
}
