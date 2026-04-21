import { NextRequest, NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type AssetType = "stock" | "crypto";

type ResolvedSymbol = {
  symbol: string;
  name: string;
  type: AssetType;
};

type QuoteData = {
  c?: number; // current
  d?: number; // change
  dp?: number; // change %
  h?: number; // high
  l?: number; // low
  o?: number; // open
  pc?: number; // prev close
  t?: number; // timestamp
};

type AnalysisPayload = {
  recommendation: string;
  score: number;
  analysis: {
    trend: string;
    risk: string;
    conclusion: string;
    timeframe: string;
  };
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
  "mowi asa": { symbol: "MOWI.OL", name: "Mowi ASA", type: "stock" },
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
  bitcoin: { symbol: "BINANCE:BTCUSDT", name: "Bitcoin", type: "crypto" },
  btc: { symbol: "BINANCE:BTCUSDT", name: "Bitcoin", type: "crypto" },
  btcusdt: { symbol: "BINANCE:BTCUSDT", name: "Bitcoin", type: "crypto" },

  ethereum: { symbol: "BINANCE:ETHUSDT", name: "Ethereum", type: "crypto" },
  eth: { symbol: "BINANCE:ETHUSDT", name: "Ethereum", type: "crypto" },
  ethusdt: { symbol: "BINANCE:ETHUSDT", name: "Ethereum", type: "crypto" },

  solana: { symbol: "BINANCE:SOLUSDT", name: "Solana", type: "crypto" },
  sol: { symbol: "BINANCE:SOLUSDT", name: "Solana", type: "crypto" },
  solusdt: { symbol: "BINANCE:SOLUSDT", name: "Solana", type: "crypto" },

  xrp: { symbol: "BINANCE:XRPUSDT", name: "XRP", type: "crypto" },
  xrpusdt: { symbol: "BINANCE:XRPUSDT", name: "XRP", type: "crypto" },
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

async function fetchFinnhubQuote(symbol: string): Promise<QuoteData> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Finnhub quote error ${res.status}${errorText ? ` - ${errorText}` : ""}`);
  }

  const data = (await res.json()) as QuoteData;
  return data;
}

function buildFallbackAnalysis(asset: ResolvedSymbol, quote: QuoteData) {
  const current = Number(quote?.c ?? 0);
  const prevClose = Number(quote?.pc ?? 0);
  const high = Number(quote?.h ?? 0);
  const low = Number(quote?.l ?? 0);
  const changePct = Number(quote?.dp ?? 0);
  const absChange = current - prevClose;
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
      ? `${asset.name} viser en oppadgående trend med en endring på ${changePct.toFixed(2)}% i dag.`
      : changePct < 0
      ? `${asset.name} viser en nedadgående trend med en endring på ${changePct.toFixed(2)}% i dag.`
      : `${asset.name} er relativt flat i dag uten store bevegelser.`;

  const risk =
    intradayRangePct > 5
      ? `Risikoen vurderes som høy, fordi dagens svingninger har vært store mellom ${low.toFixed(2)} og ${high.toFixed(2)}.`
      : intradayRangePct > 2
      ? `Risikoen vurderes som moderat, med merkbare dagssvingninger mellom ${low.toFixed(2)} og ${high.toFixed(2)}.`
      : `Risikoen vurderes som lav til moderat, fordi kursen har vært forholdsvis stabil gjennom dagen.`;

  const conclusion =
    recommendation === "Kjøp"
      ? `Utviklingen er foreløpig positiv, og instrumentet kan være interessant å følge videre dersom momentet fortsetter.`
      : recommendation === "Selg"
      ? `Utviklingen er svak akkurat nå, og det kan være lurt å være forsiktig til trenden bedrer seg.`
      : `Bildet er blandet akkurat nå, og det kan være fornuftig å avvente tydeligere signaler.`;

  const timeframe = asset.type === "crypto" ? "Kort til mellomlang sikt" : "Kort sikt";

  return {
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    price: current,
    previousClose: prevClose,
    high,
    low,
    change: absChange,
    changePercent: changePct,
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

function safeJsonParse<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

function stripCodeFences(input: string) {
  return input
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

async function buildOpenAIAnalysis(asset: ResolvedSymbol, quote: QuoteData): Promise<AnalysisPayload | null> {
  if (!OPENAI_API_KEY) return null;

  const current = Number(quote?.c ?? 0);
  const prevClose = Number(quote?.pc ?? 0);
  const high = Number(quote?.h ?? 0);
  const low = Number(quote?.l ?? 0);
  const changePct = Number(quote?.dp ?? 0);

  const prompt = `
Du er en norsk finansassistent.
Svar KUN med gyldig JSON, uten markdown og uten ekstra tekst.

Analyser følgende instrument:
Navn: ${asset.name}
Symbol: ${asset.symbol}
Type: ${asset.type}
Siste pris: ${current}
Forrige sluttkurs: ${prevClose}
Dagens høy: ${high}
Dagens lav: ${low}
Dagsendring i prosent: ${changePct}

Returner JSON i nøyaktig dette formatet:
{
  "recommendation": "Kjøp",
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

  if (!res.ok) return null;

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") return null;

  const parsed = safeJsonParse<AnalysisPayload>(stripCodeFences(content));
  if (!parsed) return null;

  if (
    !parsed.recommendation ||
    typeof parsed.score !== "number" ||
    !parsed.analysis?.trend ||
    !parsed.analysis?.risk ||
    !parsed.analysis?.conclusion ||
    !parsed.analysis?.timeframe
  ) {
    return null;
  }

  return parsed;
}

function buildLegacyResultText(payload: {
  recommendation: string;
  score: number;
  analysis: {
    trend: string;
    risk: string;
    conclusion: string;
    timeframe: string;
  };
}) {
  return [
    `Trend: ${payload.analysis.trend}`,
    `Risiko: ${payload.analysis.risk}`,
    `Kort konklusjon: ${payload.analysis.conclusion}`,
    `Anbefaling: ${payload.recommendation}`,
    `Score: ${payload.score}`,
    `Tidsvurdering: ${payload.analysis.timeframe}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    if (!FINNHUB_API_KEY) {
      return NextResponse.json({ error: "FINNHUB_API_KEY mangler" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
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
          message: "Prøv f.eks. Equinor, DNB, Aker BP, Apple, Bitcoin eller Ethereum.",
        },
        { status: 404 }
      );
    }

    const quote = await fetchFinnhubQuote(asset.symbol);

    if (!quote || Number(quote?.c ?? 0) === 0) {
      return NextResponse.json(
        {
          error: "Fant ikke kursdata",
          message: `Klarte ikke hente kursdata for ${asset.symbol}`,
        },
        { status: 404 }
      );
    }

    const fallback = buildFallbackAnalysis(asset, quote);
    const aiAnalysis = await buildOpenAIAnalysis(asset, quote);

    const merged = aiAnalysis
      ? {
          ...fallback,
          recommendation: aiAnalysis.recommendation ?? fallback.recommendation,
          score: typeof aiAnalysis.score === "number" ? aiAnalysis.score : fallback.score,
          analysis: {
            trend: aiAnalysis.analysis?.trend ?? fallback.analysis.trend,
            risk: aiAnalysis.analysis?.risk ?? fallback.analysis.risk,
            conclusion: aiAnalysis.analysis?.conclusion ?? fallback.analysis.conclusion,
            timeframe: aiAnalysis.analysis?.timeframe ?? fallback.analysis.timeframe,
          },
        }
      : fallback;

    return NextResponse.json({
      ok: true,
      ...merged,
      result: buildLegacyResultText({
        recommendation: merged.recommendation,
        score: merged.score,
        analysis: merged.analysis,
      }),
    });
  } catch (error) {
    console.error("Analyze error:", error);

    const message =
      error instanceof Error ? error.message : "Ukjent feil";

    return NextResponse.json(
      {
        error: "Noe gikk galt",
        message,
      },
      { status: 500 }
    );
  }
}
