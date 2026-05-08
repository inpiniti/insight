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

async function fetchBalance(accountNo: string, accountCode: string, currencyDivision: string, appkey: string, appsecret: string, token: string) {
  const params = new URLSearchParams({
    CANO: accountNo,
    ACNT_PRDT_CD: accountCode,
    WCRC_FRCR_DVSN_CD: currencyDivision, // "01" = 원화, "02" = 외화
    NATN_CD: "840", // 미국
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
    throw new Error(`KIS Balance API 실패 (${currencyDivision}): ${response.status} ${text}`);
  }

  const data = await response.json();
  if (data.rt_cd !== "0") {
    throw new Error(`KIS API 오류 (${currencyDivision}): ${data.msg1 || "조회 실패"}`);
  }

  return data;
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

    // 원화 조회
    const krwData = await fetchBalance(accountNo, accountCode, "01", appkey, appsecret, token);
    const krwOutput2: any[] = krwData.output2 ?? [];
    const krwOutput3 = krwData.output3 ?? {};
    const krwRow = krwOutput2.find((r: any) => r.crcy_cd === "KRW");

    // 외화 조회
    const frcData = await fetchBalance(accountNo, accountCode, "02", appkey, appsecret, token);
    const frcOutput2: any[] = frcData.output2 ?? [];
    const frcOutput3 = frcData.output3 ?? {};
    const usdRow = frcOutput2.find((r: any) => r.crcy_cd === "USD");

    // 원화 잔고
    const krwTotalAsset = parseFloat(krwOutput3.tot_asst_amt || "0");
    const krwEvaluationAmount = parseFloat(krwOutput3.evlu_amt_smtl || "0");
    const krwDepositAmount = krwTotalAsset - krwEvaluationAmount;

    // 외화 잔고
    const usdTotalAsset = parseFloat(frcOutput3.tot_asst_amt || "0");
    const usdEvaluationAmount = parseFloat(frcOutput3.evlu_amt_smtl || "0");
    const usdDepositAmount = usdTotalAsset - usdEvaluationAmount;

    return NextResponse.json({
      success: true,
      holdings: krwData.output1 ?? [],
      krw: {
        currency: "KRW",
        totalAsset: krwTotalAsset,
        purchaseAmount: parseFloat(krwOutput3.pchs_amt_smtl || "0"),
        evaluationAmount: krwEvaluationAmount,
        depositAmount: krwDepositAmount,
        totalDeposit: krwRow?.frcr_dncl_amt_2 || krwDepositAmount,
        evaluationPnl: parseFloat(krwOutput3.evlu_pfls_amt_smtl || "0"),
        evaluationRate: parseFloat(krwOutput3.evlu_erng_rt1 || "0"),
        availableBalance: parseFloat(krwRow?.frcr_drwg_psbl_amt_1 || krwOutput3.wdrw_psbl_tot_amt || "0"),
      },
      usd: {
        currency: "USD",
        totalAsset: usdTotalAsset,
        depositAmount: usdDepositAmount,
        totalDeposit: usdRow?.frcr_dncl_amt_2 || usdDepositAmount,
        availableBalance: parseFloat(usdRow?.frcr_drwg_psbl_amt_1 || "0"),
        purchaseAmount: parseFloat(usdRow?.frcr_buy_amt_smtl || "0"),
        evaluationAmount: usdEvaluationAmount,
        evaluationPnl: parseFloat(frcOutput3.evlu_pfls_amt_smtl || "0"),
      },
      krwRaw: krwOutput3,
      usdRaw: frcOutput3,
    });
  } catch (error) {
    console.error("[KIS Balance Error]", error);
    return NextResponse.json(
      { error: "잔고 조회 중 오류 발생", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
