export interface Stock {
  rank: number;
  ticker: string;
  name: string;
  sector: string;
  sentiment: "bearish" | "bullish" | "neutral";
  confidence: number;
  consensus: string;
  summary_ko: string;
  summary_en: string;
  rumor: "BUY" | "SELL" | "HOLD";
  rumor_note_ko: string;
  rumor_note_en: string;
  models: Record<string, "up" | "down" | "neutral">;
  price: number;
  changePct: number;
  newsItems: number;
  spark: number[];
}

export function sparkline(seed: number, len: number = 40, trend: number = 0): number[] {
  const arr: number[] = [];
  let v = 100;
  let s = seed;
  for (let i = 0; i < len; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = (s / 233280 - 0.5) * 4;
    v += r + trend;
    arr.push(v);
  }
  return arr;
}

// Backend API URL (환경변수로 설정, 기본값: 로컬)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// API에서 받은 데이터 타입
interface BackendMeta {
  status: string;
  meta: {
    analysis_date: string;
    news_count: number;
    bullish_count: number;
    bearish_count: number;
    neutral_count: number;
    headlines: Array<{ ticker: string; ko: string; en: string; time: string }>;
  } | null;
}

interface BackendImpactResponse {
  date: string;
  count: number;
  items: Stock[];
}

// 초기 로드 시 사용할 기본 데이터
export const APP_DATA = {
  meta: {
    date: "2026-04-30",
    totalScanned: 503,
    newsCount: 51,
    bearish: 19,
    bullish: 4,
    neutral: 480,
    index: "S&P 500",
  },
  headlines: [
    { ticker: "NVDA", ko: "NVIDIA GPU 공급 부족 해소, 가격 인상 가능성", en: "NVIDIA GPU shortage easing, price hike possible", time: "14:32" },
    { ticker: "MSFT", ko: "마이크로소프트 클라우드 성장 가속", en: "Microsoft cloud growth accelerates", time: "13:45" },
    { ticker: "AAPL", ko: "아이폰 15 판매 호조", en: "iPhone 15 sales strong", time: "12:20" },
    { ticker: "GOOGL", ko: "검색 광고 시장 회복", en: "Search ad market recovers", time: "11:50" },
    { ticker: "TSLA", ko: "테슬라 전기차 판매 감소", en: "Tesla EV sales decline", time: "10:30" },
  ],
  models: [
    { id: "xgb", name: "XGBoost", desc_ko: "시계열 강화학습 모델", desc_en: "Time-series reinforcement learning" },
    { id: "rl", name: "PPO·RL", desc_ko: "근처 정책 최적화", desc_en: "Proximal policy optimization" },
    { id: "times", name: "TimesFM", desc_ko: "구글 시계열 모델", desc_en: "Google's time-series model" },
    { id: "chrono", desc_ko: "Amazon Chronos", desc_en: "Amazon Chronos" },
    { id: "moirai", name: "Moirai", desc_ko: "메타 시계열", desc_en: "Meta time-series" },
  ],
  stocks: [
    {
      rank: 1,
      ticker: "NVDA",
      name: "NVIDIA",
      sector: "Information Tech",
      sentiment: "bearish",
      confidence: 90,
      consensus: "3/5",
      summary_ko: "AI 칩 시장 선두 주자로서 AI 관련 긍정적 뉴스에 가장 큰 수혜를 받을 것으로 예상됩니다.",
      summary_en: "As the AI chip market leader, NVIDIA is expected to benefit most from positive AI-related news flow.",
      rumor: "BUY",
      rumor_note_ko: "대부분의 커뮤니티에서 $NVDA에 대해 긍정적인 전망과 상승 추세를 언급하고 있습니다.",
      rumor_note_en: "Most community channels mention bullish outlook and upward momentum on $NVDA.",
      models: { xgb: "neutral", rl: "up", times: "down", chrono: "up", moirai: "up" },
      price: 1187.42,
      changePct: 2.41,
      newsItems: 5,
      spark: sparkline(12345, 40, 0.3),
    },
    {
      rank: 2,
      ticker: "BKR",
      name: "Baker Hughes",
      sector: "Energy",
      sentiment: "bearish",
      confidence: 80,
      consensus: "4/5",
      summary_ko: "유가 상승으로 인한 긍정적 전망",
      summary_en: "Positive outlook due to rising oil prices",
      rumor: "BUY",
      rumor_note_ko: "에너지 섹터 강세",
      rumor_note_en: "Energy sector strength",
      models: { xgb: "up", rl: "up", times: "neutral", chrono: "up", moirai: "neutral" },
      price: 38.71,
      changePct: 1.82,
      newsItems: 3,
      spark: sparkline(23456, 40, 0.2),
    },
    {
      rank: 3,
      ticker: "MSFT",
      name: "Microsoft",
      sector: "Information Tech",
      sentiment: "bearish",
      confidence: 85,
      consensus: "5/5",
      summary_ko: "클라우드 사업 성장 기조",
      summary_en: "Cloud business growth trajectory",
      rumor: "BUY",
      rumor_note_ko: "Azure 수익성 개선",
      rumor_note_en: "Azure profitability improvement",
      models: { xgb: "up", rl: "up", times: "up", chrono: "up", moirai: "neutral" },
      price: 411.38,
      changePct: 3.21,
      newsItems: 7,
      spark: sparkline(34567, 40, 0.35),
    },
    {
      rank: 4,
      ticker: "AAPL",
      name: "Apple",
      sector: "Information Tech",
      sentiment: "neutral",
      confidence: 65,
      consensus: "3/5",
      summary_ko: "아이폰 판매 안정적",
      summary_en: "iPhone sales stable",
      rumor: "HOLD",
      rumor_note_ko: "시장 기대치 부합",
      rumor_note_en: "Meeting market expectations",
      models: { xgb: "neutral", rl: "down", times: "neutral", chrono: "neutral", moirai: "down" },
      price: 192.55,
      changePct: 0.45,
      newsItems: 4,
      spark: sparkline(45678, 40, 0.1),
    },
    {
      rank: 5,
      ticker: "GOOGL",
      name: "Alphabet",
      sector: "Communication",
      sentiment: "bullish",
      confidence: 72,
      consensus: "2/5",
      summary_ko: "검색 광고 회복세",
      summary_en: "Search advertising recovery",
      rumor: "SELL",
      rumor_note_ko: "밸류에이션 우려",
      rumor_note_en: "Valuation concerns",
      models: { xgb: "neutral", rl: "neutral", times: "down", chrono: "down", moirai: "down" },
      price: 388.43,
      changePct: -1.23,
      newsItems: 5,
      spark: sparkline(56789, 40, -0.1),
    },
    {
      rank: 6,
      ticker: "META",
      name: "Meta Platforms",
      sector: "Communication",
      sentiment: "bearish",
      confidence: 78,
      consensus: "4/5",
      summary_ko: "AI 투자 성과 기대",
      summary_en: "AI investment returns expected",
      rumor: "BUY",
      rumor_note_ko: "광고 수익 개선",
      rumor_note_en: "Ad revenue improvement",
      models: { xgb: "up", rl: "up", times: "neutral", chrono: "up", moirai: "up" },
      price: 612.40,
      changePct: 4.12,
      newsItems: 6,
      spark: sparkline(67890, 40, 0.25),
    },
    {
      rank: 7,
      ticker: "AMZN",
      name: "Amazon",
      sector: "Consumer Disc.",
      sentiment: "neutral",
      confidence: 68,
      consensus: "3/5",
      summary_ko: "AWS 클라우드 사업 안정적",
      summary_en: "AWS cloud business stable",
      rumor: "HOLD",
      rumor_note_ko: "소매 사업 경쟁 심화",
      rumor_note_en: "Retail competition intensifying",
      models: { xgb: "neutral", rl: "neutral", times: "down", chrono: "neutral", moirai: "neutral" },
      price: 188.42,
      changePct: 0.78,
      newsItems: 5,
      spark: sparkline(78901, 40, 0.05),
    },
    {
      rank: 8,
      ticker: "JPM",
      name: "JPMorgan Chase",
      sector: "Financials",
      sentiment: "neutral",
      confidence: 70,
      consensus: "3/5",
      summary_ko: "금리 인상 기조 지속",
      summary_en: "Rate hiking cycle continues",
      rumor: "HOLD",
      rumor_note_ko: "금융권 실적 양호",
      rumor_note_en: "Financial sector earnings solid",
      models: { xgb: "neutral", rl: "up", times: "neutral", chrono: "neutral", moirai: "neutral" },
      price: 198.41,
      changePct: 1.15,
      newsItems: 4,
      spark: sparkline(89012, 40, 0.15),
    },
  ],
};

