import { NextRequest, NextResponse } from "next/server";

const KIS_BASE_URL = "https://openapi.koreainvestment.com:9443";
const BALANCE_PATH = "/uapi/overseas-stock/v1/trading/inquire-present-balance";

function makeHeaders(appkey: string, appsecret: string, token: string) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    authorization: `Bearer ${token}`,
    appkey,
    appsecret,
    tr_id: "CTRP6504R",
    custtype: "P",
  };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const accountNo = sp.get("accountNo");
    const accountCode = sp.get("accountCode") ?? "01";
    const appkey = sp.get("appkey");
    const appsecret = sp.get("appsecret");
    const token = sp.get("token");

    if (!accountNo || !appkey || !appsecret || !token) {
      return NextResponse.json(
        { error: "필수 파라미터 누락: accountNo, accountCode, appkey, appsecret, token" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      CANO: accountNo,
      ACNT_PRDT_CD: accountCode,
      WCRC_FRCR_DVSN_CD: "01",
      NATN_CD: "000",
      TR_MKET_CD: "00",
      INQR_DVSN_CD: "00",
    });

    const url = `${KIS_BASE_URL}${BALANCE_PATH}?${params}`;
    const response = await fetch(url, {
      method: "GET",
      headers: makeHeaders(appkey, appsecret, token),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "KIS 잔고 조회 실패", status: response.status, detail: text },
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

    const holdings = data.output1 ?? [];
    const output2: any[] = data.output2 ?? [];
    const output3 = data.output3 ?? {};

    const krwRow = output2.find((r: any) => r.crcy_cd === "KRW");
    const usdRow = output2.find((r: any) => r.crcy_cd === "USD");

    return NextResponse.json({
      success: true,
      holdings,
      krw: {
        currency: "KRW",
        balance: parseFloat(output3.evlu_amt_smtl || "0"),
        totalAsset: parseFloat(output3.tot_asst_amt || "0"),
        availableBalance: parseFloat(output3.wdrw_psbl_tot_amt || "0"),
      },
      usd: usdRow
        ? {
            currency: "USD",
            balance: parseFloat(usdRow.frcr_dncl_amt_2 || "0"),
            availableBalance: parseFloat(usdRow.frcr_drwg_psbl_amt_1 || "0"),
          }
        : null,
      summary: output3,
    });
  } catch (error) {
    console.error("[KIS Balance Error]", error);
    return NextResponse.json(
      { error: "잔고 조회 중 오류 발생", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
