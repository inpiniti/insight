"use client";

interface SparklineProps {
  data: number[];
  tone: "bullish" | "bearish" | "neutral";
  height?: number;
  showArea?: boolean;
  ticker?: string;
}

export function Sparkline({ data, tone, height = 56, showArea = true, ticker }: SparklineProps) {
  const w = 100, h = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * h * 0.85 - h * 0.075,
  ] as [number, number]);
  const path = pts.map(([x, y], i) => (i === 0 ? `M${x} ${y}` : `L${x} ${y}`)).join(" ");
  const area = `${path} L${w} ${h} L0 ${h} Z`;
  const stroke =
    tone === "bullish" ? "var(--down)" : tone === "bearish" ? "var(--up)" : "var(--ink-3)";
  const fill =
    tone === "bullish" ? "var(--down-soft)" : tone === "bearish" ? "var(--up-soft)" : "var(--neutral-soft)";
  return (
    <div className="spark-wrap" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={ticker ? `${ticker} sparkline` : "price sparkline"}>
        {showArea && <path d={area} fill={fill} opacity="0.6" />}
        <path d={path} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

interface DetailChartProps {
  data: number[];
  tone: "bullish" | "bearish" | "neutral";
  ticker?: string;
}

export function DetailChart({ data, tone, ticker }: DetailChartProps) {
  const w = 600, h = 180;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * h * 0.8 - h * 0.1,
  ] as [number, number]);
  const path = pts.map(([x, y], i) => (i === 0 ? `M${x} ${y}` : `L${x} ${y}`)).join(" ");
  const area = `${path} L${w} ${h} L0 ${h} Z`;
  const stroke =
    tone === "bullish" ? "var(--down)" : tone === "bearish" ? "var(--up)" : "var(--ink-3)";
  const fill =
    tone === "bullish" ? "var(--down-soft)" : tone === "bearish" ? "var(--up-soft)" : "var(--neutral-soft)";
  return (
    <div className="detail-chart">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={ticker ? `${ticker} 30-day chart` : "30-day chart"}>
        {[0.25, 0.5, 0.75].map((p, i) => (
          <line key={i} x1="0" x2={w} y1={h * p} y2={h * p} stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill={fill} opacity="0.6" />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill={stroke} />
      </svg>
    </div>
  );
}
