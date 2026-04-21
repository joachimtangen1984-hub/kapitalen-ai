import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Redis } from "@upstash/redis";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Upstash/Vercel KV envs fra integrasjonen din
const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

const redis =
  KV_REST_API_URL && KV_REST_API_TOKEN
    ? new Redis({
        url: KV_REST_API_URL,
        token: KV_REST_API_TOKEN,
      })
    : null;

const FREE_LIMIT_PER_DAY = 3;

// Håndmapping for mest vanlige ting.
// Du kan utvide denne listen når du vil.
const MANUAL_SYMBOLS: Record<string, string> = {
  // Oslo Børs
  "equinor": "EQNR.OL",
  "eqnr": "EQNR.OL",
  "dnb": "DNB.OL",
  "dnb bank": "DNB.OL",
  "aker bp": "AKRBP.OL",
  "akrbp": "AKRBP.OL",
  "norsk hydro": "NHY.OL",
  "hydro": "NHY.OL",
  "orkla": "ORK.OL",
  "mowi": "MOWI.OL",
  "salmar": "SALM.OL",
  "telenor": "TEL.OL",
  "yara": "YAR.OL",
  "gjensidige": "GJF.OL",
  "kongsberg gruppen": "KOG.OL",
  "kongsberg": "KOG.OL",
  "storebrand": "STB.OL",
  "schibsted": "SCHA.OL",
  "borregaard": "BRG.OL",
  "tomra": "TOM.OL",
  "frontline": "FRO.OL",

  // USA / internasjonalt
  "apple": "AAPL",
  "aapl": "AAPL",
  "microsoft": "MSFT",
  "msft": "MSFT",
  "tesla": "TSLA",
  "tsla": "TSLA",
  "nvidia": "NVDA",
  "nvda": "NVDA",
  "meta": "META",
  "amazon": "AMZN",
  "google": "GOOGL",
  "alphabet": "GOOGL",
  "netflix": "NFLX",
  "amd": "AMD",

  // Krypto via Finnhub quote
  "bitcoin": "BINANCE:BTCUSDT",
  "btc": "BINANCE:BTCUSDT",
  "ethereum": "BINANCE:ETHUSDT",
  "eth": "BINANCE:ETHUSDT",
  "solana": "BINANCE:SOLUSDT",
  "sol": "BINANCE:SOLUSDT",
  "xrp": "BINANCE:XRPUSDT",
  "ripple": "BINANCE:XRPUSDT",
  "cardano": "BINANCE:ADAUSDT",
  "ada": "BINANCE:ADAUSDT",
  "dogecoin": "BINANCE:DOGEUSDT",
  "doge": "BINANCE:DOGEUSDT",
};

type FinnhubQuote = {
  c: number;  // current
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
};

type FinnhubSearchItem = {
  description?: string;
  displaySymbol?: string;
  symbol?: string;
  type?: string;
};

