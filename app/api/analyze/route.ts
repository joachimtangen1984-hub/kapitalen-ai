import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

type AssetType = "stock" | "crypto";

type AnalyzeResult = {
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  previousClose: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  recommendation: string;
  score: number;
  bias: string;
  support: number;
  resistance: number;
  source: string;
  updatedAt: string;
  analysis: {
    trend: string;
    risk: string;
    conclusion: string;
    timeframe: string;
    why: string;
    uncertainty: string;
  };
  chart: {
    points: number[];
  };
};

const STOCK_MAP: Record<string, string> = {
  equinor: "EQNR.OL",
  dnb: "DNB.OL",
  nel: "NEL.OL",
  yara: "YAR.OL",
  mowi: "MOWI.OL",
  salmon: "MOWI.OL",
  apple: "AAPL",
  microsoft: "MSFT",
  nvidia: "NVDA",
  tesla: "TSLA",
  amazon: "AMZN",
  meta: "META",
  google: "GOOGL",
};

const CRYPTO_MAP: Record<string, string> = {
  bitcoin: "BTC-USD",
  btc: "BTC-USD",
  ethereum: "ETH-USD",
  eth: "ETH-USD",
  solana: "SOL-USD",
  sol: "SOL-USD",
  ripple: "XRP-USD",
  xrp: "XRP-USD",
};

function cleanQuery(query: string) {
  return query
    .toLowerCase()
    .replace("analyser", "")
    .replace("analyse", "")
    .replace("aksjen", "")
    .replace("aksje", "")
    .trim();
}

function resolveSymbol(input: string): {
  symbol: string;
  type: AssetType;
} {
  const q = cleanQuery(input);

  if (CRYPTO_MAP[q]) {
    return {
      symbol: CRYPTO_MAP[q],
      type: "crypto",
    };
  }

  if (STOCK_MAP[q]) {
    return {
      symbol: STOCK_MAP[q],
      type: "stock",
    };
  }

  if (q.includes("btc")) {
    return {
      symbol: "BTC-USD",
      type: "crypto",
    };
  }

  if (q.includes("eth")) {
    return {
      symbol: "ETH-USD",
      type: "crypto",
    };
  }

  return {
    symbol: q.toUpperCase(),
    type: "stock",
  };
}

function generateChart(price: number, positive: boolean) {
  const points: number[] = [];

  let current = price * 0.92;

  for (let i = 0; i < 24; i++) {
    const drift = positive ? 1.008 : 0.994;
    const noise = 1 + (Math.random() - 0.5) * 0.03;

    current = current * drift * noise;

    points.push(Number(current.toFixed(2)));
  }

  return points;
}

function buildAnalysis(
  type: AssetType,
  changePercent: number
): AnalyzeResult["analysis"] {
  const bullish = changePercent >= 0;

  return {
    trend: bullish
      ? "Positiv trend med stigende momentum."
      : "Svak utvikling og negativt momentum.",

    risk:
      type === "crypto"
        ? "Høy volatilitet og raske bevegelser."
        : "Moderat risiko basert på markedsforhold.",

    conclusion: bullish
      ? "Teknisk bilde peker mot videre styrke."
      : "Teknisk bilde er svakt på kort sikt.",

    timeframe:
      type === "crypto"
        ? "Kort til mellomlang sikt."
        : "Mellomlang til lang sikt.",

    why: bullish
      ? "Pris, momentum og trend peker i positiv retning."
      : "Lavere momentum og svak prisutvikling trekker ned.",

    uncertainty:
      type === "crypto"
        ? "Makro, sentiment og volatilitet kan raskt endre bildet."
        : "Resultater, renter og markedssentiment kan endre synet.",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const query = body?.query;

    if (!query) {
      return NextResponse.json(
        {
          error: "Mangler søk",
        },
        { status: 400 }
      );
    }

    const resolved = resolveSymbol(query);

    const quote: any = await yahooFinance.quote(resolved.symbol);

    if (!quote || !quote.regularMarketPrice) {
      return NextResponse.json(
        {
          error: "Fant ikke data for symbolet",
        },
        { status: 404 }
      );
    }

    const price = Number(quote.regularMarketPrice || 0);
    const previousClose = Number(quote.regularMarketPreviousClose || price);

    const change = price - previousClose;

    const changePercent =
      previousClose > 0 ? (change / previousClose) * 100 : 0;

    const bullish = changePercent >= 0;

    const result: AnalyzeResult = {
      symbol: resolved.symbol,
      name: quote.longName || quote.shortName || resolved.symbol,
      type: resolved.type,

      price,
      previousClose,

      high: Number(quote.regularMarketDayHigh || price),
      low: Number(quote.regularMarketDayLow || price),

      change,
      changePercent,

      recommendation: bullish ? "Kjøp" : "Hold",

      score: bullish ? 7 : 5,

      bias: bullish ? "Positiv" : "Nøytral",

      support: Number((price * 0.96).toFixed(2)),
      resistance: Number((price * 1.04).toFixed(2)),

      source: "Yahoo Finance",

      updatedAt: new Date().toLocaleString("nb-NO"),

      analysis: buildAnalysis(resolved.type, changePercent),

      chart: {
        points: generateChart(price, bullish),
      },
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Analysefeil:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Kunne ikke hente markedsdata akkurat nå.",
      },
      {
        status: 500,
      }
    );
  }
}
