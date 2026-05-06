import { NextResponse } from "next/server";
import PORTFOLIO_DATA from "@/lib/portfolio-data";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// AbortController 타임아웃 헬퍼
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  try {
    console.log(`[Portfolio] Fetching from: ${BACKEND_URL}/portfolio`);

    // Backend에서 포트폴리오 데이터 조회
    const response = await fetchWithTimeout(`${BACKEND_URL}/portfolio`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }, 30000); // 30초 timeout

    console.log(`[Portfolio] Response status: ${response.status}`);

    if (response.ok) {
      const backendData = await response.json();
      console.log(`[Portfolio] Got data with ${backendData.based_on_stock?.length || 0} stocks`);

      // Backend 응답 구조: { based_on_person, based_on_stock, meta }
      const result = {
        based_on_person: backendData.based_on_person || [],
        based_on_stock: (backendData.based_on_stock || []).map((item: any) => ({
          stock: item.stock,
          person: item.person || [],
          person_count: item.person_count || 0,
          sum_ratio: item.sum_ratio || 0,
          avg_ratio: item.avg_ratio,
          dcf_vs_market_cap_pct: item.dcf_vs_market_cap_pct,
          close: item.close || null,
          exchange: item.exchange || null,
        })),
        meta: backendData.meta,
      };

      return NextResponse.json(result, {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    }

    console.warn(`[Portfolio] Backend status ${response.status}, using fallback`);
  } catch (error) {
    console.warn("[Portfolio] Backend error:", error instanceof Error ? error.message : error);
  }

  // Fallback: 로컬 PORTFOLIO_DATA 반환
  console.log("[Portfolio] Using local fallback data");
  return NextResponse.json(
    {
      based_on_person: [],
      based_on_stock: PORTFOLIO_DATA.map((item) => ({
        stock: item.stock,
        person: [],
        person_count: item.person_count,
        sum_ratio: item.sum_ratio,
        avg_ratio: item.avg_ratio,
        dcf_vs_market_cap_pct: item.dcf_vs_market_cap_pct,
        close: item.close,
        exchange: item.exchange,
      })),
      meta: { source: "local" },
    },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