type AnalysisSections = {
  trend: string;
  risiko: string;
  kortKonklusjon: string;
  tidsvurdering: string;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}.\s:-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanQuery(input: string) {
  return normalizeText(input)
    .replace(/\banalyser\b/g, "")
    .replace(/\banalyse\b/g, "")
    .replace(/\baksjen\b/g, "")
    .replace(/\baksje\b/g, "")
    .replace(/\bkrypto\b/g, "")
    .replace(/\bcoin\b/g, "")
    .replace(/\bmynten\b/g, "")
    .replace(/\bmynt\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getClientId(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");

  const ip =
    forwarded?.split(",")[0]?.trim() ||
    realIp ||
    cfIp ||
    "anonymous";

  return ip;
}

function getTodayKeyPart() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildDailyKey(clientId: string) {
  return `kapitalen:free:${getTodayKeyPart()}:${clientId}`;
}

function buildHistoryKey(clientId: string) {
  return `kapitalen:history:${clientId}`;
}

function isCryptoSymbol(symbol: string) {
  return symbol.includes(":") || symbol.endsWith("USDT");
}

function formatPercent(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0,00";
  return value.toFixed(2).replace(".", ",");
}

function formatPrice(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0,00";
  return value.toFixed(2).replace(".", ",");
}

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

function heuristicRecommendation(
  quote: FinnhubQuote,
  symbol: string
): { score: number; recommendation: "Kjøp" | "Hold" | "Selg" } {
  const changePct = Number(quote.dp || 0);
  const open = Number(quote.o || 0);
  const high = Number(quote.h || 0);
  const low = Number(quote.l || 0);
  const current = Number(quote.c || 0);
  const prevClose = Number(quote.pc || 0);

  const intradayRangePct =
    open > 0 ? ((high - low) / open) * 100 : 0;

  const abovePrevClose = current > prevClose ? 1 : -1;
  const closeToHigh = high > 0 ? 1 - (high - current) / high : 0;

  let score =
    5 +
    changePct * 0.45 +
    abovePrevClose * 0.8 +
    closeToHigh * 1.2 -
    intradayRangePct * 0.18;

  if (isCryptoSymbol(symbol)) {
    // krypto er normalt mer volatil => litt mer konservativ score
    score -= 0.5;
  }

  const rounded = clamp(Math.round(score), 1, 10);

  if (rounded >= 8) return { score: rounded, recommendation: "Kjøp" };
  if (rounded >= 6) return { score: rounded, recommendation: "Hold" };
  return { score: rounded, recommendation: "Selg" };
}

function buildFallbackText(
  assetLabel: string,
  quote: FinnhubQuote,
  recommendation: string,
  score: number,
  symbol: string
) {
  const intradayRangePct =
    quote.o > 0 ? ((quote.h - quote.l) / quote.o) * 100 : 0;

  const trend =
    quote.dp > 0
      ? `${assetLabel} viser positiv utvikling med ${formatPercent(
          quote.dp
        )}% endring siste handelsperiode.`
      : quote.dp < 0
      ? `${assetLabel} viser svakhet med ${formatPercent(
          quote.dp
        )}% nedgang siste handelsperiode.`
      : `${assetLabel} beveger seg sidelengs uten tydelig retning siste handelsperiode.`;

  const risiko =
    intradayRangePct > 4
      ? `Volatiliteten er høy. Dagens spenn mellom lav og høy kurs tilsvarer omtrent ${formatPercent(
          intradayRangePct
        )}%, noe som øker risikoen.`
      : `Volatiliteten virker moderat. Dagens spenn mellom lav og høy kurs er omtrent ${formatPercent(
          intradayRangePct
        )}%.`;

  const kortKonklusjon =
    recommendation === "Kjøp"
      ? `${assetLabel} ser teknisk sterk ut akkurat nå, men vurder alltid risiko og inngangsnivå før kjøp.`
      : recommendation === "Hold"
      ? `${assetLabel} ser relativt balansert ut nå. Å holde kan være fornuftig til markedet viser tydeligere retning.`
      : `${assetLabel} ser svakere ut akkurat nå. Det kan være fornuftig å avvente til trenden bedrer seg.`;

  const tidsvurdering = isCryptoSymbol(symbol)
    ? "Kort til mellomlang sikt."
    : "Kort sikt, med behov for ny vurdering ved neste store kursbevegelse.";

  return {
    trend,
    risiko,
    kortKonklusjon,
    tidsvurdering,
    result: [
      `TREND\n${trend}`,
      `RISIKO\n${risiko}`,
      `KORT KONKLUSJON\n${kortKonklusjon}`,
      `TIDSVURDERING\n${tidsvurdering}`,
      `ANBEFALING\n${recommendation}`,
      `SCORE\n${score}/10`,
    ].join("\n\n"),
  };
}

async function finnhubFetch<T>(path: string) {
  if (!FINNHUB_API_KEY) {
    throw new Error("FINNHUB_API_KEY mangler.");
  }

  const url = `https://finnhub.io/api/v1${path}${
    path.includes("?") ? "&" : "?"
  }token=${FINNHUB_API_KEY}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Finnhub-feil (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

async function resolveSymbol(rawQuery: string) {
  const query = cleanQuery(rawQuery);

  if (!query) return null;

  if (MANUAL_SYMBOLS[query]) {
    return {
      symbol: MANUAL_SYMBOLS[query],
      assetLabel: query,
    };
  }

  // dersom query allerede ser ut som ticker
  if (/^[A-Z0-9:.]{2,15}$/.test(rawQuery.trim())) {
    return {
      symbol: rawQuery.trim().toUpperCase(),
      assetLabel: rawQuery.trim().toUpperCase(),
    };
  }

  const data = await finnhubFetch<{ count?: number; result?: FinnhubSearchItem[] }>(
    `/search?q=${encodeURIComponent(query)}`
  );

  const results = Array.isArray(data.result) ? data.result : [];
  if (!results.length) return null;

  const normalizedQuery = normalizeText(query);

  // prioriter Oslo Børs hvis bruker skriver norske selskapsnavn eller "aksjen"
  const wantsNorwegian =
    rawQuery.toLowerCase().includes("aksj") ||
    ["equinor", "dnb", "orkla", "mowi", "telenor", "yara", "hydro", "norsk hydro", "aker bp", "salmar", "gjensidige", "kongsberg", "storebrand", "schibsted", "borregaard", "tomra", "frontline"].some((name) =>
      normalizedQuery.includes(name)
    );

  const scored = results.map((item) => {
    const symbol = normalizeText(item.symbol || "");
    const display = normalizeText(item.displaySymbol || "");
    const description = normalizeText(item.description || "");

    let score = 0;

    if (symbol === normalizedQuery || display === normalizedQuery) score += 100;
    if (description === normalizedQuery) score += 90;
    if (symbol.includes(normalizedQuery)) score += 45;
    if (display.includes(normalizedQuery)) score += 40;
    if (description.includes(normalizedQuery)) score += 30;

    if (wantsNorwegian) {
      if ((item.symbol || "").endsWith(".OL")) score += 60;
      if ((item.displaySymbol || "").endsWith(".OL")) score += 50;
      if (description.includes("oslo")) score += 20;
      if (description.includes("norway")) score += 15;
    }

    // ikke prioriter warrants/funds hvis vi kan unngå det
    if ((item.type || "").toLowerCase().includes("common stock")) score += 12;
    if ((item.type || "").toLowerCase().includes("etf")) score -= 5;
    if ((item.type || "").toLowerCase().includes("fund")) score -= 8;

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0]?.item;
  if (!best?.symbol) return null;

  return {
    symbol: best.symbol,
    assetLabel: best.description || best.displaySymbol || best.symbol,
  };
}

async function getQuote(symbol: string) {
  return finnhubFetch<FinnhubQuote>(`/quote?symbol=${encodeURIComponent(symbol)}`);
}

async function getProfile(symbol: string) {
  try {
    return await finnhubFetch<{
      name?: string;
      ticker?: string;
      exchange?: string;
      currency?: string;
      finnhubIndustry?: string;
      logo?: string;
      country?: string;
    }>(`/stock/profile2?symbol=${encodeURIComponent(symbol)}`);
  } catch {
    return null;
  }
}

async function buildLLMAnalysis(input: {
  assetLabel: string;
  symbol: string;
  quote: FinnhubQuote;
  recommendation: "Kjøp" | "Hold" | "Selg";
  score: number;
  profile?: Record<string, unknown> | null;
}) {
  if (!openai) {
    return null;
  }

  const promptData = {
    assetLabel: input.assetLabel,
    symbol: input.symbol,
    currentPrice: input.quote.c,
    change: input.quote.d,
    changePercent: input.quote.dp,
    dayHigh: input.quote.h,
    dayLow: input.quote.l,
    dayOpen: input.quote.o,
    previousClose: input.quote.pc,
    recommendation: input.recommendation,
    score: input.score,
    profile: input.profile || null,
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
Du er en nøktern norsk finansanalytiker.
Skriv kort, konkret og uten hype.
Bruk BARE dataene du får.
Ikke dikt opp fundamentale forhold som ikke finnes i input.

Svar KUN som gyldig JSON med denne formen:
{
  "trend": "kort tekst",
  "risiko": "kort tekst",
  "kortKonklusjon": "kort tekst",
  "tidsvurdering": "kort tekst",
  "recommendation": "Kjøp | Hold | Selg",
  "score": 1-10
}
        `.trim(),
      },
      {
        role: "user",
        content: JSON.stringify(promptData),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as {
      trend: string;
      risiko: string;
      kortKonklusjon: string;
      tidsvurdering: string;
      recommendation: "Kjøp" | "Hold" | "Selg";
      score: number;
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!FINNHUB_API_KEY) {
      return NextResponse.json(
        { error: "FINNHUB_API_KEY mangler på serveren." },
        { status: 500 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY mangler på serveren." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const rawMessage = String(body?.message || "").trim();

    if (!rawMessage) {
      return NextResponse.json(
        { error: "Du må skrive hva som skal analyseres." },
        { status: 400 }
      );
    }

    const clientId = getClientId(req);

    let usedToday = 0;
    let remainingFreeToday = FREE_LIMIT_PER_DAY;

    if (redis) {
      const key = buildDailyKey(clientId);
      const current = Number((await redis.get<number>(key)) || 0);

      if (current >= FREE_LIMIT_PER_DAY) {
        return NextResponse.json(
          {
            error: "Gratisgrensen er nådd.",
            limitReached: true,
            remainingFreeToday: 0,
          },
          { status: 429 }
        );
      }

      usedToday = await redis.incr(key);
      if (usedToday === 1) {
        await redis.expire(key, 60 * 60 * 24);
      }

      remainingFreeToday = Math.max(0, FREE_LIMIT_PER_DAY - usedToday);
    }

    const resolved = await resolveSymbol(rawMessage);

    if (!resolved?.symbol) {
      return NextResponse.json(
        {
          error:
            "Fant ikke et gyldig symbol. Prøv for eksempel 'Equinor', 'DNB', 'Apple', 'Bitcoin' eller en ticker som AAPL / EQNR.OL.",
          remainingFreeToday,
        },
        { status: 404 }
      );
    }

    const quote = await getQuote(resolved.symbol);

    if (!quote || !Number(quote.c)) {
      return NextResponse.json(
        {
          error:
            "Fant symbol, men fikk ikke gyldige markedsdata tilbake. Prøv en annen aksje eller krypto.",
          symbol: resolved.symbol,
          remainingFreeToday,
        },
        { status: 404 }
      );
    }

    const profile = await getProfile(resolved.symbol);
    const heuristic = heuristicRecommendation(quote, resolved.symbol);

    const llm = await buildLLMAnalysis({
      assetLabel: resolved.assetLabel,
      symbol: resolved.symbol,
      quote,
      recommendation: heuristic.recommendation,
      score: heuristic.score,
      profile,
    });

    const finalRecommendation =
      llm?.recommendation || heuristic.recommendation;
    const finalScore = clamp(
      Number(llm?.score || heuristic.score),
      1,
      10
    );

    const fallback = buildFallbackText(
      resolved.assetLabel,
      quote,
      finalRecommendation,
      finalScore,
      resolved.symbol
    );

    const sections: AnalysisSections = {
      trend: llm?.trend || fallback.trend,
      risiko: llm?.risiko || fallback.risiko,
      kortKonklusjon:
        llm?.kortKonklusjon || fallback.kortKonklusjon,
      tidsvurdering: llm?.tidsvurdering || fallback.tidsvurdering,
    };

    const resultText = [
      `TREND\n${sections.trend}`,
      `RISIKO\n${sections.risiko}`,
      `KORT KONKLUSJON\n${sections.kortKonklusjon}`,
      `TIDSVURDERING\n${sections.tidsvurdering}`,
      `ANBEFALING\n${finalRecommendation}`,
      `SCORE\n${finalScore}/10`,
    ].join("\n\n");

    if (redis) {
      const historyKey = buildHistoryKey(clientId);
      await redis.lpush(
        historyKey,
        JSON.stringify({
          query: rawMessage,
          symbol: resolved.symbol,
          assetLabel: resolved.assetLabel,
          recommendation: finalRecommendation,
          score: finalScore,
          at: Date.now(),
        })
      );
      await redis.ltrim(historyKey, 0, 19);
      await redis.expire(historyKey, 60 * 60 * 24 * 30);
    }

    return NextResponse.json({
      ok: true,
      symbol: resolved.symbol,
      assetLabel: resolved.assetLabel,
      recommendation: finalRecommendation,
      score: finalScore,
      sections,
      quote: {
        current: quote.c,
        change: quote.d,
        changePercent: quote.dp,
        high: quote.h,
        low: quote.l,
        open: quote.o,
        previousClose: quote.pc,
      },
      result: resultText,
      remainingFreeToday,
    });
  } catch (error) {
    console.error("Analyse-feil:", error);

    return NextResponse.json(
      {
        error: "Noe gikk galt i backend. Sjekk logger i Vercel.",
      },
      { status: 500 }
    );
  }
}
