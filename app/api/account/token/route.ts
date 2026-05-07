import { NextRequest, NextResponse } from "next/server";

const KIS_BASE_URL = "https://openapi.koreainvestment.com:9443";

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appkey, appsecret } = body;

    if (!appkey || !appsecret) {
      return NextResponse.json(
        { error: "appkey와 appsecret은 필수입니다" },
        { status: 400 }
      );
    }

    const response = await fetchWithTimeout(
      `${KIS_BASE_URL}/oauth2/tokenP`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          grant_type: "client_credentials",
          appkey,
          appsecret,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "KIS 토큰 발급 실패", detail: text },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.access_token) {
      return NextResponse.json(
        { error: "KIS API 오류", msg: data.msg1 || "토큰 없음" },
        { status: 400 }
      );
    }

    const expiresIn = parseInt(data.expires_in, 10) || 86400;
    const expiresAt = Date.now() + expiresIn * 1000;

    return NextResponse.json({
      access_token: data.access_token,
      expires_in: expiresIn,
      expiresAt,
    });
  } catch (error) {
    console.error("[KIS Token Error]", error);
    return NextResponse.json(
      { error: "토큰 발급 중 오류 발생", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