export default APP_DATA;

// ── Backend API 연동 함수 ──────────────────────────────────────────────────────

/**
 * Backend에서 특정 날짜의 S&P 500 영향도 데이터를 조회합니다.
 * 날짜가 지정되지 않으면 오늘 데이터를 조회합니다.
 */
export async function fetchSP500Impact(date?: string): Promise<Stock[]> {
  try {
    const dateParam = date ? `?date=${date}` : "";
    const response = await fetch(`${BACKEND_URL}/sp500/impact${dateParam}`);

    if (!response.ok) {
      console.error(`[API] sp500/impact 조회 실패: ${response.status}`);
      return APP_DATA.stocks; // 실패 시 기본 데이터 반환
    }

    const data: BackendImpactResponse = await response.json();

    // Backend 데이터를 Stock 타입으로 변환 (필드 매핑)
    return data.items.map((item: any) => ({
      rank: item.rank || 0,
      ticker: item.ticker || '',
      name: item.name || '',
      sector: item.sector || '',
      sentiment: (item.sentiment || item.direction || 'neutral') as "bearish" | "bullish" | "neutral",
      confidence: Math.round((item.confidence || 0) * 100),
      consensus: item.consensus || '',
      summary_ko: item.reason || item.summary_ko || '',
      summary_en: item.reason || item.summary_en || '',
      rumor: (item.rumors_signal || item.rumor || 'HOLD') as "BUY" | "SELL" | "HOLD",
      rumor_note_ko: item.rumors_reason || item.rumor_note_ko || '',
      rumor_note_en: item.rumors_reason || item.rumor_note_en || '',
      models: item.models || {
        xgb: item.xgb_signal ? (item.xgb_signal === 'up' ? 'up' : item.xgb_signal === 'down' ? 'down' : 'neutral') : 'neutral',
        rl: item.rl_signal ? (item.rl_signal === 'up' ? 'up' : item.rl_signal === 'down' ? 'down' : 'neutral') : 'neutral',
        times: item.timesfm_signal ? (item.timesfm_signal === 'up' ? 'up' : item.timesfm_signal === 'down' ? 'down' : 'neutral') : 'neutral',
        chrono: item.chronos_signal ? (item.chronos_signal === 'up' ? 'up' : item.chronos_signal === 'down' ? 'down' : 'neutral') : 'neutral',
        moirai: item.moirai_signal ? (item.moirai_signal === 'up' ? 'up' : item.moirai_signal === 'down' ? 'down' : 'neutral') : 'neutral',
      },
      price: item.price || 0,
      changePct: item.changePct || 0,
      newsItems: item.news_count || item.newsItems || 0,
      spark: item.spark || sparkline(Math.random() * 100000, 40, 0),
    })) as Stock[];
  } catch (error) {
    console.error("[API] sp500/impact 요청 실패:", error);
    return APP_DATA.stocks; // 실패 시 기본 데이터 반환
  }
}

