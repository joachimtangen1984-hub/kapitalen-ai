import OpenAI from "openai";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const redis = Redis.fromEnv();

const FREE_ANALYSES_PER_DAY = 3;

type AssetType = "stock" | "crypto";

type ResolvedAsset =
  | {
      type: "stock";
      symbol: string;
      displayName: string;
    }
  | {
      type: "crypto";
      coinId: string;
      displayName: string;
      symbol?: string;
    };

const STOCK_MAP: Record<string, { symbol: string; displayName: string }> = {
  apple: { symbol: "AAPL", displayName: "Apple (AAPL)" },
  aapl: { symbol: "AAPL", displayName: "Apple (AAPL)" },

  microsoft: { symbol: "MSFT", displayName: "Microsoft (MSFT)" },
  msft: { symbol: "MSFT", displayName: "Microsoft (MSFT)" },

  tesla: { symbol: "TSLA", displayName: "Tesla (TSLA)" },
  tsla: { symbol: "TSLA", displayName: "Tesla (TSLA)" },

  nvidia: { symbol: "NVDA", displayName: "NVIDIA (NVDA)" },
  nvda: { symbol: "NVDA", displayName: "NVIDIA (NVDA)" },

  amazon: { symbol: "AMZN", displayName: "Amazon (AMZN)" },
  amzn: { symbol: "AMZN", displayName: "Amazon (AMZN)" },

  meta: { symbol: "META", displayName: "Meta (META)" },
  facebook: { symbol: "META", displayName: "Meta (META)" },

  alphabet: { symbol: "GOOGL", displayName: "Alphabet (GOOGL)" },
  google: { symbol: "GOOGL", displayName: "Alphabet (GOOGL)" },
  googl: { symbol: "GOOGL", displayName: "Alphabet (GOOGL)" },

  equinor: { symbol: "EQNR.OL", displayName: "Equinor (EQNR.OL)" },
  eqnr: { symbol: "EQNR.OL", displayName: "Equinor (EQNR.OL)" },
  "eqnr.ol": { symbol: "EQNR.OL", displayName: "Equinor (EQNR.OL)" },

  dnb: { symbol: "DNB.OL", displayName: "DNB (DNB.OL)" },
  "dnb.ol": { symbol: "DNB.OL", displayName: "DNB (DNB.OL)" },

  nordnet: { symbol: "SAVE.ST", displayName: "Nordnet (SAVE.ST)" },
};

const CRYPTO_MAP: Record<
  string,
  { coinId: string; displayName: string; symbol: string }
> = {
  bitcoin: { coinId: "bitcoin", displayName: "Bitcoin (BTC)", symbol: "BTC" },
  btc: { coinId: "bitcoin", displayName: "Bitcoin (BTC)", symbol: "BTC" },

  ethereum: {
    coinId: "ethereum",
    displayName: "Ethereum (ETH)",
    symbol: "ETH",
  },
  eth: { coinId: "ethereum", displayName: "Ethereum (ETH)", symbol: "ETH" },

  solana: { coinId: "solana", displayName: "Solana (SOL)", symbol: "SOL" },
  sol: { coinId: "solana", displayName: "Solana (SOL)", symbol: "SOL" },

  xrp: { coinId: "ripple", displayName: "XRP (XRP)", symbol: "XRP" },
  ripple: { coinId: "ripple", displayName: "XRP (XRP)", symbol: "XRP" },

  cardano: { coinId: "cardano", displayName: "Cardano (ADA)", symbol: "ADA" },
  ada: { coinId: "cardano", displayName: "Cardano (ADA)", symbol: "ADA" },

  dogecoin: {
    coinId: "dogecoin",
    displayName: "Dogecoin (DOGE)",
    symbol: "DOGE",
  },
  doge: {
    coinId: "dogecoin",
    displayName: "Dogecoin (DOGE)",
    symbol: "DOGE",
  },

  bnb: { coinId: "binancecoin", displayName: "BNB (BNB)", symbol: "BNB" },
};

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:()]/g, " ")
    .replace(/\s+/g, " ");
}

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getUsage(ip: string) {
  const key = `usage:${ip}:${getTodayKey()}`;
  const used = (await redis.get<number>(key)) ?? 0;
  return {
    key,
    used,
    remaining: Math.max(0, FREE_ANALYSES_PER_DAY - used),
  };
}

