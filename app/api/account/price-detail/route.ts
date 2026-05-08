import { NextRequest, NextResponse } from "next/server";

const KIS_BASE_URL = "https://openapi.koreainvestment.com:9443";
const PRICE_DETAIL_PATH = "/uapi/overseas-price/v1/quotations/price-detail";

function makeHeaders(appkey: string, appsecret: string, token: string) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    authorization: `Bearer ${token}`,
    appkey,
    appsecret,
    "tr_id": "HHDFS76200200",
    custtype: "P",
  };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const symbol = sp.get("symbol"); // AAPL, TSLA 등
    const exchange = sp.get("exchange"); // NYS, NASD, AMEX 등
    const appkey = sp.get("appkey");
    const appsecret = sp.get("appsecret");
    const token = sp.get("token");

    if (!symbol || !exchange || !appkey || !appsecret || !token) {
      return NextResponse.json(
        { error: "필수 파라미터 누락: symbol, exchange, appkey, appsecret, token" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      AUTH: "",
      EXCD: exchange,
      SYMB: symbol,
    });

    const url = `${KIS_BASE_URL}${PRICE_DETAIL_PATH}?${params}`;
    const response = await fetch(url, {
      method: "GET",
      headers: makeHeaders(appkey, appsecret, token),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "KIS 현재가 조회 실패", status: response.status, detail: text },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.rt_cd !== "0") {
      return NextResponse.json(
        { error: "KIS API 오류", msg: data.msg1 || "조회 실패" },
        { status: 400 }
      );
    }

    const output = data.output || {};

    return NextResponse.json({
      success: true,
      symbol,
      exchange,
      name: output.rsym || symbol,
      currency: output.curr || "USD",
      prices: {
        current: parseFloat(output.last || "0"), // 현재가
        open: parseFloat(output.open || "0"), // 시가
        high: parseFloat(output.high || "0"), // 고가
        low: parseFloat(output.low || "0"), // 저가
        previous: parseFloat(output.base || "0"), // 전일종가
      },
      tradingInfo: {
        unit: output.vnit || "1", // 매매단위
        tick: output.e_hogau || "0.01", // 호가단위
        volume: parseFloat(output.tvol || "0"),
        amount: parseFloat(output.tamt || "0"),
      },
      financials: {
        per: parseFloat(output.perx || "0"),
        pbr: parseFloat(output.pbrx || "0"),
        eps: parseFloat(output.epsx || "0"),
        bps: parseFloat(output.bpsx || "0"),
      },
      raw: output,
    });
  } catch (error) {
    console.error("[KIS Price Detail Error]", error);
    return NextResponse.json(
      { error: "현재가 조회 중 오류 발생", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
