"use client";

import { useState, useMemo, useEffect } from "react";
import PORTFOLIO_DATA, { PortfolioStock } from "@/lib/portfolio-data";
import { usePortfolioStore } from "@/lib/portfolio-store";

interface PortfolioPageProps {
  lang: "ko" | "en";
}

export function PortfolioPage({ lang }: PortfolioPageProps) {
  const count = usePortfolioStore((state) => state.count);
  const sortKey = usePortfolioStore((state) => state.sortKey);
  const weightBasis = usePortfolioStore((state) => state.weightBasis);
  const setCount = usePortfolioStore((state) => state.setCount);
  const setSortKey = usePortfolioStore((state) => state.setSortKey);
  const setWeightBasis = usePortfolioStore((state) => state.setWeightBasis);

  const [pinned, setPinned] = useState(new Set<string>());
  const [search, setSearch] = useState("");
  const [data, setData] = useState({
    based_on_person: [],
    based_on_stock: PORTFOLIO_DATA,
  });
  const [loading, setLoading] = useState(true);

  const T = useMemo(() => lang === "ko" ? {
    title: "현명한 투자자 포트폴리오",
    sub: "유명 투자자 80명의 보유 데이터를 종합해 비중 가이드를 제안합니다. 매수 추천이 아닌 시각화 도구입니다.",
    countLabel: "조회 종목 수",
    sortLabel: "정렬 기준",
    sort_pc: "투자자 수 (person_count)",
    sort_sr: "투자 비율 합 (sum_ratio)",
    weightLabel: "비중 산정 기준",
    w_sr: "투자 비율 합",
    w_pc: "투자자 수",
    weight_help: "선택한 종목들의 가중치를 자동 정규화하여 100%로 환산합니다.",
    selected: "선택 종목",
    rank: "#",
    ticker: "티커",
    name: "종목",
    sector: "섹터",
    price: "현재가",
    exchange: "거래소",
    pc: "투자자",
    sr: "비율 합",
    dcf: "DCF 저평가",
    weight: "제안 비중",
    search_ph: "티커 검색…",
    note: "이 비중은 투자자 데이터 기반의 참고 수치입니다. 본인의 투자 성향에 맞게 조정하세요.",
    summary_total: (n: number) => `상위 ${n}개 종목`,
    nodata: "검색 결과가 없습니다.",
    pinned_only: "선택만 보기",
    clear: "초기화",
  } : {
    title: "Wise-investor Portfolio",
    sub: "Aggregates 80 well-known investors' holdings to suggest an allocation. A visualization tool, not a buy recommendation.",
    countLabel: "How many tickers",
    sortLabel: "Sort by",
    sort_pc: "Investors holding",
    sort_sr: "Sum of ratios",
    weightLabel: "Weight basis",
    w_sr: "Sum of ratios",
    w_pc: "Investors holding",
    weight_help: "Weights are normalized so the selected basket sums to 100%.",
    selected: "Selected",
    rank: "#",
    ticker: "Ticker",
    name: "Name",
    sector: "Sector",
    price: "Price",
    exchange: "Exchange",
    pc: "Investors",
    sr: "Σ ratio",
    dcf: "DCF discount",
    weight: "Weight",
    search_ph: "Search ticker…",
    note: "These weights are reference numbers from investor data. Adjust to your own profile.",
    summary_total: (n: number) => `Top ${n}`,
    nodata: "No results.",
    pinned_only: "Show pinned only",
    clear: "Reset",
  }, [lang]);

  // API에서 포트폴리오 데이터 조회
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/portfolio");
        if (response.ok) {
          const result = await response.json();
          const normalizedStocks = (result.based_on_stock || []).map((stock: any) => ({
            stock: stock.stock || "",
            name: stock.name || stock.stock || "",
            sector: stock.sector || "—",
            logo: stock.logo || stock.stock?.charAt(0) || "",
            person: stock.person || [],
            person_count: typeof stock.person_count === "string"
              ? parseInt(stock.person_count, 10)
              : stock.person_count || 0,
            sum_ratio: (() => {
              if (typeof stock.sum_ratio === "string") {
                return parseFloat(stock.sum_ratio.replace("%", "")) || 0;
              }
              return typeof stock.sum_ratio === "number" ? stock.sum_ratio : 0;
            })(),
            avg_ratio: (() => {
              if (typeof stock.avg_ratio === "string") {
                return parseFloat(stock.avg_ratio.replace("%", "")) || 0;
              }
              return typeof stock.avg_ratio === "number" ? stock.avg_ratio : 0;
            })(),
            dcf_vs_market_cap_pct: (() => {
              if (typeof stock.dcf_vs_market_cap_pct === "string") {
                return parseFloat(stock.dcf_vs_market_cap_pct.replace("%", "")) || 0;
              }
              return typeof stock.dcf_vs_market_cap_pct === "number" ? stock.dcf_vs_market_cap_pct : 0;
            })(),
            close: typeof stock.close === "number" ? stock.close : null,
            exchange: stock.exchange || null,
          }));
          setData((prevData) => ({
            ...prevData,
            based_on_person: result.based_on_person || [],
            based_on_stock: normalizedStocks,
          }));
        }
      } catch (error) {
        console.error("Failed to load portfolio data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const sortedAll = useMemo(() => {
    const arr = [...data.based_on_stock];
    arr.sort((a, b) => {
      if (sortKey === "person_count") return b.person_count - a.person_count;
      if (sortKey === "sum_ratio") return b.sum_ratio - a.sum_ratio;
      return 0;
    });
    return arr;
  }, [data.based_on_stock, sortKey]);

  const top = useMemo(() => {
    let basket = sortedAll.slice(0, count);
    if (pinned.size > 0) {
      const pinnedRows = sortedAll.filter((r) => pinned.has(r.stock));
      basket = [...pinnedRows, ...basket.filter((r) => !pinned.has(r.stock))].slice(0, Math.max(count, pinnedRows.length));
    }
    return basket;
  }, [sortedAll, count, pinned]);

  const weighted = useMemo(() => {
    const valOf = (r: PortfolioStock) =>
      weightBasis === "sum_ratio" ? r.sum_ratio :
      r.person_count;
    const total = top.reduce((acc, r) => acc + valOf(r), 0) || 1;
    return top.map((r) => ({ ...r, weight: (valOf(r) / total) * 100 }));
  }, [top, weightBasis]);

  const filteredView = useMemo(() => {
    if (!search) return weighted;
    const q = search.toLowerCase();
    return weighted.filter((r) => r.stock.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }, [weighted, search]);

  const palette = [
    "#2f6dff", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
    "#ec4899", "#0ea5e9", "#14b8a6", "#a16207", "#6366f1",
    "#f97316", "#84cc16", "#06b6d4", "#d946ef", "#dc2626",
    "#22c55e", "#3b82f6", "#eab308", "#7c3aed", "#0891b2",
  ];

  const togglePin = (stock: string) => {
    const next = new Set(pinned);
    if (next.has(stock)) next.delete(stock); else next.add(stock);
    setPinned(next);
  };

  return (
    <div className="container">
      <section className="hero" style={{ paddingTop: 56, paddingBottom: 16 }}>
        <div className="hero-eyebrow">{lang === "ko" ? "포트폴리오 가이드" : "Allocation guide"}</div>
        <h1 className="hero-title">{T.title}</h1>
        <p className="hero-sub">{T.sub}</p>
      </section>

      <section className="pf-controls">
        <div className="pf-control">
          <div className="pf-control-head">
            <label className="pf-label">{T.countLabel}</label>
            <span className="pf-count-num num">{count}</span>
          </div>
          <input
            type="range" min="1" max="20" step="1"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="pf-slider"
            style={{ accentColor: "var(--accent)" }}
          />
          <div className="pf-slider-ticks">
            <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span>
          </div>
        </div>

        <div className="pf-control">
          <div className="pf-control-head">
            <label className="pf-label">{T.sortLabel}</label>
          </div>
          <div className="pf-seg">
            <button className={sortKey === "person_count" ? "active" : ""} onClick={() => setSortKey("person_count")}>{T.sort_pc}</button>
            <button className={sortKey === "sum_ratio" ? "active" : ""} onClick={() => setSortKey("sum_ratio")}>{T.sort_sr}</button>
          </div>
        </div>

        <div className="pf-control">
          <div className="pf-control-head">
            <label className="pf-label">{T.weightLabel}</label>
          </div>
          <div className="pf-seg">
            <button className={weightBasis === "sum_ratio" ? "active" : ""} onClick={() => setWeightBasis("sum_ratio")}>{T.w_sr}</button>
            <button className={weightBasis === "person_count" ? "active" : ""} onClick={() => setWeightBasis("person_count")}>{T.w_pc}</button>
          </div>
          <div className="pf-help">{T.weight_help}</div>
        </div>
      </section>

      <section className="pf-weights">
        <div className="pf-weights-head">
          <div>
            <div className="pf-section-title">{T.selected} · <span className="num">{weighted.length}</span></div>
            <div className="pf-section-sub">{T.note}</div>
          </div>
        </div>

        <div className="pf-stacked-bar">
          {weighted.map((r, i) => {
            const safeWeight = typeof r.weight === "number" ? r.weight : 0;
            return (
              <div
                key={r.stock}
                className="pf-stack-seg"
                style={{ width: `${safeWeight}%`, background: palette[i % palette.length] }}
                title={`${r.stock} ${safeWeight.toFixed(1)}%`}
              >
                {safeWeight > 6 && <span>{r.stock}</span>}
              </div>
            );
          })}
        </div>

        <div className="pf-legend">
          {weighted.map((r, i) => {
            const safeWeight = typeof r.weight === "number" ? r.weight : 0;
            return (
              <div key={r.stock} className="pf-legend-item">
                <span className="pf-legend-dot" style={{ background: palette[i % palette.length] }}></span>
                <span className="pf-legend-tick num">{r.stock}</span>
                <span className="pf-legend-pct num">{safeWeight.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pf-table-wrap">
        <div className="pf-table-toolbar">
          <input
            className="search-input"
            placeholder={T.search_ph}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {pinned.size > 0 && (
            <button className="chip" onClick={() => setPinned(new Set())}>
              {T.clear} · {pinned.size}
            </button>
          )}
        </div>

        <div className="pf-table">
          <div className="pf-row pf-row-head">
            <div className="pf-c-rank">{T.rank}</div>
            <div className="pf-c-tk">{T.ticker}</div>
            <div className="pf-c-name">{T.name}</div>
            <div className="pf-c-sec">{T.sector}</div>
            <div className="pf-c-num">{T.price}</div>
            <div className="pf-c-sec">{T.exchange}</div>
            <div className="pf-c-num">{T.pc}</div>
            <div className="pf-c-num">{T.sr}</div>
            <div className="pf-c-num">{T.dcf}</div>
            <div className="pf-c-w">{T.weight}</div>
          </div>
          {filteredView.length > 0 ? filteredView.map((r, i) => {
            const realIdx = weighted.findIndex(x => x.stock === r.stock);
            const safeWeight = typeof r.weight === "number" ? r.weight : 0;
            const safeSumRatio = typeof r.sum_ratio === "number" ? r.sum_ratio : 0;
            const safeDcf = typeof r.dcf_vs_market_cap_pct === "number" ? r.dcf_vs_market_cap_pct : 0;
            const safeClose = typeof r.close === "number" ? r.close : null;
            const safeExchange = r.exchange || "—";
            return (
              <div key={r.stock} className="pf-row">
                <div className="pf-c-rank num">{i + 1}</div>
                <div className="pf-c-tk num">
                  <span className="pf-logo" style={{ background: palette[realIdx % palette.length] }}>{r.logo}</span>
                  {r.stock}
                </div>
                <div className="pf-c-name">{r.name}</div>
                <div className="pf-c-sec"><span className="sector-badge">{r.sector}</span></div>
                <div className="pf-c-num num">{safeClose !== null ? `$${safeClose.toFixed(2)}` : "—"}</div>
                <div className="pf-c-sec">{safeExchange}</div>
                <div className="pf-c-num num">{r.person_count}</div>
                <div className="pf-c-num num">{safeSumRatio.toFixed(1)}%</div>
                <div className="pf-c-num num" style={{ color: safeDcf >= 100 ? "var(--up)" : "var(--ink-2)" }}>
                  {safeDcf.toFixed(0)}%
                </div>
                <div className="pf-c-w">
                  <div className="pf-w-bar-wrap">
                    <div className="pf-w-bar" style={{ width: `${safeWeight}%`, background: palette[realIdx % palette.length] }}></div>
                  </div>
                  <span className="pf-w-num num">{safeWeight.toFixed(1)}%</span>
                </div>
              </div>
            );
          }) : (
            <div className="pf-empty">{T.nodata}</div>
          )}
        </div>
      </section>
    </div>
  );
}