async function incrementUsage(key: string) {
  const next = await redis.incr(key);
  await redis.expire(key, 60 * 60 * 24 * 2);
  return next;
}

function resolveAssetFromMessage(message: string): ResolvedAsset | null {
  const normalized = normalizeText(message);

  for (const [key, stock] of Object.entries(STOCK_MAP)) {
    if (normalized.includes(key)) {
      return {
        type: "stock",
        symbol: stock.symbol,
        displayName: stock.displayName,
      };
    }
  }

  for (const [key, crypto] of Object.entries(CRYPTO_MAP)) {
    if (normalized.includes(key)) {
      return {
        type: "crypto",
        coinId: crypto.coinId,
        displayName: crypto.displayName,
        symbol: crypto.symbol,
      };
    }
  }

  return null;
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "ukjent";
  }

  return new Intl.NumberFormat("no-NO", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatWhole(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "ukjent";
  }

  return new Intl.NumberFormat("no-NO", {
    maximumFractionDigits: 0,
  }).format(value);
}

async function fetchStockContext(symbol: string, displayName: string) {
  const finnhubKey = process.env.FINNHUB_API_KEY;

  if (!finnhubKey) {
    throw new Error("FINNHUB_API_KEY mangler.");
  }

  const quoteRes = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${finnhubKey}`,
    { cache: "no-store" }
  );

  if (!quoteRes.ok) {
    throw new Error("Kunne ikke hente aksjedata.");
  }

  const quote = await quoteRes.json();

  if (!quote || typeof quote.c !== "number" || quote.c === 0) {
    throw new Error("Fant ikke gyldige aksjedata.");
  }

  const intradayRange =
    typeof quote.h === "number" && typeof quote.l === "number"
      ? quote.h - quote.l
      : null;

  const distanceFromHigh =
    typeof quote.h === "number" && typeof quote.c === "number"
      ? quote.h - quote.c
      : null;

  const distanceFromLow =
    typeof quote.c === "number" && typeof quote.l === "number"
      ? quote.c - quote.l
      : null;

  const marketContext = `
Instrument: Aksje
Navn: ${displayName}
Ticker: ${symbol}
Siste pris: ${formatNumber(quote.c)} NOK/USD avhengig av børs
Endring i dag: ${formatNumber(quote.d)}
Endring i prosent i dag: ${formatNumber(quote.dp)}%
Dagens høy: ${formatNumber(quote.h)}
Dagens lav: ${formatNumber(quote.l)}
Forrige sluttkurs: ${formatNumber(quote.pc)}
Intradag-spenn: ${formatNumber(intradayRange)}
Avstand fra dagens høy: ${formatNumber(distanceFromHigh)}
Avstand fra dagens lav: ${formatNumber(distanceFromLow)}
`.trim();

  return {
    marketContext,
    assetName: displayName,
    assetType: "stock" as AssetType,
  };
}

async function fetchCryptoContext(coinId: string, displayName: string) {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=nok&ids=${encodeURIComponent(
    coinId
  )}&price_change_percentage=24h,7d&sparkline=false`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Kunne ikke hente kryptodata.");
  }

  const data = await res.json();
  const coin = Array.isArray(data) ? data[0] : null;

  if (!coin) {
    throw new Error("Fant ikke gyldige kryptodata.");
  }

  const marketContext = `
Instrument: Kryptovaluta
Navn: ${displayName}
CoinGecko ID: ${coinId}
Pris i NOK: ${formatNumber(coin.current_price)}
24t endring i prosent: ${formatNumber(coin.price_change_percentage_24h)}%
7d endring i prosent: ${formatNumber(coin.price_change_percentage_7d_in_currency)}%
24t høy: ${formatNumber(coin.high_24h)}
24t lav: ${formatNumber(coin.low_24h)}
Markedsverdi: ${formatWhole(coin.market_cap)} NOK
24t volum: ${formatWhole(coin.total_volume)} NOK
Sirkulerende mengde: ${formatWhole(coin.circulating_supply)}
All time high: ${formatNumber(coin.ath)}
Avstand fra ATH i prosent: ${formatNumber(coin.ath_change_percentage)}%
`.trim();

  return {
    marketContext,
    assetName: displayName,
    assetType: "crypto" as AssetType,
  };
}