/**
 * Backend에서 특정 날짜의 S&P 500 분석 메타데이터를 조회합니다.
 * 뉴스 수, 상승/하락 종목 수 등 요약 정보를 반환합니다.
 */
export async function fetchSP500Meta(date?: string): Promise<typeof APP_DATA.meta> {
  try {
    const dateParam = date ? `?date=${date}` : "";
    const response = await fetch(`${BACKEND_URL}/sp500/meta${dateParam}`);

    if (!response.ok) {
      console.error(`[API] sp500/meta 조회 실패: ${response.status}`);
      return APP_DATA.meta; // 실패 시 기본 데이터 반환
    }

    const data: BackendMeta = await response.json();

    if (data.status === "ok" && data.meta) {
      return {
        date: data.meta.analysis_date,
        totalScanned: 503, // 고정값 (S&P 500 총 종목 수)
        newsCount: data.meta.news_count,
        bearish: data.meta.bearish_count,
        bullish: data.meta.bullish_count,
        neutral: data.meta.neutral_count,
        index: "S&P 500",
      };
    }

    return APP_DATA.meta; // 실패 시 기본 데이터 반환
  } catch (error) {
    console.error("[API] sp500/meta 요청 실패:", error);
    return APP_DATA.meta; // 실패 시 기본 데이터 반환
  }
}
