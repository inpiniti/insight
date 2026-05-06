"use client";

import { useState, useMemo } from "react";

interface CalendarProps {
  selected: string;
  onSelect: (date: string) => void;
  lang: "ko" | "en";
}

export function Calendar({ selected, onSelect, lang }: CalendarProps) {
  const [view, setView] = useState({ y: 2026, m: 4 });
  const dowKo = ["일", "월", "화", "수", "목", "금", "토"];
  const dowEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dow = lang === "ko" ? dowKo : dowEn;
  const monthKo = `${view.m}월`;
  const monthEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][view.m - 1];

  const cells = useMemo(() => {
    const firstDow = new Date(view.y, view.m - 1, 1).getDay();
    const daysInMonth = new Date(view.y, view.m, 0).getDate();
    const prevMonthDays = new Date(view.y, view.m - 1, 0).getDate();
    const result = [];
    for (let i = firstDow - 1; i >= 0; i--) {
      result.push({ day: prevMonthDays - i, muted: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ day: d, date: `${view.y}-${String(view.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`, hasData: d <= 30 });
    }
    while (result.length < 42) {
      result.push({ day: result.length - daysInMonth - firstDow + 1, muted: true });
    }
    return result;
  }, [view.y, view.m]);
  const navMonth = (delta: number) => {
    let nm = view.m + delta, ny = view.y;
    if (nm < 1) { nm = 12; ny--; }
    if (nm > 12) { nm = 1; ny++; }
    setView({ y: ny, m: nm });
  };
  return (
    <div className="cal-wrap">
      <div className="cal-head">
        <div className="cal-nav">
          <button onClick={() => navMonth(-1)} aria-label="prev">
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 3 L5 7 L9 11" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div>{lang === "ko" ? `${view.y}년 ${monthKo}` : `${monthEn} ${view.y}`}</div>
        <div className="cal-nav">
          <button onClick={() => navMonth(1)} aria-label="next">
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5 3 L9 7 L5 11" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
      <div className="cal-grid">
        {dow.map((d, i) => (
          <div key={d} className={`cal-dow ${i === 0 ? "sun" : i === 6 ? "sat" : ""}`}>{d}</div>
        ))}
        {cells.map((c, i) => {
          const isSelected = "date" in c && c.date === selected;
          const isToday = "date" in c && c.date === "2026-04-30";
          const dateStr = "date" in c ? c.date : undefined;
          return (
            <div
              key={i}
              className={`cal-day ${c.muted ? "muted" : ""} ${"hasData" in c && c.hasData ? "has-data" : ""} ${isSelected ? "selected" : ""} ${isToday && !isSelected ? "today" : ""}`}
              role={!c.muted ? "button" : undefined}
              tabIndex={!c.muted ? 0 : undefined}
              aria-label={dateStr ? new Date(dateStr).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US") : undefined}
              aria-pressed={isSelected}
              onClick={() => !c.muted && "date" in c && c.date && onSelect(c.date)}
              onKeyDown={(e) => !c.muted && "date" in c && c.date && e.key === 'Enter' && onSelect(c.date)}
            >
              {c.day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
