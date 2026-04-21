import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type AssetType = "stock" | "crypto";

type ResolvedSymbol = {
  symbol: string;
  name: string;
  type: AssetType;
};

const MANUAL_SYMBOLS: Record<string, ResolvedSymbol> = {
  // Oslo Børs
  equinor: { symbol: "EQNR.OL", name: "Equinor ASA", type: "stock" },
  "equinor asa": { symbol: "EQNR.OL", name: "Equinor ASA", type: "stock" },
  eqnr: { symbol: "EQNR.OL", name: "Equinor ASA", type: "stock" },
  "eqnr.ol": { symbol: "EQNR.OL", name: "Equinor ASA", type: "stock" },

  dnb: { symbol: "DNB.OL", name: "DNB Bank ASA", type: "stock" },
  "dnb bank": { symbol: "DNB.OL", name: "DNB Bank ASA", type: "stock" },
  "dnb bank asa": { symbol: "DNB.OL", name: "DNB Bank ASA", type: "stock" },
  "dnb.ol": { symbol: "DNB.OL", name: "DNB Bank ASA", type: "stock" },

  "aker bp": { symbol: "AKRBP.OL", name: "Aker BP ASA", type: "stock" },
  akrbp: { symbol: "AKRBP.OL", name: "Aker BP ASA", type: "stock" },
  "akrbp.ol": { symbol: "AKRBP.OL", name: "Aker BP ASA", type: "stock" },

  telenor: { symbol: "TEL.OL", name: "Telenor ASA", type: "stock" },
  tel: { symbol: "TEL.OL", name: "Telenor ASA", type: "stock" },
  "tel.ol": { symbol: "TEL.OL", name: "Telenor ASA", type: "stock" },

  "norsk hydro": { symbol: "NHY.OL", name: "Norsk Hydro ASA", type: "stock" },
  nhy: { symbol: "NHY.OL", name: "Norsk Hydro ASA", type: "stock" },
  "nhy.ol": { symbol: "NHY.OL", name: "Norsk Hydro ASA", type: "stock" },

  mowi: { symbol: "MOWI.OL", name: "Mowi ASA", type: "stock" },
  "mowi ol": { symbol: "MOWI.OL", name: "Mowi ASA", type: "stock" },
  "mowi.ol": { symbol: "MOWI.OL", name: "Mowi ASA", type: "stock" },

  orkla: { symbol: "ORK.OL", name: "Orkla ASA", type: "stock" },
  ork: { symbol: "ORK.OL", name: "Orkla ASA", type: "stock" },
  "ork.ol": { symbol: "ORK.OL", name: "Orkla ASA", type: "stock" },

  salmar: { symbol: "SALM.OL", name: "SalMar ASA", type: "stock" },
  salm: { symbol: "SALM.OL", name: "SalMar ASA", type: "stock" },
  "salm.ol": { symbol: "SALM.OL", name: "SalMar ASA", type: "stock" },

  yara: { symbol: "YAR.OL", name: "Yara International ASA", type: "stock" },
  yar: { symbol: "YAR.OL", name: "Yara International ASA", type: "stock" },
  "yar.ol": { symbol: "YAR.OL", name: "Yara International ASA", type: "stock" },

  storebrand: { symbol: "STB.OL", name: "Storebrand ASA", type: "stock" },
  stb: { symbol: "STB.OL", name: "Storebrand ASA", type: "stock" },
  "stb.ol": { symbol: "STB.OL", name: "Storebrand ASA", type: "stock" },

  "subsea 7": { symbol: "SUBC.OL", name: "Subsea 7 SA", type: "stock" },
  subc: { symbol: "SUBC.OL", name: "Subsea 7 SA", type: "stock" },
  "subc.ol": { symbol: "SUBC.OL", name: "Subsea 7 SA", type: "stock" },

  frontline: { symbol: "FRO.OL", name: "Frontline Plc", type: "stock" },
  fro: { symbol: "FRO.OL", name: "Frontline Plc", type: "stock" },
  "fro.ol": { symbol: "FRO.OL", name: "Frontline Plc", type: "stock" },

  "golden ocean": { symbol: "GOGL.OL", name: "Golden Ocean Group Ltd", type: "stock" },
  gogl: { symbol: "GOGL.OL", name: "Golden Ocean Group Ltd", type: "stock" },
  "gogl.ol": { symbol: "GOGL.OL", name: "Golden Ocean Group Ltd", type: "stock" },

  tomra: { symbol: "TOM.OL", name: "Tomra Systems ASA", type: "stock" },
  tom: { symbol: "TOM.OL", name: "Tomra Systems ASA", type: "stock" },
  "tom.ol": { symbol: "TOM.OL", name: "Tomra Systems ASA", type: "stock" },

  autostore: { symbol: "AUTO.OL", name: "Autostore Holdings Ltd", type: "stock" },
  auto: { symbol: "AUTO.OL", name: "Autostore Holdings Ltd", type: "stock" },
  "auto.ol": { symbol: "AUTO.OL", name: "Autostore Holdings Ltd", type: "stock" },

  nel: { symbol: "NEL.OL", name: "NEL ASA", type: "stock" },
  "nel asa": { symbol: "NEL.OL", name: "NEL ASA", type: "stock" },
  "nel.ol": { symbol: "NEL.OL", name: "NEL ASA", type: "stock" },

  pgs: { symbol: "PGS.OL", name: "PGS ASA", type: "stock" },
  "pgs asa": { symbol: "PGS.OL", name: "PGS ASA", type: "stock" },
  "pgs.ol": { symbol: "PGS.OL", name: "PGS ASA", type: "stock" },

  bakkafrost: { symbol: "BAKKA.OL", name: "P/F Bakkafrost", type: "stock" },
  bakka: { symbol: "BAKKA.OL", name: "P/F Bakkafrost", type: "stock" },
  "bakka.ol": { symbol: "BAKKA.OL", name: "P/F Bakkafrost", type: "stock" },

  "bw lpg": { symbol: "BWLPG.OL", name: "BW LPG Ltd", type: "stock" },
  bwlpg: { symbol: "BWLPG.OL", name: "BW LPG Ltd", type: "stock" },
  "bwlpg.ol": { symbol: "BWLPG.OL", name: "BW LPG Ltd", type: "stock" },

  kitron: { symbol: "KIT.OL", name: "Kitron ASA", type: "stock" },
  kit: { symbol: "KIT.OL", name: "Kitron ASA", type: "stock" },
  "kit.ol": { symbol: "KIT.OL", name: "Kitron ASA", type: "stock" },

  // USA
  apple: { symbol: "AAPL", name: "Apple Inc.", type: "stock" },
  aapl: { symbol: "AAPL", name: "Apple Inc.", type: "stock" },

  microsoft: { symbol: "MSFT", name: "Microsoft Corp.", type: "stock" },
  msft: { symbol: "MSFT", name: "Microsoft Corp.", type: "stock" },

  nvidia: { symbol: "NVDA", name: "NVIDIA Corp.", type: "stock" },
  nvda: { symbol: "NVDA", name: "NVIDIA Corp.", type: "stock" },

  amazon: { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock" },
  amzn: { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock" },

  alphabet: { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock" },
  google: { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock" },
  googl: { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock" },

  meta: { symbol: "META", name: "Meta Platforms Inc.", type: "stock" },
  facebook: { symbol: "META", name: "Meta Platforms Inc.", type: "stock" },

  tesla: { symbol: "TSLA", name: "Tesla Inc.", type: "stock" },
  tsla: { symbol: "TSLA", name: "Tesla Inc.", type: "stock" },

  // Krypto
  bitcoin: { symbol: "BTC-USD", name: "Bitcoin", type: "crypto" },
  btc: { symbol: "BTC-USD", name: "Bitcoin", type: "crypto" },
  "btc-usd": { symbol: "BTC-USD", name: "Bitcoin", type: "crypto" },

  ethereum: { symbol: "ETH-USD", name: "Ethereum", type: "crypto" },
  eth: { symbol: "ETH-USD", name: "Ethereum", type: "crypto" },
  "eth-usd": { symbol: "ETH-USD", name: "Ethereum", type: "crypto" },

  solana: { symbol: "SOL-USD", name: "Solana", type: "crypto" },
  sol: { symbol: "SOL-USD", name: "Solana", type: "crypto" },
  "sol-usd": { symbol: "SOL-USD", name: "Solana", type: "crypto" },

  xrp: { symbol: "XRP-USD", name: "XRP", type: "crypto" },
  "xrp-usd": { symbol: "XRP-USD", name: "XRP", type: "crypto" },
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

function getYahooSymbol(asset: ResolvedSymbol) {
  return asset.symbol;
}

function getCurrency(asset: ResolvedSymbol, yahooCurrency?: string) {
  if (asset.symbol.endsWith(".OL")) return "NOK";
  if (asset.type === "crypto") return "USD";
  return yahooCurrency || "USD";
}

function round(value: number, decimals = 2) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(decimals));
}

async function fetchYahooQuote(asset: ResolvedSymbol) {
  const symbol = getYahooSymbol(asset);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=1d&range=5d&includePrePost=false`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Yahoo quote error ${res.status}`);
  }

  const data = await res.json();
  const result = data?.chart?.result?.[0];
  const error = data?.chart?.error;

  if (error) {
    throw new Error(error?.description || "Yahoo chart error");
  }

  if (!result) {
    throw new Error("Ingen data fra Yahoo");
  }

  const meta = result.meta || {};
  const quote = result.indicators?.quote?.[0] || {};

  const closes = (quote.close || []).filter((v: any) => typeof v === "number");
  const highs = (quote.high || []).filter((v: any) => typeof v === "number");
  const lows = (quote.low || []).filter((v: any) => typeof v === "number");

  const current =
    Number(meta.regularMarketPrice) ||
    Number(closes[closes.length - 1]) ||
    0;

  const previousClose =
    Number(meta.previousClose) ||
    (closes.length >= 2 ? Number(closes[closes.length - 2]) : 0);

  const high =
    Number(meta.regularMarketDayHigh) ||
    (highs.length ? Math.max(...highs) : current);

  const low =
    Number(meta.regularMarketDayLow) ||
    (lows.length ? Math.min(...lows) : current);

  const change = current - previousClose;
  const changePercent = previousClose
    ? (change / previousClose) * 100
    : 0;

  return {
    price: round(current),
    previousClose: round(previousClose),
    high: round(high),
    low: round(low),
    change: round(change),
    changePercent: round(changePercent),
    currency: getCurrency(asset, meta.currency),
  };
}

function buildFallbackAnalysis(
  asset: ResolvedSymbol,
  quote: {
    price: number;
    previousClose: number;
    high: number;
    low: number;
    change: number;
    changePercent: number;
    currency: string;
  }
) {
  const current = quote.price;
  const prevClose = quote.previousClose;
  const high = quote.high;
  const low = quote.low;
  const changePct = quote.changePercent;

  const intradayRangePct = low > 0 ? ((high - low) / low) * 100 : 0;

  let recommendation = "Hold";
  let score = 5;

  if (changePct >= 2 && intradayRangePct < 4) {
    recommendation = "Kjøp";
    score = 8;
  } else if (changePct > 0) {
    recommendation = "Hold";
    score = 6;
  } else if (changePct <= -2) {
    recommendation = "Selg";
    score = 3;
  }

  const trend =
    changePct > 0
      ? `${asset.name} viser en oppadgående trend med en endring på ${changePct.toFixed(2)}% siden forrige sluttkurs.`
      : changePct < 0
      ? `${asset.name} viser en nedadgående trend med en endring på ${changePct.toFixed(2)}% siden forrige sluttkurs.`
      : `${asset.name} er relativt flat akkurat nå uten store bevegelser.`;

  const risk =
    intradayRangePct > 5
      ? `Risikoen vurderes som høy fordi svingningene er store, med et spenn mellom ${low.toFixed(
          2
        )} og ${high.toFixed(2)} ${quote.currency}.`
      : intradayRangePct > 2
      ? `Risikoen vurderes som moderat, med merkbare svingninger mellom ${low.toFixed(
          2
        )} og ${high.toFixed(2)} ${quote.currency}.`
      : `Risikoen vurderes som lav til moderat, siden kursen har vært forholdsvis stabil.`;

  const conclusion =
    recommendation === "Kjøp"
      ? `Det tekniske bildet er foreløpig positivt, men utviklingen bør fortsatt følges nøye.`
      : recommendation === "Selg"
      ? `Utviklingen er svak akkurat nå, og det kan være lurt å være forsiktig til trenden bedrer seg.`
      : `Bildet er blandet akkurat nå, og det kan være fornuftig å avvente tydeligere signaler.`;

  const timeframe =
    asset.type === "crypto" ? "Kort til mellomlang sikt" : "Kort sikt";

  return {
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    price: current,
    previousClose: prevClose,
    high,
    low,
    change: quote.change,
    changePercent: changePct,
    currency: quote.currency,
    recommendation,
    score,
    analysis: {
      trend,
      risk,
      conclusion,
      timeframe,
    },
  };
}

async function buildOpenAIAnalysis(
  asset: ResolvedSymbol,
  quote: {
    price: number;
    previousClose: number;
    high: number;
    low: number;
    change: number;
    changePercent: number;
    currency: string;
  }
) {
  if (!OPENAI_API_KEY) return null;

  const prompt = `
Du er en norsk finansassistent.
Svar KUN med gyldig JSON, uten markdown og uten ekstra tekst.

Analyser følgende instrument:
Navn: ${asset.name}
Symbol: ${asset.symbol}
Type: ${asset.type}
Siste pris: ${quote.price} ${quote.currency}
Forrige sluttkurs: ${quote.previousClose} ${quote.currency}
Dagens høy: ${quote.high} ${quote.currency}
Dagens lav: ${quote.low} ${quote.currency}
Endring i prosent: ${quote.changePercent}

Returner JSON i nøyaktig dette formatet:
{
  "recommendation": "Kjøp | Hold | Selg",
  "score": 1,
  "analysis": {
    "trend": "kort tekst",
    "risk": "kort tekst",
    "conclusion": "kort tekst",
    "timeframe": "kort tekst"
  }
}

Regler:
- Svar på norsk
- score skal være et heltall fra 1 til 10
- recommendation må være ett av: Kjøp, Hold, Selg
- vær kort, konkret og nøktern
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "Du er en presis norsk finansassistent som kun svarer med gyldig JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch {
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
          message:
            "Prøv f.eks. Equinor, DNB, Aker BP, Apple, Bitcoin eller Ethereum.",
        },
        { status: 404 }
      );
    }

    const quote = await fetchYahooQuote(asset);

    if (!quote || Number(quote.price ?? 0) === 0) {
      return NextResponse.json(
        {
          error: "Fant ikke kursdata",
          message: `Klarte ikke hente kursdata for ${asset.symbol}`,
        },
        { status: 404 }
      );
    }

    const aiAnalysis = await buildOpenAIAnalysis(asset, quote);
    const fallback = buildFallbackAnalysis(asset, quote);

    const result = aiAnalysis
      ? {
          ...fallback,
          recommendation:
            aiAnalysis.recommendation ?? fallback.recommendation,
          score:
            typeof aiAnalysis.score === "number"
              ? aiAnalysis.score
              : fallback.score,
          analysis: {
            trend: aiAnalysis.analysis?.trend ?? fallback.analysis.trend,
            risk: aiAnalysis.analysis?.risk ?? fallback.analysis.risk,
            conclusion:
              aiAnalysis.analysis?.conclusion ?? fallback.analysis.conclusion,
            timeframe:
              aiAnalysis.analysis?.timeframe ?? fallback.analysis.timeframe,
          },
        }
      : fallback;

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
