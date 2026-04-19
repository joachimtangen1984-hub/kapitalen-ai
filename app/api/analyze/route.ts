import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  if (!key) throw new Error("Missing FINNHUB_API_KEY");

  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) throw new Error("Finnhub stock quote failed");

  return res.json();
}

async function getCryptoPrice(id: string) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
    id
  )}&vs_currencies=nok&include_24hr_change=true`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) throw new Error("CoinGecko crypto price failed");

  return res.json();
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return new Response("Missing message", { status: 400 });
    }

    const assetType = detectAssetType(message);
    let marketContext = "";

    if (assetType === "stock") {
      const symbol = mapStockSymbol(message);

      if (!symbol) {
        return Response.json({
          result:
            "Jeg fant ikke aksjen automatisk. Prøv for eksempel Apple, Tesla, Equinor, DNB, Nvidia eller Microsoft.",
        });
      }

      const quote = await getStockQuote(symbol);

      marketContext = `
Aksje: ${symbol}
Siste pris: ${quote.c}
Endring i dag: ${quote.d}
Endring i prosent: ${quote.dp}%
Dagens høy: ${quote.h}
Dagens lav: ${quote.l}
Forrige close: ${quote.pc}
`;
    } else {
      const coinId = mapCryptoId(message);

      if (!coinId) {
        return Response.json({
          result:
            "Jeg fant ikke kryptovalutaen automatisk. Prøv for eksempel Bitcoin, Ethereum eller Solana.",
        });
      }

      const data = await getCryptoPrice(coinId);
      const coin = data[coinId];

      marketContext = `
Krypto: ${coinId}
Pris i NOK: ${coin?.nok}
24t endring: ${coin?.nok_24h_change}%
`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Du er en finansanalytiker. Svar kort, konkret og på norsk. Bruk live markedsdataene du får. Gi alltid: 1) trend, 2) risiko, 3) kort konklusjon, 4) om dette ser best ut for kortsiktig eller langsiktig vurdering.",
        },
        {
          role: "user",
          content: `Brukerforespørsel: ${message}\n\nLive markedsdata:\n${marketContext}`,
        },
      ],
    });

    return Response.json({
      result: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
}
