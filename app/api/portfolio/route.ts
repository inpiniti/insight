import { NextResponse } from "next/server";
import PORTFOLIO_DATA from "@/lib/portfolio-data";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    // Backend에서 포트폴리오 데이터 조회
    try {
      const response = await fetch(`${BACKEND_URL}/portfolio`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const backendData = await response.json();

        // 필드 정규화 (불필요한 필드 제거)
        return NextResponse.json(
          {
            based_on_person: backendData.based_on_person || [],
            based_on_stock: (backendData.based_on_stock || []).map((item: any) => ({
              stock: item.stock,
              person: item.person,
              person_count: item.person_count,
              sum_ratio: item.sum_ratio,
              dcf_vs_market_cap_pct: item.dcf_vs_market_cap_pct,
              // bbLower, bbMiddle, bbUpper, rsi, sma, ai 등은 제거
            })),
          },
          {
            headers: {
              "Cache-Control": "public, max-age=3600",
            },
          }
        );
      }
    } catch (backendError) {
      console.warn("Backend portfolio fetch failed, falling back to local data:", backendError);
    }

    // Fallback: 로컬 PORTFOLIO_DATA 반환 (based_on_stock 형식으로)
    return NextResponse.json(
      {
        based_on_person: [],
        based_on_stock: PORTFOLIO_DATA.map((item) => ({
          stock: item.stock,
          person: [],
          person_count: item.person_count,
          sum_ratio: item.sum_ratio,
          dcf_vs_market_cap_pct: item.dcf_vs_market_cap_pct,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (error) {
    console.error("Portfolio API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio data" },
      { status: 500 }
    );
  }
}
