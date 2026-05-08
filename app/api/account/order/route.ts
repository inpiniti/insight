import { NextRequest, NextResponse } from "next/server";

const KIS_BASE_URL = "https://openapi.koreainvestment.com:9443";
const ORDER_PATH = "/uapi/overseas-stock/v1/trading/order";

function makeHeaders(appkey: string, appsecret: string, token: string) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    authorization: `Bearer ${token}`,
    appkey,
    appsecret,
    custtype: "P",
  };
}

function getTrId(exchange: string, orderType: "buy" | "sell"): string {
  // 실전 거래소별 TR ID
  const trIds: Record<string, Record<string, string>> = {
    NYS: { buy: "TTTT1002U", sell: "TTTT1006U" }, // 뉴욕
    NASD: { buy: "TTTT1002U", sell: "TTTT1006U" }, // 나스닥
    AMEX: { buy: "TTTT1002U", sell: "TTTT1006U" }, // 아멕스
    SEHK: { buy: "TTTS1002U", sell: "TTTS1001U" }, // 홍콩
    SHAA: { buy: "TTTS0202U", sell: "TTTS1005U" }, // 상해
    SZAA: { buy: "TTTS0305U", sell: "TTTS0304U" }, // 심천
    TKSE: { buy: "TTTS0308U", sell: "TTTS0307U" }, // 일본
  };

  return trIds[exchange]?.[orderType] || "TTTT1002U";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      accountNo,
      accountCode = "01",
      appkey,
      appsecret,
      token,
      symbol,
      exchange,
      orderType, // "buy" or "sell"
      quantity,
      price, // 주문 단가
    } = body;

    if (
      !accountNo ||
      !appkey ||
      !appsecret ||
      !token ||
      !symbol ||
      !exchange ||
      !orderType ||
      quantity === undefined ||
      quantity === null ||
      quantity <= 0 ||
      price === undefined ||
      price === null ||
      price <= 0
    ) {
      return NextResponse.json(
        {
          error: "필수 파라미터 누락 또는 값이 유효하지 않음",
          required: {
            accountNo: !!accountNo ? "✓" : "❌",
            accountCode: "✓",
            appkey: !!appkey ? "✓" : "❌",
            appsecret: !!appsecret ? "✓" : "❌",
            token: !!token ? "✓" : "❌",
            symbol: !!symbol ? "✓" : "❌",
            exchange: !!exchange ? "✓" : "❌",
            orderType: !!orderType ? "✓" : "❌",
            quantity: quantity && quantity > 0 ? `✓ (${quantity})` : `❌ (${quantity})`,
            price: price && price > 0 ? `✓ (${price})` : `❌ (${price})`,
          },
        },
        { status: 400 }
      );
    }

    const validOrderTypes = ["buy", "sell"];
    if (!validOrderTypes.includes(orderType)) {
      return NextResponse.json(
        { error: "orderType은 'buy' 또는 'sell'이어야 합니다" },
        { status: 400 }
      );
    }

    const trId = getTrId(exchange, orderType);

    const orderBody = {
      CANO: accountNo,
      ACNT_PRDT_CD: accountCode,
      OVRS_EXCG_CD: exchange,
      PDNO: symbol,
      ORD_QTY: String(quantity),
      OVRS_ORD_UNPR: String(price),
      ORD_SVR_DVSN_CD: "0",
      ORD_DVSN: "00", // 지정가
    };

    const url = `${KIS_BASE_URL}${ORDER_PATH}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...makeHeaders(appkey, appsecret, token),
        "tr_id": trId,
      },
      body: JSON.stringify(orderBody),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "KIS 주문 실패", status: response.status, detail: text },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.rt_cd !== "0") {
      return NextResponse.json(
        { error: "KIS 주문 API 오류", msg: data.msg1 || "주문 실패" },
        { status: 400 }
      );
    }

    const output = data.output || {};

    return NextResponse.json({
      success: true,
      orderType,
      symbol,
      exchange,
      quantity,
      price,
      orderNumber: output.ODNO || "",
      orderTime: output.ORD_TMD || "",
      orgNo: output.KRX_FWDG_ORD_ORGNO || "",
      raw: output,
    });
  } catch (error) {
    console.error("[KIS Order Error]", error);
    return NextResponse.json(
      { error: "주문 중 오류 발생", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
