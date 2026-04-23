import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

type AssetType = "stock" | "crypto";

type ResolvedSymbol = {
  symbol: string;
  type: AssetType;
};

type AnalyzeResponse = {
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  previousClose: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  recommendation: "Kjøp" | "Hold" | "Selg";
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

const SYMBOLS: Record<string, ResolvedSymbol> = {
  // Oslo Børs
  equinor: { symbol: "EQNR.OL", type: "stock" },
  "equinor asa": { symbol: "EQNR.OL", type: "stock" },
  eqnr: { symbol: "EQNR.OL", type: "stock" },
  "eqnr.ol": { symbol: "EQNR.OL", type: "stock" },

  dnb: { symbol: "DNB.OL", type: "stock" },
  "dnb bank": { symbol: "DNB.OL", type: "stock" },
  "dnb bank asa": { symbol: "DNB.OL", type: "stock" },
  "dnb.ol": { symbol: "DNB.OL", type: "stock" },

  "aker bp": { symbol: "AKRBP.OL", type: "stock" },
  akrbp: { symbol: "AKRBP.OL", type: "stock" },
  "akrbp.ol": { symbol: "AKRBP.OL", type: "stock" },

  telenor: { symbol: "TEL.OL", type: "stock" },
  tel: { symbol: "TEL.OL", type: "stock" },
  "tel.ol": { symbol: "TEL.OL", type: "stock" },

  "norsk hydro": { symbol: "NHY.OL", type: "stock" },
  hydro: { symbol: "NHY.OL", type: "stock" },
  nhy: { symbol: "NHY.OL", type: "stock" },
  "nhy.ol": { symbol: "NHY.OL", type: "stock" },

  mowi: { symbol: "MOWI.OL", type: "stock" },
  "mowi asa": { symbol: "MOWI.OL", type: "stock" },
  "mowi.ol": { symbol: "MOWI.OL", type: "stock" },

  orkla: { symbol: "ORK.OL", type: "stock" },
  ork: { symbol: "ORK.OL", type: "stock" },
  "ork.ol": { symbol: "ORK.OL", type: "stock" },

  salmar: { symbol: "SALM.OL", type: "stock" },
  salm: { symbol: "SALM.OL", type: "stock" },
  "salm.ol": { symbol: "SALM.OL", type: "stock" },

  yara: { symbol: "YAR.OL", type: "stock" },
  yar: { symbol: "YAR.OL", type: "stock" },
  "yar.ol": { symbol: "YAR.OL", type: "stock" },

  storebrand: { symbol: "STB.OL", type: "stock" },
  stb: { symbol: "STB.OL", type: "stock" },
  "stb.ol": { symbol: "STB.OL", type: "stock" },

  frontline: { symbol: "FRO.OL", type: "stock" },
  fro: { symbol: "FRO.OL", type: "stock" },
  "fro.ol": { symbol: "FRO.OL", type: "stock" },

  "subsea 7": { symbol: "SUBC.OL", type: "stock" },
  subsea7: { symbol: "SUBC.OL", type: "stock" },
  subc: { symbol: "SUBC.OL", type: "stock" },
  "subc.ol": { symbol: "SUBC.OL", type: "stock" },

  tomra: { symbol: "TOM.OL", type: "stock" },
  tom: { symbol: "TOM.OL", type: "stock" },
  "tom.ol": { symbol: "TOM.OL", type: "stock" },

  autostore: { symbol: "AUTO.OL", type: "stock" },
  auto: { symbol: "AUTO.OL", type: "stock" },
  "auto.ol": { symbol: "AUTO.OL", type: "stock" },

  nel: { symbol: "NEL.OL", type: "stock" },
  "nel asa": { symbol: "NEL.OL", type: "stock" },
  "nel.ol": { symbol: "NEL.OL", type: "stock" },

  pgs: { symbol: "PGS.OL", type: "stock" },
  "pgs asa": { symbol: "PGS.OL", type: "stock" },
  "pgs.ol": { symbol: "PGS.OL", type: "stock" },

  bakkafrost: { symbol: "BAKKA.OL", type: "stock" },
  bakka: { symbol: "BAKKA.OL", type: "stock" },
  "bakka.ol": { symbol: "BAKKA.OL", type: "stock" },

  "bw lpg": { symbol: "BWLPG.OL", type: "stock" },
  bwlpg: { symbol: "BWLPG.OL", type: "stock" },
  "bwlpg.ol": { symbol: "BWLPG.OL", type: "stock" },

  kitron: { symbol: "KIT.OL", type: "stock" },
  kit: { symbol: "KIT.OL", type: "stock" },
  "kit.ol": { symbol: "KIT.OL", type: "stock" },

  schibsted: { symbol: "SCHA.OL", type: "stock" },
  scha: { symbol: "SCHA.OL", type: "stock" },
  "scha.ol": { symbol: "SCHA.OL", type: "stock" },

  schibstedb: { symbol: "SCHB.OL", type: "stock" },
  schb: { symbol: "SCHB.OL", type: "stock" },
  "schb.ol": { symbol: "SCHB.OL", type: "stock" },

  borregaard: { symbol: "BRG.OL", type: "stock" },
  brg: { symbol: "BRG.OL", type: "stock" },
  "brg.ol": { symbol: "BRG.OL", type: "stock" },

  elkem: { symbol: "ELK.OL", type: "stock" },
  elk: { symbol: "ELK.OL", type: "stock" },
  "elk.ol": { symbol: "ELK.OL", type: "stock" },

  gjensidige: { symbol: "GJF.OL", type: "stock" },
  gjf: { symbol: "GJF.OL", type: "stock" },
  "gjf.ol": { symbol: "GJF.OL", type: "stock" },

  protector: { symbol: "PROT.OL", type: "stock" },
  prot: { symbol: "PROT.OL", type: "stock" },
  "prot.ol": { symbol: "PROT.OL", type: "stock" },

  sparebank1: { symbol: "SBO.OL", type: "stock" },
  sb1: { symbol: "SBO.OL", type: "stock" },
  sbo: { symbol: "SBO.OL", type: "stock" },
  "sbo.ol": { symbol: "SBO.OL", type: "stock" },

  wallenius: { symbol: "WAWI.OL", type: "stock" },
  wawi: { symbol: "WAWI.OL", type: "stock" },
  "wawi.ol": { symbol: "WAWI.OL", type: "stock" },

  hafnia: { symbol: "HAFNI.OL", type: "stock" },
  hafni: { symbol: "HAFNI.OL", type: "stock" },
  "hafni.ol": { symbol: "HAFNI.OL", type: "stock" },

  coolcompany: { symbol: "COOL.OL", type: "stock" },
  cool: { symbol: "COOL.OL", type: "stock" },
  "cool.ol": { symbol: "COOL.OL", type: "stock" },

  europris: { symbol: "EPR.OL", type: "stock" },
  epr: { symbol: "EPR.OL", type: "stock" },
  "epr.ol": { symbol: "EPR.OL", type: "stock" },

  crayon: { symbol: "CRAYN.OL", type: "stock" },
  crayn: { symbol: "CRAYN.OL", type: "stock" },
  "crayn.ol": { symbol: "CRAYN.OL", type: "stock" },

  bouvet: { symbol: "BOUV.OL", type: "stock" },
  bouv: { symbol: "BOUV.OL", type: "stock" },
  "bouv.ol": { symbol: "BOUV.OL", type: "stock" },

  atea: { symbol: "ATEA.OL", type: "stock" },
  "atea asa": { symbol: "ATEA.OL", type: "stock" },
  "atea.ol": { symbol: "ATEA.OL", type: "stock" },

  nordicsemi: { symbol: "NOD.OL", type: "stock" },
  "nordic semiconductor": { symbol: "NOD.OL", type: "stock" },
  nod: { symbol: "NOD.OL", type: "stock" },
  "nod.ol": { symbol: "NOD.OL", type: "stock" },

  kahoot: { symbol: "KAHOT.OL", type: "stock" },
  kahot: { symbol: "KAHOT.OL", type: "stock" },
  "kahot.ol": { symbol: "KAHOT.OL", type: "stock" },

  sats: { symbol: "SATS.OL", type: "stock" },
  "sats.ol": { symbol: "SATS.OL", type: "stock" },

  scatec: { symbol: "SCATC.OL", type: "stock" },
  scatc: { symbol: "SCATC.OL", type: "stock" },
  "scatc.ol": { symbol: "SCATC.OL", type: "stock" },

  // USA
  apple: { symbol: "AAPL", type: "stock" },
  "apple aksjen": { symbol: "AAPL", type: "stock" },
  aapl: { symbol: "AAPL", type: "stock" },

  microsoft: { symbol: "MSFT", type: "stock" },
  msft: { symbol: "MSFT", type: "stock" },

  nvidia: { symbol: "NVDA", type: "stock" },
  nvda: { symbol: "NVDA", type: "stock" },

  tesla: { symbol: "TSLA", type: "stock" },
  tsla: { symbol: "TSLA", type: "stock" },

  amazon: { symbol: "AMZN", type: "stock" },
  amzn: { symbol: "AMZN", type: "stock" },

  google: { symbol: "GOOGL", type: "stock" },
  alphabet: { symbol: "GOOGL", type: "stock" },
  googl: { symbol: "GOOGL", type: "stock" },

  meta: { symbol: "META", type: "stock" },
  facebook: { symbol: "META", type: "stock" },

  // Krypto
  bitcoin: { symbol: "BTC-USD", type: "crypto" },
  btc: { symbol: "BTC-USD", type: "crypto" },
  "btc-usd": { symbol: "BTC-USD", type: "crypto" },

  ethereum: { symbol: "ETH-USD", type: "crypto" },
  eth: { symbol: "ETH-USD", type: "crypto" },
  "eth-usd": { symbol: "ETH-USD", type: "crypto" },

  xrp: { symbol: "XRP-USD", type: "crypto" },
  "xrp-usd": { symbol: "XRP-USD", type: "crypto" },

  solana: { symbol: "SOL-USD", type: "crypto" },
  sol: { symbol: "SOL-USD", type: "crypto" },
  "sol-usd": { symbol: "SOL-USD", type: "crypto" },
};

function cleanQuery(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\banalyser\b/g, "")
    .replace(/\banalyse\b/g, "")
    .replace(/\baksjen\b/g, "")
    .replace(/\baksje\b/g, "")
    .replace(/\bkrypto\b/g, "")
    .replace(/\bcrypto\b/g, "")
    .replace(/\bpris\b/g, "")
    .replace(/\bkurs\b/g, "")
    .replace(/[.,!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferTypeFromSymbol(symbol: string): AssetType {
  if (symbol.endsWith("-USD")) return "crypto";
  return "stock";
}

async function resolveSymbol(raw: string): Promise<ResolvedSymbol | null> {
  const q = cleanQuery(raw);

  if (!q) return null;

  if (SYMBOLS[q]) {
    return SYMBOLS[q];
  }

  for (const [key, value] of Object.entries(SYMBOLS)) {
    if (q.includes(key)) {
      return value;
    }
  }

  try {
    const searchResult: any = await yahooFinance.search(q, {
      quotesCount: 10,
      newsCount: 0,
    });

    const quotes = Array.isArray(searchResult?.quotes) ? searchResult.quotes : [];

    const best = quotes.find((item: any) => {
      const symbol = String(item?.symbol ?? "");
      const shortname = String(item?.shortname ?? item?.longname ?? "").toLowerCase();
      const exchDisp = String(item?.exchDisp ?? "").toLowerCase();
      const quoteType = String(item?.quoteType ?? "").toLowerCase();

      return (
        symbol.endsWith(".OL") ||
        symbol.endsWith("-USD") ||
        exchDisp.includes("oslo") ||
        shortname.includes(q) ||
        symbol.toLowerCase() === q ||
        quoteType === "cryptocurrency"
      );
    });

    if (best?.symbol) {
      return {
        symbol: best.symbol,
        type: inferTypeFromSymbol(best.symbol),
      };
    }
  } catch {
    // fallback quietly
  }

  return null;
}

function formatUpdatedAt(date?: Date | string | null) {
  if (!date) return new Date().toLocaleString("nb-NO");
  return new Date(date).toLocaleString("nb-NO");
}

function buildChartPoints(
  price: number,
  previousClose: number,
  high: number,
  low: number
) {
  const start = previousClose || price;
  const end = price || start;
  const top = high || Math.max(start, end);
  const bottom = low || Math.min(start, end);

  const mid1 = start + (end - start) * 0.2;
  const mid2 = start + (end - start) * 0.4;
  const mid3 = start + (end - start) * 0.6;
  const mid4 = start + (end - start) * 0.8;

  const clamp = (v: number) => Math.max(bottom, Math.min(top, v));

  return [
    start,
    clamp(mid1 * 0.998),
    clamp(mid2 * 1.004),
    clamp(mid3 * 0.997),
    clamp(mid4 * 1.003),
    end,
  ].map((v) => Number(v.toFixed(2)));
}

function buildRecommendation(changePercent: number) {
  if (changePercent >= 2) {
    return { recommendation: "Kjøp" as const, score: 8, bias: "Positiv" };
  }

  if (changePercent <= -2) {
    return { recommendation: "Selg" as const, score: 4, bias: "Negativ" };
  }

  return { recommendation: "Hold" as const, score: 6, bias: "Nøytral" };
}

function buildAnalysis(
  type: AssetType,
  name: string,
  changePercent: number,
  support: number,
  resistance: number
) {
  const bullish = changePercent > 0;
  const bearish = changePercent < 0;

  const trend = bullish
    ? `${name} viser positiv utvikling med oppgang på ${changePercent.toFixed(2)}%.`
    : bearish
      ? `${name} viser svak utvikling med nedgang på ${Math.abs(changePercent).toFixed(2)}%.`
      : `${name} beveger seg sidelengs uten tydelig trend akkurat nå.`;

  const risk =
    type === "crypto"
      ? `Krypto har høyere volatilitet. Viktige nivåer er støtte rundt ${support.toFixed(2)} og motstand rundt ${resistance.toFixed(2)}.`
      : `Risikoen vurderes som moderat. Viktige nivåer er støtte rundt ${support.toFixed(2)} og motstand rundt ${resistance.toFixed(2)}.`;

  const conclusion = bullish
    ? `Kortsiktig bias er positiv så lenge kursen holder seg over støttenivået.`
    : bearish
      ? `Kortsiktig bias er svak, og bildet bedrer seg først hvis kursen tar tilbake motstandsnivået.`
      : `Markedet er avventende, og det mangler et klart brudd for å gi sterkere signaler.`;

  const timeframe = type === "crypto" ? "Kort til mellomlang sikt" : "Kort sikt";

  const why = bullish
    ? `Anbefalingen bygger på at prisutviklingen er positiv og at kursen ligger nær den øvre delen av dagens range.`
    : bearish
      ? `Anbefalingen er svakere fordi momentet er negativt og kursen ikke viser tydelig styrke over motstand.`
      : `Anbefalingen er nøytral fordi kursbildet er blandet og mangler tydelig retning.`;

  const uncertainty = bullish
    ? `Synet svekkes hvis kursen faller under støtte eller momentet snur negativt.`
    : bearish
      ? `Synet kan bli mer positivt hvis kursen bryter opp over motstand med ny styrke.`
      : `Synet endres hvis kursen bryter klart opp over motstand eller ned under støtte.`;

  return { trend, risk, conclusion, timeframe, why, uncertainty };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawQuery = String(body?.query ?? "").trim();

    if (!rawQuery) {
      return NextResponse.json(
        { error: "Du må skrive inn noe å analysere" },
        { status: 400 }
      );
    }

    const resolved = await resolveSymbol(rawQuery);

    if (!resolved) {
      return NextResponse.json(
        {
          error: "Fant ikke instrument",
          message: "Prøv f.eks. Equinor, DNB, Apple, Bitcoin, Ethereum, XRP eller Solana.",
        },
        { status: 404 }
      );
    }

    let quote: any;
    try {
      quote = await yahooFinance.quote(resolved.symbol);
    } catch (error: any) {
      return NextResponse.json(
        {
          error: "Kunne ikke hente markedsdata",
          message: error?.message ?? "Ukjent Yahoo Finance-feil",
        },
        { status: 500 }
      );
    }

    const price = Number(quote?.regularMarketPrice ?? 0);
    const previousClose = Number(
      quote?.regularMarketPreviousClose ?? quote?.regularMarketOpen ?? 0
    );
    const high = Number(quote?.regularMarketDayHigh ?? price);
    const low = Number(quote?.regularMarketDayLow ?? price);

    if (!price) {
      return NextResponse.json(
        {
          error: "Fant ikke kursdata",
          message: `Klarte ikke hente pris for ${resolved.symbol}`,
        },
        { status: 404 }
      );
    }

    const change = previousClose ? price - previousClose : 0;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    const support = Number((low || price * 0.98).toFixed(2));
    const resistance = Number((high || price * 1.02).toFixed(2));

    const rec = buildRecommendation(changePercent);
    const analysis = buildAnalysis(
      resolved.type,
      quote?.longName || quote?.shortName || resolved.symbol,
      changePercent,
      support,
      resistance
    );

    const result: AnalyzeResponse = {
      symbol: resolved.symbol,
      name: quote?.longName || quote?.shortName || resolved.symbol,
      type: resolved.type,
      price,
      previousClose,
      high,
      low,
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      recommendation: rec.recommendation,
      score: rec.score,
      bias: rec.bias,
      support,
      resistance,
      source: "Yahoo Finance",
      updatedAt: formatUpdatedAt(quote?.regularMarketTime),
      analysis,
      chart: {
        points: buildChartPoints(price, previousClose, high, low),
      },
    };

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Noe gikk galt",
        message: error?.message ?? "Ukjent feil",
      },
      { status: 500 }
    );
  }
}
