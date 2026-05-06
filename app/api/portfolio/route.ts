import { NextResponse } from "next/server";
import PORTFOLIO_DATA from "@/lib/portfolio-data";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    console.log(`[Portfolio] Backend URL: ${BACKEND_URL}`);

    // Backend에서 포트폴리오 데이터 조회
    try {
      const response = await fetch(`${BACKEND_URL}/portfolio`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // HuggingFace SSL 문제 해결
        ...(process.env.NODE_ENV === "development" && {
          // 개발 환경에서는 timeout 증가
          signal: AbortSignal.timeout(15000),
        }),
      });

      console.log(`[Portfolio] Backend response status: ${response.status}`);

      if (response.ok) {
        const backendData = await response.json();
        console.log(`[Portfolio] Backend returned: ${JSON.stringify(backendData).slice(0, 200)}`);

        // Backend 응답 구조: { based_on_person, based_on_stock, meta }
        // 필드 정규화 (불필요한 필드 제거)
        const result = {
          based_on_person: backendData.based_on_person || [],
          based_on_stock: (backendData.based_on_stock || []).map((item: any) => ({
            stock: item.stock,
            person: item.person || [],
            person_count: item.person_count || 0,
            sum_ratio: item.sum_ratio || 0,
            dcf_vs_market_cap_pct: item.dcf_vs_market_cap_pct,
          })),
        };

        console.log(`[Portfolio] Returning backend data: ${result.based_on_stock.length} stocks`);

        return NextResponse.json(result, {
          headers: {
            "Cache-Control": "public, max-age=300",
          },
        });
      } else {
        console.warn(`[Portfolio] Backend returned ${response.status}`);
      }
    } catch (backendError) {
      console.warn("[Portfolio] Backend fetch failed, falling back to local data:", backendError);
    }

    // Fallback: 로컬 PORTFOLIO_DATA 반환 (based_on_stock 형식으로)
    console.log("[Portfolio] Using local fallback data");
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
