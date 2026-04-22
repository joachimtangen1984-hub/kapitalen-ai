import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type AssetType = "stock" | "crypto";

type ResolvedSymbol = {
  symbol: string;
  name: string;
  type: AssetType;
  currency?: string;
  source?: "yahoo" | "binance";
};

type ChartPoint = {
  label: string;
  value: number;
};

type UnifiedQuote = {
  price: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  change: number;
  changePercent: number;
  updatedAt: string;
  currency: string;
  currencyLabel: string;
  source: "yahoo" | "binance";
};

const MANUAL_SYMBOLS: Record<string, ResolvedSymbol> = {
  // Oslo Børs
  "equinor": { symbol: "EQNR.OL", name: "Equinor ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "equinor asa": { symbol: "EQNR.OL", name: "Equinor ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "eqnr": { symbol: "EQNR.OL", name: "Equinor ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "eqnr.ol": { symbol: "EQNR.OL", name: "Equinor ASA", type: "stock", currency: "NOK", source: "yahoo" },

  "dnb": { symbol: "DNB.OL", name: "DNB Bank ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "dnb bank": { symbol: "DNB.OL", name: "DNB Bank ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "dnb bank asa": { symbol: "DNB.OL", name: "DNB Bank ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "dnb.ol": { symbol: "DNB.OL", name: "DNB Bank ASA", type: "stock", currency: "NOK", source: "yahoo" },

  "aker bp": { symbol: "AKRBP.OL", name: "Aker BP ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "akrbp": { symbol: "AKRBP.OL", name: "Aker BP ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "akrbp.ol": { symbol: "AKRBP.OL", name: "Aker BP ASA", type: "stock", currency: "NOK", source: "yahoo" },

  "telenor": { symbol: "TEL.OL", name: "Telenor ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "tel": { symbol: "TEL.OL", name: "Telenor ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "tel.ol": { symbol: "TEL.OL", name: "Telenor ASA", type: "stock", currency: "NOK", source: "yahoo" },

  "norsk hydro": { symbol: "NHY.OL", name: "Norsk Hydro ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "nhy": { symbol: "NHY.OL", name: "Norsk Hydro ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "nhy.ol": { symbol: "NHY.OL", name: "Norsk Hydro ASA", type: "stock", currency: "NOK", source: "yahoo" },

  "mowi": { symbol: "MOWI.OL", name: "Mowi ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "mowi.ol": { symbol: "MOWI.OL", name: "Mowi ASA", type: "stock", currency: "NOK", source: "yahoo" },

  "orkla": { symbol: "ORK.OL", name: "Orkla ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "ork": { symbol: "ORK.OL", name: "Orkla ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "ork.ol": { symbol: "ORK.OL", name: "Orkla ASA", type: "stock", currency: "NOK", source: "yahoo" },

  "salmar": { symbol: "SALM.OL", name: "SalMar ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "salm": { symbol: "SALM.OL", name: "SalMar ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "salm.ol": { symbol: "SALM.OL", name: "SalMar ASA", type: "stock", currency: "NOK", source: "yahoo" },

  "yara": { symbol: "YAR.OL", name: "Yara International ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "yar": { symbol: "YAR.OL", name: "Yara International ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "yar.ol": { symbol: "YAR.OL", name: "Yara International ASA", type: "stock", currency: "NOK", source: "yahoo" },

  "storebrand": { symbol: "STB.OL", name: "Storebrand ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "stb": { symbol: "STB.OL", name: "Storebrand ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "stb.ol": { symbol: "STB.OL", name: "Storebrand ASA", type: "stock", currency: "NOK", source: "yahoo" },

  "subsea 7": { symbol: "SUBC.OL", name: "Subsea 7 SA", type: "stock", currency: "NOK", source: "yahoo" },
  "subc": { symbol: "SUBC.OL", name: "Subsea 7 SA", type: "stock", currency: "NOK", source: "yahoo" },
  "subc.ol": { symbol: "SUBC.OL", name: "Subsea 7 SA", type: "stock", currency: "NOK", source: "yahoo" },

  "frontline": { symbol: "FRO.OL", name: "Frontline Plc", type: "stock", currency: "NOK", source: "yahoo" },
  "fro": { symbol: "FRO.OL", name: "Frontline Plc", type: "stock", currency: "NOK", source: "yahoo" },
  "fro.ol": { symbol: "FRO.OL", name: "Frontline Plc", type: "stock", currency: "NOK", source: "yahoo" },

  "golden ocean": { symbol: "GOGL.OL", name: "Golden Ocean Group Ltd", type: "stock", currency: "NOK", source: "yahoo" },
  "gogl": { symbol: "GOGL.OL", name: "Golden Ocean Group Ltd", type: "stock", currency: "NOK", source: "yahoo" },
  "gogl.ol": { symbol: "GOGL.OL", name: "Golden Ocean Group Ltd", type: "stock", currency: "NOK", source: "yahoo" },

  "tomra": { symbol: "TOM.OL", name: "Tomra Systems ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "tom": { symbol: "TOM.OL", name: "Tomra Systems ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "tom.ol": { symbol: "TOM.OL", name: "Tomra Systems ASA", type: "stock", currency: "NOK", source: "yahoo" },

  "autostore": { symbol: "AUTO.OL", name: "Autostore Holdings Ltd", type: "stock", currency: "NOK", source: "yahoo" },
  "auto": { symbol: "AUTO.OL", name: "Autostore Holdings Ltd", type: "stock", currency: "NOK", source: "yahoo" },
  "auto.ol": { symbol: "AUTO.OL", name: "Autostore Holdings Ltd", type: "stock", currency: "NOK", source: "yahoo" },

  "nel": { symbol: "NEL.OL", name: "NEL ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "nel asa": { symbol: "NEL.OL", name: "NEL ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "nel.ol": { symbol: "NEL.OL", name: "NEL ASA", type: "stock", currency: "NOK", source: "yahoo" },

  "pgs": { symbol: "PGS.OL", name: "PGS ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "pgs asa": { symbol: "PGS.OL", name: "PGS ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "pgs.ol": { symbol: "PGS.OL", name: "PGS ASA", type: "stock", currency: "NOK", source: "yahoo" },

  "bakkafrost": { symbol: "BAKKA.OL", name: "P/F Bakkafrost", type: "stock", currency: "NOK", source: "yahoo" },
  "bakka": { symbol: "BAKKA.OL", name: "P/F Bakkafrost", type: "stock", currency: "NOK", source: "yahoo" },
  "bakka.ol": { symbol: "BAKKA.OL", name: "P/F Bakkafrost", type: "stock", currency: "NOK", source: "yahoo" },

  "bw lpg": { symbol: "BWLPG.OL", name: "BW LPG Ltd", type: "stock", currency: "NOK", source: "yahoo" },
  "bwlpg": { symbol: "BWLPG.OL", name: "BW LPG Ltd", type: "stock", currency: "NOK", source: "yahoo" },
  "bwlpg.ol": { symbol: "BWLPG.OL", name: "BW LPG Ltd", type: "stock", currency: "NOK", source: "yahoo" },

  "kitron": { symbol: "KIT.OL", name: "Kitron ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "kit": { symbol: "KIT.OL", name: "Kitron ASA", type: "stock", currency: "NOK", source: "yahoo" },
  "kit.ol": { symbol: "KIT.OL", name: "Kitron ASA", type: "stock", currency: "NOK", source: "yahoo" },

  // USA aksjer via Yahoo også
  "apple": { symbol: "AAPL", name: "Apple Inc.", type: "stock", currency: "USD", source: "yahoo" },
  "aapl": { symbol: "AAPL", name: "Apple Inc.", type: "stock", currency: "USD", source: "yahoo" },

  "microsoft": { symbol: "MSFT", name: "Microsoft Corp.", type: "stock", currency: "USD", source: "yahoo" },
  "msft": { symbol: "MSFT", name: "Microsoft Corp.", type: "stock", currency: "USD", source: "yahoo" },

  "nvidia": { symbol: "NVDA", name: "NVIDIA Corp.", type: "stock", currency: "USD", source: "yahoo" },
  "nvda": { symbol: "NVDA", name: "NVIDIA Corp.", type: "stock", currency: "USD", source: "yahoo" },

  "amazon": { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock", currency: "USD", source: "yahoo" },
  "amzn": { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock", currency: "USD", source: "yahoo" },

  "alphabet": { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", currency: "USD", source: "yahoo" },
  "google": { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", currency: "USD", source: "yahoo" },
  "googl": { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", currency: "USD", source: "yahoo" },

  "meta": { symbol: "META", name: "Meta Platforms Inc.", type: "stock", currency: "USD", source: "yahoo" },
  "facebook": { symbol: "META", name: "Meta Platforms Inc.", type: "stock", currency: "USD", source: "yahoo" },

  "tesla": { symbol: "TSLA", name: "Tesla Inc.", type: "stock", currency: "USD", source: "yahoo" },
  "tsla": { symbol: "TSLA", name: "Tesla Inc.", type: "stock", currency: "USD", source: "yahoo" },

  // Krypto via Binance
  "bitcoin": { symbol: "BTCUSDT", name: "Bitcoin", type: "crypto", currency: "USD", source: "binance" },
  "btc": { symbol: "BTCUSDT", name: "Bitcoin", type: "crypto", currency: "USD", source: "binance" },
  "btcusdt": { symbol: "BTCUSDT", name: "Bitcoin", type: "crypto", currency: "USD", source: "binance" },

  "ethereum": { symbol: "ETHUSDT", name: "Ethereum", type: "crypto", currency: "USD", source: "binance" },
  "eth": { symbol: "ETHUSDT", name: "Ethereum", type: "crypto", currency: "USD", source: "binance" },
  "ethusdt": { symbol: "ETHUSDT", name: "Ethereum", type: "crypto", currency: "USD", source: "binance" },

  "solana": { symbol: "SOLUSDT", name: "Solana", type: "crypto", currency: "USD", source: "binance" },
  "sol": { symbol: "SOLUSDT", name: "Solana", type: "crypto", currency: "USD", source: "binance" },
  "solusdt": { symbol: "SOLUSDT", name: "Solana", type: "crypto", currency: "USD", source: "binance" },

  "xrp": { symbol: "XRPUSDT", name: "XRP", type: "crypto", currency: "USD", source: "binance" },
  "xrpusdt": { symbol: "XRPUSDT", name: "XRP", type: "crypto", currency: "USD", source: "binance" },
};

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/aksjen|aksje|coin|krypto|crypto|analyse|analyser|kurs|pris/gi, "")
    .replace(/[.,!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveSymbol(query: string): ResolvedSymbol | null {
  const q = normalizeText(query);
  if (!q) return null;

  if (MANUAL_SYMBOLS[q]) return MANUAL_SYMBOLS[q];

  for (const [key, value] of Object.entries(MANUAL_SYMBOLS)) {
    if (q.includes(key)) return value;
  }

  return null;
}

function round(value: number, decimals = 2) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(decimals));
}

function getCurrencyLabel(currency?: string) {
  if (currency === "NOK") return "NOK";
  if (currency === "USD") return "USD";
  return currency ?? "";
}

function calculateSupport(low: number, previousClose: number) {
  if (low > 0 && previousClose > 0) return round(Math.min(low, previousClose));
  if (low > 0) return round(low);
  return round(previousClose);
}

function calculateResistance(high: number, previousClose: number) {
  if (high > 0 && previousClose > 0) return round(Math.max(high, previousClose));
  if (high > 0) return round(high);
  return round(previousClose);
}

function calculateBias(changePercent: number, current: number, open: number) {
  if (changePercent >= 1.5 && current >= open) return "Positiv";
  if (changePercent <= -1.5 && current <= open) return "Negativ";
  return "Nøytral";
}

async function fetchYahooQuote(asset: ResolvedSymbol): Promise<UnifiedQuote> {
  const quote: any = await yahooFinance.quote(asset.symbol);

  const price = Number(
    quote?.regularMarketPrice ??
      quote?.postMarketPrice ??
      quote?.preMarketPrice ??
      0
  );

  const open = Number(quote?.regularMarketOpen ?? 0);
  const high = Number(quote?.regularMarketDayHigh ?? 0);
  const low = Number(quote?.regularMarketDayLow ?? 0);
  const previousClose = Number(quote?.regularMarketPreviousClose ?? 0);
  const change = price - previousClose;
  const changePercent =
    previousClose > 0 ? (change / previousClose) * 100 : 0;

  const updatedAt =
    quote?.regularMarketTime
      ? new Date(quote.regularMarketTime).toISOString()
      : new Date().toISOString();

  return {
    price: round(price),
    open: round(open),
    high: round(high),
    low: round(low),
    previousClose: round(previousClose),
    change: round(change),
    changePercent: round(changePercent),
    updatedAt,
    currency: asset.currency ?? quote?.currency ?? "USD",
    currencyLabel: getCurrencyLabel(asset.currency ?? quote?.currency ?? "USD"),
    source: "yahoo",
  };
}

async function fetchYahooChart(symbol: string): Promise<ChartPoint[]> {
  try {
    const result: any = await yahooFinance.chart(symbol, {
      period1: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      period2: new Date(),
      interval: "1d",
    });

    const quotes = result?.quotes ?? [];
    return quotes
      .filter((q: any) => typeof q?.close === "number" && q?.date)
      .slice(-20)
      .map((q: any) => {
        const date = new Date(q.date);
        const label = `${String(date.getDate()).padStart(2, "0")}.${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        return {
          label,
          value: round(Number(q.close)),
        };
      });
  } catch {
    return [];
  }
}

async function fetchBinance24h(symbol: string): Promise<any> {
  const res = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Binance 24h error ${res.status}${body ? ` - ${body}` : ""}`);
  }

  return res.json();
}

async function fetchBinanceQuote(asset: ResolvedSymbol): Promise<UnifiedQuote> {
  const data = await fetchBinance24h(asset.symbol);

  const price = Number(data?.lastPrice ?? 0);
  const open = Number(data?.openPrice ?? 0);
  const high = Number(data?.highPrice ?? 0);
  const low = Number(data?.lowPrice ?? 0);
  const previousClose = Number(data?.prevClosePrice ?? open);
  const change = Number(data?.priceChange ?? price - previousClose);
  const changePercent = Number(data?.priceChangePercent ?? 0);
  const updatedAt = data?.closeTime
    ? new Date(Number(data.closeTime)).toISOString()
    : new Date().toISOString();

  return {
    price: round(price),
    open: round(open),
    high: round(high),
    low: round(low),
    previousClose: round(previousClose),
    change: round(change),
    changePercent: round(changePercent),
    updatedAt,
    currency: asset.currency ?? "USD",
    currencyLabel: getCurrencyLabel(asset.currency ?? "USD"),
    source: "binance",
  };
}

async function fetchBinanceChart(symbol: string): Promise<ChartPoint[]> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=1d&limit=20`,
      { cache: "no-store" }
    );

    if (!res.ok) return [];

    const data = await res.json();

    if (!Array.isArray(data)) return [];

    return data
      .map((item: any[]) => {
        const timestamp = Number(item[0]);
        const close = Number(item[4]);

        if (!Number.isFinite(timestamp) || !Number.isFinite(close)) return null;

        const date = new Date(timestamp);
        const label = `${String(date.getDate()).padStart(2, "0")}.${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        return {
          label,
          value: round(close),
        };
      })
      .filter(Boolean) as ChartPoint[];
  } catch {
    return [];
  }
}

function buildBaseAnalysis(
  asset: ResolvedSymbol,
  quote: UnifiedQuote,
  chartData: ChartPoint[]
) {
  const support = calculateSupport(quote.low, quote.previousClose);
  const resistance = calculateResistance(quote.high, quote.previousClose);
  const bias = calculateBias(quote.changePercent, quote.price, quote.open);

  const intradayRangePct =
    quote.low > 0 ? ((quote.high - quote.low) / quote.low) * 100 : 0;

  let recommendation: "Kjøp" | "Hold" | "Selg" = "Hold";
  let score = 5;

  if (quote.changePercent >= 2 && intradayRangePct < 6) {
    recommendation = "Kjøp";
    score = 7;
  } else if (quote.changePercent <= -2) {
    recommendation = "Selg";
    score = 4;
  } else {
    recommendation = "Hold";
    score = 5;
  }

  let trend = "Stabil utvikling på kort sikt.";
  if (quote.changePercent >= 1.5) trend = "Positiv trend med økende pris.";
  else if (quote.changePercent > 0) trend = "Svak positiv utvikling på kort sikt.";
  else if (quote.changePercent <= -1.5) trend = "Nedadgående trend med fall i pris.";
  else if (quote.changePercent < 0) trend = "Svak negativ utvikling på kort sikt.";

  let risk = "Moderat risiko på kort sikt.";
  if (intradayRangePct >= 5) risk = "Høyere risiko grunnet tydelige svingninger.";
  else if (intradayRangePct <= 2) risk = "Lav til moderat risiko med begrensede dagssvingninger.";

  let conclusion = "Markedet gir ikke et sterkt kjøps- eller salgssignal akkurat nå.";
  let why =
    "Anbefalingen bygger på dagens prisutvikling, intradag-bevegelse og forholdet mellom støtte og motstand.";
  let whatChangesView =
    `Synet blir mer positivt ved brudd over motstand rundt ${resistance}, og mer negativt ved fall under ${support}.`;

  if (recommendation === "Kjøp") {
    conclusion =
      "Det korte bildet er positivt, og momentet støtter videre oppgang så lenge kursen holder seg sterk.";
    why =
      "Anbefalingen er kjøp fordi prisutviklingen er positiv, bias er sterkere og instrumentet holder seg over viktige nivåer.";
    whatChangesView = `Synet svekkes dersom kursen faller tilbake under støtten rundt ${support}.`;
  }

  if (recommendation === "Selg") {
    conclusion =
      "Det korte bildet er svakt, og det kan være fornuftig å være forsiktig til momentumet bedres.";
    why =
      "Anbefalingen er selg fordi utviklingen er negativ og prisbildet viser svakt kortsiktig momentum.";
    whatChangesView = `Synet blir mindre negativt dersom kursen etablerer seg over motstand rundt ${resistance}.`;
  }

  return {
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    source: quote.source,
    currency: quote.currency,
    currencyLabel: quote.currencyLabel,
    price: quote.price,
    open: quote.open,
    high: quote.high,
    low: quote.low,
    previousClose: quote.previousClose,
    change: quote.change,
    changePercent: quote.changePercent,
    support,
    resistance,
    bias,
    updatedAt: quote.updatedAt,
    recommendation,
    score,
    chartData,
    analysis: {
      trend,
      risk,
      conclusion,
      timeframe: "Kort sikt",
      why,
      whatChangesView,
    },
  };
}

async function buildOpenAIAnalysis(baseData: ReturnType<typeof buildBaseAnalysis>) {
  if (!OPENAI_API_KEY) return null;

  const prompt = `
Du er en norsk finansassistent.
Svar KUN med gyldig JSON. Ingen markdown. Ingen ekstra tekst.

Her er markedsdata:
Navn: ${baseData.name}
Symbol: ${baseData.symbol}
Type: ${baseData.type}
Pris: ${baseData.price} ${baseData.currencyLabel}
Dagsendring: ${baseData.changePercent}%
Dagens høy: ${baseData.high}
Dagens lav: ${baseData.low}
Forrige sluttkurs: ${baseData.previousClose}
Støtte: ${baseData.support}
Motstand: ${baseData.resistance}
Bias: ${baseData.bias}

Returner nøyaktig dette formatet:
{
  "recommendation": "Kjøp",
  "score": 7,
  "analysis": {
    "trend": "kort og konkret",
    "risk": "kort og konkret",
    "conclusion": "kort og konkret",
    "timeframe": "Kort sikt",
    "why": "hvorfor anbefalingen er kjøp/hold/selg",
    "whatChangesView": "hva må skje for at synet endres"
  }
}

Regler:
- Svar på norsk
- recommendation må være ett av: Kjøp, Hold, Selg
- score må være heltall fra 1 til 10
- vær kort, konkret og nøktern
- ikke overdriv sikkerhet
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Du er en presis norsk finansassistent som kun svarer med gyldig JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("OpenAI error:", res.status, text);
    return null;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("OpenAI JSON parse error:", error, content);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawQuery = String(body?.query ?? body?.message ?? "").trim();

    if (!rawQuery) {
      return NextResponse.json(
        { error: "Du må skrive inn noe å analysere" },
        { status: 400 }
      );
    }

    const asset = resolveSymbol(rawQuery);

    if (!asset) {
      return NextResponse.json(
        {
          error: "Fant ikke instrument",
          message: "Prøv f.eks. Equinor, DNB, Apple, Bitcoin, Ethereum eller XRP.",
        },
        { status: 404 }
      );
    }

    let quote: UnifiedQuote;
    let chartData: ChartPoint[];

    if (asset.source === "binance") {
      quote = await fetchBinanceQuote(asset);
      chartData = await fetchBinanceChart(asset.symbol);
    } else {
      quote = await fetchYahooQuote(asset);
      chartData = await fetchYahooChart(asset.symbol);
    }

    if (!quote || Number(quote.price ?? 0) === 0) {
      return NextResponse.json(
        {
          error: "Fant ikke kursdata",
          message: `Klarte ikke hente kursdata for ${asset.symbol}`,
        },
        { status: 404 }
      );
    }

    const base = buildBaseAnalysis(asset, quote, chartData);
    const aiAnalysis = await buildOpenAIAnalysis(base);

    const result = aiAnalysis
      ? {
          ...base,
          recommendation: aiAnalysis.recommendation ?? base.recommendation,
          score:
            typeof aiAnalysis.score === "number" ? aiAnalysis.score : base.score,
          analysis: {
            trend: aiAnalysis.analysis?.trend ?? base.analysis.trend,
            risk: aiAnalysis.analysis?.risk ?? base.analysis.risk,
            conclusion: aiAnalysis.analysis?.conclusion ?? base.analysis.conclusion,
            timeframe: aiAnalysis.analysis?.timeframe ?? base.analysis.timeframe,
            why: aiAnalysis.analysis?.why ?? base.analysis.why,
            whatChangesView:
              aiAnalysis.analysis?.whatChangesView ?? base.analysis.whatChangesView,
          },
        }
      : base;

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Analyze error:", error);

    return NextResponse.json(
      {
        error: "Noe gikk galt",
        message: error?.message ?? "Ukjent feil",
      },
      { status: 500 }
    );
  }
}