function buildSystemPrompt() {
  return `
Du er en erfaren norsk finansanalytiker.

Du analyserer aksjer og kryptovaluta basert på live markedsdata som brukeren får oppgitt.
Skriv alltid på tydelig, enkel og profesjonell norsk.

Regler:
- Vær konkret og kortfattet
- Bruk tallene aktivt i vurderingen
- Ikke gi garanti eller late som du kjenner fremtiden
- Skill mellom kortsiktig signal og mer overordnet kvalitet
- Hvis dataene er begrensede, si det tydelig
- Ikke bruk markdown-tabeller
- Ikke skriv lange disclaimere
- Ikke bruk emojis
- Ikke skriv noe utenfor formatet under

Svar alltid i nøyaktig dette formatet:

1) Trend: ...
2) Risiko: ...
3) Fundamentalt signal: ...
4) Momentum: ...
5) Kort konklusjon: ...
6) Anbefaling: Kjøp/Hold/Selg
7) Score: x/10
8) Tidsvurdering: Kortsiktig/Langsiktig

Tolkningsregler:
- "Kjøp" brukes bare når signalene samlet er tydelig positive
- "Hold" brukes når bildet er blandet, moderat positivt eller usikkert
- "Selg" brukes når signalene er tydelig svake eller risikoen er høy
- Score skal være realistisk og bygge på dataene
- Kortsiktig betyr primært basert på siste 24 timer til 7 dager
- Langsiktig brukes bare når tallene antyder mer robust kvalitet enn bare kortsiktig bevegelse
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body?.message ?? "").trim();

    if (!message) {
      return NextResponse.json(
        { error: "Mangler analyseforespørsel." },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const usage = await getUsage(ip);

    if (usage.used >= FREE_ANALYSES_PER_DAY) {
      return NextResponse.json(
        {
          error: "Gratisgrensen er nådd for i dag.",
          remaining: 0,
          limitReached: true,
        },
        { status: 429 }
      );
    }

    const asset = resolveAssetFromMessage(message);

    if (!asset) {
      return NextResponse.json(
        {
          error:
            "Jeg fant ikke hvilket instrument du vil analysere. Prøv for eksempel 'analyser Apple aksjen' eller 'analyser bitcoin'.",
          remaining: usage.remaining,
        },
        { status: 400 }
      );
    }

    let marketContext = "";
    let assetName = "";

    if (asset.type === "stock") {
      const stockData = await fetchStockContext(asset.symbol, asset.displayName);
      marketContext = stockData.marketContext;
      assetName = stockData.assetName;
    } else {
      const cryptoData = await fetchCryptoContext(asset.coinId, asset.displayName);
      marketContext = cryptoData.marketContext;
      assetName = cryptoData.assetName;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: `
Brukerens forespørsel:
${message}

Live markedsdata:
${marketContext}

Lag en kort, konkret analyse på norsk i det faste formatet.
`.trim(),
        },
      ],
    });

    const result =
      completion.choices[0]?.message?.content?.trim() ??
      "Ingen analyse mottatt.";

    const newUsed = await incrementUsage(usage.key);
    const remaining = Math.max(0, FREE_ANALYSES_PER_DAY - newUsed);

    return NextResponse.json({
      result,
      remaining,
      limitReached: false,
      assetName,
    });
  } catch (error) {
    console.error("Analyze API error:", error);

    return NextResponse.json(
      {
        error: "Noe gikk galt under analysen. Prøv igjen.",
      },
      { status: 500 }
    );
  }
}
