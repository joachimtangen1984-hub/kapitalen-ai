import OpenAI from "openai";
import { kv } from "@vercel/kv";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DAILY_FREE_LIMIT = 3;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getClientIp(req: Request) {
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

async function checkAndIncrementUsage(req: Request) {
  const ip = getClientIp(req);
  const today = getTodayKey();
  const key = `usage:${ip}:${today}`;

  const current = (await kv.get<number>(key)) ?? 0;

  if (current >= DAILY_FREE_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      count: current,
    };
  }

  const newCount = await kv.incr(key);

  if (newCount === 1) {
    await kv.expire(key, 60 * 60 * 24);
  }

  return {
    allowed: true,
    remaining: Math.max(0, DAILY_FREE_LIMIT - newCount),
    count: newCount,
  };
}

function detectAssetType(input: string) {
  const text = input.toLowerCase();

  if (
    text.includes("bitcoin") ||
    text.includes("btc") ||
    text.includes("ethereum") ||
    text.includes("eth") ||
    text.includes("solana") ||
    text.includes("sol")
  ) {
    return "crypto";
  }

  return "stock";
}

function mapCryptoId(input: string) {
  const text = input.toLowerCase();

  if (text.includes("bitcoin") || text.includes("btc")) return "bitcoin";
  if (text.includes("ethereum") || text.includes("eth")) return "ethereum";
  if (text.includes("solana") || text.includes("sol")) return "solana";

  return null;
}

function mapStockSymbol(input: string) {
  const text = input.toLowerCase();

  if (text.includes("apple") || text.includes("aapl")) return "AAPL";
  if (text.includes("tesla") || text.includes("tsla")) return "TSLA";
  if (text.includes("equinor") || text.includes("eqnr")) return "EQNR";
  if (text.includes("dnb")) return "DNB.OL";
  if (text.includes("nvidia") || text.includes("nvda")) return "NVDA";
  if (text.includes("microsoft") || text.includes("msft")) return "MSFT";

  return null;
}

async function getStockQuote(symbol: string) {
  const key = process.env.FINNHUB_API_KEY;

  if (!key) {
    throw new Error("Missing FINNHUB_API_KEY");
  }

  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(
    symbol
  )}&token=${key}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Finnhub stock quote failed");
  }

  const data = await res.json();

  if (!data || typeof data.c !== "number") {
    throw new Error("Invalid Finnhub response");
  }

  return data;
}

async function getCryptoPrice(id: string) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
    id
  )}&vs_currencies=nok&include_24hr_change=true`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("CoinGecko crypto price failed");
  }

  const data = await res.json();

  if (!data || !data[id]) {
    throw new Error("Invalid CoinGecko response");
  }

  return data[id];
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return Response.json(
        { result: "Mangler forespørsel." },
        { status: 400 }
      );
    }

    const usage = await checkAndIncrementUsage(req);

    if (!usage.allowed) {
      return Response.json(
        {
          result:
            "Du har brukt opp 3 gratis analyser i dag. Oppgrader til Premium for ubegrenset tilgang.",
          limitReached: true,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const assetType = detectAssetType(message);
    let marketContext = "";
    let assetName = "";

    if (assetType === "stock") {
      const symbol = mapStockSymbol(message);

      if (!symbol) {
        return Response.json({
          result:
            "Jeg fant ikke aksjen automatisk. Prøv for eksempel Apple, Tesla, Equinor, DNB eller Nvidia.",
          remaining: usage.remaining,
        });
      }

      const quote = await getStockQuote(symbol);
      assetName = symbol;

      marketContext = `
Type: Aksje
Navn: ${symbol}
Siste pris: ${quote.c}
Endring i dag: ${quote.d}
Endring i prosent: ${quote.dp}%
Dagens høy: ${quote.h}
Dagens lav: ${quote.l}
Forrige sluttkurs: ${quote.pc}
`;
    } else {
      const coinId = mapCryptoId(message);

      if (!coinId) {
        return Response.json({
          result:
            "Jeg fant ikke kryptovalutaen automatisk. Prøv for eksempel Bitcoin, Ethereum eller Solana.",
          remaining: usage.remaining,
        });
      }

      const coin = await getCryptoPrice(coinId);
      assetName = coinId;

      marketContext = `
Type: Krypto
Navn: ${coinId}
Pris i NOK: ${coin.nok}
24t endring: ${coin.nok_24h_change}%
`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Du er en norsk finansanalytiker. Bruk markedsdataene du får. Svar kort, konkret og lett forståelig på norsk. Formatér alltid svaret nøyaktig slik:\n1) Trend: ...\n2) Risiko: ...\n3) Kort konklusjon: ...\n4) Anbefaling: Kjøp/Hold/Selg\n5) Score: x/10\n6) Tidsvurdering: Kortsiktig/Langsiktig",
        },
        {
          role: "user",
          content: `Analyser dette: ${message}\n\nAktiva: ${assetName}\n\nLive markedsdata:\n${marketContext}`,
        },
      ],
    });

    return Response.json({
      result: completion.choices[0]?.message?.content ?? "Ingen analyse mottatt.",
      remaining: usage.remaining,
    });
  } catch (error) {
    console.error("API error:", error);

    return Response.json(
      {
        result: "Noe gikk galt i backend. Prøv igjen.",
      },
      { status: 500 }
    );
  }
}
