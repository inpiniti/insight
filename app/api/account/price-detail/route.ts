import { NextRequest, NextResponse } from 'next/server';

const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443';
const PRICE_DETAIL_PATH = '/uapi/overseas-price/v1/quotations/price-detail';

function makeHeaders(appkey: string, appsecret: string, token: string) {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    authorization: `Bearer ${token}`,
    appkey,
    appsecret,
    tr_id: 'HHDFS76200200',
  };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const symbol = sp.get('symbol'); // AAPL, TSLA 등
    const exchange = sp.get('exchange'); // NYS, NASD, AMEX 등
    const appkey = sp.get('appkey');
    const appsecret = sp.get('appsecret');
    const token = sp.get('token');

    if (!symbol || !exchange || !appkey || !appsecret || !token) {
      return NextResponse.json(
        {
          error:
            '필수 파라미터 누락: symbol, exchange, appkey, appsecret, token',
        },
        { status: 400 },
      );
    }

    const params = new URLSearchParams({
      AUTH: '', // 필수 파라미터지만 Description 없음, 빈 문자열로 시도
      EXCD: exchange,
      SYMB: symbol,
    });

    const headers = makeHeaders(appkey, appsecret, token);
    const url = `${KIS_BASE_URL}${PRICE_DETAIL_PATH}?${params}`;

    console.log('[KIS Price Detail Request] =====================');
    console.log('[KIS Price Detail Request] URL:', url);
    console.log('[KIS Price Detail Request] Headers:', {
      'Content-Type': headers['Content-Type'],
      authorization: headers.authorization ? 'Bearer ***' : 'MISSING',
      appkey: appkey ? '***' : 'MISSING',
      appsecret: appsecret ? '***' : 'MISSING',
      tr_id: headers.tr_id,
      custtype: headers.custtype,
    });
    console.log('[KIS Price Detail Request] Params:', {
      EXCD: exchange,
      SYMB: symbol,
    });
    console.log('[KIS Price Detail Request] =====================');

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        {
          error: 'KIS 현재가 조회 실패',
          status: response.status,
          detail: text,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    console.log('[KIS Price Detail] data:', data);

    if (data.rt_cd !== '0') {
      console.error('[KIS Price Detail Error]', data);
      return NextResponse.json(
        {
          error: 'KIS API 오류',
          msg: data.msg1 || '조회 실패',
          rt_cd: data.rt_cd,
        },
        { status: 400 },
      );
    }

    const output = data.output || {};

    console.log('[KIS Price Detail] =====================');
    console.log('[KIS Price Detail] Symbol:', symbol);
    console.log('[KIS Price Detail] Exchange:', exchange);
    console.log('[KIS Price Detail] Full response RT_CD:', data.rt_cd);
    console.log('[KIS Price Detail] Full response MSG1:', data.msg1);
    console.log('[KIS Price Detail] Output keys:', Object.keys(output));
    console.log('[KIS Price Detail] Full output object:');
    console.log(JSON.stringify(output, null, 2));
    console.log('[KIS Price Detail] Last (현재가):', output.last);
    console.log('[KIS Price Detail] Open (시가):', output.open);
    console.log('[KIS Price Detail] High (고가):', output.high);
    console.log('[KIS Price Detail] Low (저가):', output.low);
    console.log('[KIS Price Detail] Base (전일종가):', output.base);
    console.log('[KIS Price Detail] =====================');

    // output이 비어있으면 에러 반환
    if (!output || Object.keys(output).length === 0) {
      console.error('[KIS Price Detail Error] Empty output from KIS', {
        symbol,
        exchange,
      });
      return NextResponse.json(
        {
          error:
            'KIS에서 데이터를 반환하지 않음. 거래 가능 시간 확인 또는 종목코드 확인 필요',
          data,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      symbol,
      exchange,
      name: output.rsym || symbol,
      currency: output.curr || 'USD',
      prices: {
        current: parseFloat(output.last || '0'), // 현재가
        open: parseFloat(output.open || '0'), // 시가
        high: parseFloat(output.high || '0'), // 고가
        low: parseFloat(output.low || '0'), // 저가
        previous: parseFloat(output.base || '0'), // 전일종가
      },
      tradingInfo: {
        unit: output.vnit || '1', // 매매단위
        tick: output.e_hogau || '0.01', // 호가단위
        volume: parseFloat(output.tvol || '0'),
        amount: parseFloat(output.tamt || '0'),
      },
      financials: {
        per: parseFloat(output.perx || '0'),
        pbr: parseFloat(output.pbrx || '0'),
        eps: parseFloat(output.epsx || '0'),
        bps: parseFloat(output.bpsx || '0'),
      },
      raw: output,
    });
  } catch (error) {
    console.error('[KIS Price Detail Error]', error);
    return NextResponse.json(
      {
        error: '현재가 조회 중 오류 발생',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
