import { NextRequest, NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type AssetType = "stock" | "crypto";

type ResolvedSymbol = {
  symbol: string;
  name: string;
  type: AssetType;
  currency?: string;
  source?: "finnhub";
};

type QuoteData = {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
};

type ChartPoint = {
  label: string;
  value: number;
};

const MANUAL_SYMBOLS: Record<string, ResolvedSymbol> = {
  "equinor": { symbol: "EQNR.OL", name: "Equinor ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "equinor asa": { symbol: "EQNR.OL", name: "Equinor ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "eqnr": { symbol: "EQNR.OL", name: "Equinor ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "eqnr.ol": { symbol: "EQNR.OL", name: "Equinor ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "dnb": { symbol: "DNB.OL", name: "DNB Bank ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "dnb bank": { symbol: "DNB.OL", name: "DNB Bank ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "dnb bank asa": { symbol: "DNB.OL", name: "DNB Bank ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "dnb.ol": { symbol: "DNB.OL", name: "DNB Bank ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "aker bp": { symbol: "AKRBP.OL", name: "Aker BP ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "akrbp": { symbol: "AKRBP.OL", name: "Aker BP ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "akrbp.ol": { symbol: "AKRBP.OL", name: "Aker BP ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "telenor": { symbol: "TEL.OL", name: "Telenor ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "tel": { symbol: "TEL.OL", name: "Telenor ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "tel.ol": { symbol: "TEL.OL", name: "Telenor ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "norsk hydro": { symbol: "NHY.OL", name: "Norsk Hydro ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "nhy": { symbol: "NHY.OL", name: "Norsk Hydro ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "nhy.ol": { symbol: "NHY.OL", name: "Norsk Hydro ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "mowi": { symbol: "MOWI.OL", name: "Mowi ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "mowi.ol": { symbol: "MOWI.OL", name: "Mowi ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "orkla": { symbol: "ORK.OL", name: "Orkla ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "ork": { symbol: "ORK.OL", name: "Orkla ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "ork.ol": { symbol: "ORK.OL", name: "Orkla ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "salmar": { symbol: "SALM.OL", name: "SalMar ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "salm": { symbol: "SALM.OL", name: "SalMar ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "salm.ol": { symbol: "SALM.OL", name: "SalMar ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "yara": { symbol: "YAR.OL", name: "Yara International ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "yar": { symbol: "YAR.OL", name: "Yara International ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "yar.ol": { symbol: "YAR.OL", name: "Yara International ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "storebrand": { symbol: "STB.OL", name: "Storebrand ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "stb": { symbol: "STB.OL", name: "Storebrand ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "stb.ol": { symbol: "STB.OL", name: "Storebrand ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "subsea 7": { symbol: "SUBC.OL", name: "Subsea 7 SA", type: "stock", currency: "NOK", source: "finnhub" },
  "subc": { symbol: "SUBC.OL", name: "Subsea 7 SA", type: "stock", currency: "NOK", source: "finnhub" },
  "subc.ol": { symbol: "SUBC.OL", name: "Subsea 7 SA", type: "stock", currency: "NOK", source: "finnhub" },

  "frontline": { symbol: "FRO.OL", name: "Frontline Plc", type: "stock", currency: "NOK", source: "finnhub" },
  "fro": { symbol: "FRO.OL", name: "Frontline Plc", type: "stock", currency: "NOK", source: "finnhub" },
  "fro.ol": { symbol: "FRO.OL", name: "Frontline Plc", type: "stock", currency: "NOK", source: "finnhub" },

  "golden ocean": { symbol: "GOGL.OL", name: "Golden Ocean Group Ltd", type: "stock", currency: "NOK", source: "finnhub" },
  "gogl": { symbol: "GOGL.OL", name: "Golden Ocean Group Ltd", type: "stock", currency: "NOK", source: "finnhub" },
  "gogl.ol": { symbol: "GOGL.OL", name: "Golden Ocean Group Ltd", type: "stock", currency: "NOK", source: "finnhub" },

  "tomra": { symbol: "TOM.OL", name: "Tomra Systems ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "tom": { symbol: "TOM.OL", name: "Tomra Systems ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "tom.ol": { symbol: "TOM.OL", name: "Tomra Systems ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "autostore": { symbol: "AUTO.OL", name: "Autostore Holdings Ltd", type: "stock", currency: "NOK", source: "finnhub" },
  "auto": { symbol: "AUTO.OL", name: "Autostore Holdings Ltd", type: "stock", currency: "NOK", source: "finnhub" },
  "auto.ol": { symbol: "AUTO.OL", name: "Autostore Holdings Ltd", type: "stock", currency: "NOK", source: "finnhub" },

  "nel": { symbol: "NEL.OL", name: "NEL ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "nel asa": { symbol: "NEL.OL", name: "NEL ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "nel.ol": { symbol: "NEL.OL", name: "NEL ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "pgs": { symbol: "PGS.OL", name: "PGS ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "pgs asa": { symbol: "PGS.OL", name: "PGS ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "pgs.ol": { symbol: "PGS.OL", name: "PGS ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "bakkafrost": { symbol: "BAKKA.OL", name: "P/F Bakkafrost", type: "stock", currency: "NOK", source: "finnhub" },
  "bakka": { symbol: "BAKKA.OL", name: "P/F Bakkafrost", type: "stock", currency: "NOK", source: "finnhub" },
  "bakka.ol": { symbol: "BAKKA.OL", name: "P/F Bakkafrost", type: "stock", currency: "NOK", source: "finnhub" },

  "bw lpg": { symbol: "BWLPG.OL", name: "BW LPG Ltd", type: "stock", currency: "NOK", source: "finnhub" },
  "bwlpg": { symbol: "BWLPG.OL", name: "BW LPG Ltd", type: "stock", currency: "NOK", source: "finnhub" },
  "bwlpg.ol": { symbol: "BWLPG.OL", name: "BW LPG Ltd", type: "stock", currency: "NOK", source: "finnhub" },

  "kitron": { symbol: "KIT.OL", name: "Kitron ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "kit": { symbol: "KIT.OL", name: "Kitron ASA", type: "stock", currency: "NOK", source: "finnhub" },
  "kit.ol": { symbol: "KIT.OL", name: "Kitron ASA", type: "stock", currency: "NOK", source: "finnhub" },

  "apple": { symbol: "AAPL", name: "Apple Inc.", type: "stock", currency: "USD", source: "finnhub" },
  "aapl": { symbol: "AAPL", name: "Apple Inc.", type: "stock", currency: "USD", source: "finnhub" },

  "microsoft": { symbol: "MSFT", name: "Microsoft Corp.", type: "stock", currency: "USD", source: "finnhub" },
  "msft": { symbol: "MSFT", name: "Microsoft Corp.", type: "stock", currency: "USD", source: "finnhub" },

  "nvidia": { symbol: "NVDA", name: "NVIDIA Corp.", type: "stock", currency: "USD", source: "finnhub" },
  "nvda": { symbol: "NVDA", name: "NVIDIA Corp.", type: "stock", currency: "USD", source: "finnhub" },

  "amazon": { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock", currency: "USD", source: "finnhub" },
  "amzn": { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock", currency: "USD", source: "finnhub" },

  "alphabet": { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", currency: "USD", source: "finnhub" },
  "google": { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", currency: "USD", source: "finnhub" },
  "googl": { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", currency: "USD", source: "finnhub" },

  "meta": { symbol: "META", name: "Meta Platforms Inc.", type: "stock", currency: "USD", source: "finnhub" },
  "facebook": { symbol: "META", name: "Meta Platforms Inc.", type: "stock", currency: "USD", source: "finnhub" },

  "tesla": { symbol: "TSLA", name: "Tesla Inc.", type: "stock", currency: "USD", source: "finnhub" },
  "tsla": { symbol: "TSLA", name: "Tesla Inc.", type: "stock", currency: "USD", source: "finnhub" },

  "bitcoin": { symbol: "BINANCE:BTCUSDT", name: "Bitcoin", type: "crypto", currency: "USD", source: "finnhub" },
  "btc": { symbol: "BINANCE:BTCUSDT", name: "Bitcoin", type: "crypto", currency: "USD", source: "finnhub" },
  "btcusdt": { symbol: "BINANCE:BTCUSDT", name: "Bitcoin", type: "crypto", currency: "USD", source: "finnhub" },

  "ethereum": { symbol: "BINANCE:ETHUSDT", name: "Ethereum", type: "crypto", currency: "USD", source: "finnhub" },
  "eth": { symbol: "BINANCE:ETHUSDT", name: "Ethereum", type: "crypto", currency: "USD", source: "finnhub" },
  "ethusdt": { symbol: "BINANCE:ETHUSDT", name: "Ethereum", type: "crypto", currency: "USD", source: "finnhub" },

  "solana": { symbol: "BINANCE:SOLUSDT", name: "Solana", type: "crypto", currency: "USD", source: "finnhub" },
  "sol": { symbol: "BINANCE:SOLUSDT", name: "Solana", type: "crypto", currency: "USD", source: "finnhub" },
  "solusdt": { symbol: "BINANCE:SOLUSDT", name: "Solana", type: "crypto", currency: "USD", source: "finnhub" },

  "xrp": { symbol: "BINANCE:XRPUSDT", name: "XRP", type: "crypto", currency: "USD", source: "finnhub" },
  "xrpusdt": { symbol: "BINANCE:XRPUSDT", name: "XRP", type: "crypto", currency: "USD", source: "finnhub" },
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

function getCurrencySymbol(currency?: string) {
  if (currency === "NOK") return "NOK";
  if (currency === "USD") return "USD";
  return currency ?? "";
}

function calculateSupport(quote: QuoteData) {
  const low = Number(quote.l ?? 0);
  const prevClose = Number(quote.pc ?? 0);
  if (low > 0 && prevClose > 0) return round(Math.min(low, prevClose));
  if (low > 0) return round(low);
  return round(prevClose);
}

function calculateResistance(quote: QuoteData) {
  const high = Number(quote.h ?? 0);
  const prevClose = Number(quote.pc ?? 0);
  if (high > 0 && prevClose > 0) return round(Math.max(high, prevClose));
  if (high > 0) return round(high);
  return round(prevClose);
}

function calculateBias(changePercent: number, current: number, open: number) {
  if (changePercent >= 1.5 && current >= open) return "Positiv";
  if (changePercent <= -1.5 && current <= open) return "Negativ";
  return "Nøytral";
}

async function fetchFinnhubQuote(symbol: string): Promise<QuoteData> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Finnhub quote error ${res.status}${bodyText ? ` - ${bodyText}` : ""}`);
  }

  return res.json();
}

async function fetchFinnhubCandles(symbol: string): Promise<ChartPoint[]> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - 60 * 60 * 24 * 7;
  const resolution = symbol.includes("BINANCE:") ? "60" : "D";

  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(
    symbol
  )}&resolution=${resolution}&from=${from}&to=${now}&token=${FINNHUB_API_KEY}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();

  if (!data || data.s !== "ok" || !Array.isArray(data.c) || !Array.isArray(data.t)) {
    return [];
  }

  return data.c
    .map((value: number, index: number) => {
      const timestamp = data.t[index];
      if (typeof value !== "number" || typeof timestamp !== "number") return null;

      const date = new Date(timestamp * 1000);
      const label = symbol.includes("BINANCE:")
        ? `${String(date.getDate()).padStart(2, "0")}.${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`
        : `${String(date.getDate()).padStart(2, "0")}.${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;

      return {
        label,
        value: round(value),
      };
    })
    .filter(Boolean)
    .slice(-20) as ChartPoint[];
}

function buildFallbackAnalysis(
  asset: ResolvedSymbol,
  quote: QuoteData,
  chartData: ChartPoint[]
) {
  const current = Number(quote.c ?? 0);
  const prevClose = Number(quote.pc ?? 0);
  const high = Number(quote.h ?? 0);
  const low = Number(quote.l ?? 0);
  const open = Number(quote.o ?? 0);
  const change = Number(quote.d ?? current - prevClose);
  const changePercent = Number(quote.dp ?? 0);
  const updatedAt = quote.t ? new Date(quote.t * 1000).toISOString() : new Date().toISOString();

  const support = calculateSupport(quote);
  const resistance = calculateResistance(quote);
  const bias = calculateBias(changePercent, current, open);

  const intradayRangePct = low > 0 ? ((high - low) / low) * 100 : 0;

  let recommendation: "Kjøp" | "Hold" | "Selg" = "Hold";
  let score = 5;

  if (changePercent >= 2 && intradayRangePct < 4) {
    recommendation = "Kjøp";
    score = 8;
  } else if (changePercent > 0.5) {
    recommendation = "Hold";
    score = 6;
  } else if (changePercent <= -2) {
    recommendation = "Selg";
    score = 4;
  }

  let trend = "Flat utvikling på kort sikt.";
  if (changePercent >= 1.5) trend = "Positiv oppgang i pris.";
  else if (changePercent > 0) trend = "Svak positiv utvikling på kort sikt.";
  else if (changePercent <= -1.5) trend = "Nedadgående trend med fall i pris.";
  else if (changePercent < 0) trend = "Stabil med svak nedgang.";

  let risk = "Moderat risiko på kort sikt.";
  if (intradayRangePct >= 5) risk = "Høy risiko grunnet tydelige svingninger gjennom dagen.";
  else if (intradayRangePct <= 2) risk = "Lav til moderat risiko med relativt begrensede svingninger.";

  let conclusion = "Bildet er blandet akkurat nå, og det kan være lurt å avvente.";
  let why = "Anbefalingen bygger på dagens prisutvikling, volatilitet og forholdet mellom støtte og motstand.";
  let whatChangesView = "Synet endres dersom prisutviklingen bryter tydelig over motstand eller under støtte.";

  if (recommendation === "Kjøp") {
    conclusion = "Det korte bildet er positivt, og momentet taler for videre oppside så lenge styrken holder.";
    why = "Anbefalingen er kjøp fordi instrumentet viser positivt momentum og begrenset intradag-svekkelse.";
    whatChangesView = `Synet svekkes dersom kursen faller tilbake under støtten rundt ${support}.`;
  }

  if (recommendation === "Hold") {
    conclusion = "Det er ingen sterke signaler for kjøp eller salg akkurat nå.";
    why = "Anbefalingen er hold fordi markedet virker avventende og bevegelsen ikke er sterk nok til en tydelig kjøps- eller salgsvurdering.";
    whatChangesView = `Synet blir mer positivt ved brudd over motstand rundt ${resistance}, og mer negativt ved fall under ${support}.`;
  }

  if (recommendation === "Selg") {
    conclusion = "Det korte bildet er svakt, og risikoen for videre press gjør at forsiktighet er fornuftig.";
    why = "Anbefalingen er selg fordi dagens utvikling er negativ og prisbildet viser svakt kortsiktig momentum.";
    whatChangesView = `Synet blir mindre negativt dersom kursen henter seg inn og etablerer seg over ${resistance}.`;
  }

  return {
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    source: asset.source ?? "finnhub",
    currency: asset.currency ?? "USD",
    currencyLabel: getCurrencySymbol(asset.currency),
    price: round(current),
    open: round(open),
    high: round(high),
    low: round(low),
    previousClose: round(prevClose),
    change: round(change),
    changePercent: round(changePercent),
    support,
    resistance,
    bias,
    updatedAt,
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

async function buildOpenAIAnalysis(baseData: ReturnType<typeof buildFallbackAnalysis>) {
  if (!OPENAI_API_KEY) return null;

  const prompt = `
Du er en norsk finansassistent.
Svar KUN med gyldig JSON. Ingen markdown. Ingen forklaring utenfor JSON.

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
- Vær konkret, kort og finansfaglig enkel
- recommendation må være ett av: Kjøp, Hold, Selg
- score må være heltall fra 1 til 10
- Ikke overdriv sikkerhet
- Bruk tallene i vurderingen
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
    const errorText = await res.text().catch(() => "");
    console.error("OpenAI error:", res.status, errorText);
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
    if (!FINNHUB_API_KEY) {
      return NextResponse.json(
        { error: "FINNHUB_API_KEY mangler" },
        { status: 500 }
      );
    }

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

    const quote = await fetchFinnhubQuote(asset.symbol);

    if (!quote || Number(quote.c ?? 0) === 0) {
      return NextResponse.json(
        {
          error: "Fant ikke kursdata",
          message: `Klarte ikke hente kursdata for ${asset.symbol}`,
        },
        { status: 404 }
      );
    }

    const chartData = await fetchFinnhubCandles(asset.symbol);
    const fallback = buildFallbackAnalysis(asset, quote, chartData);
    const aiAnalysis = await buildOpenAIAnalysis(fallback);

    const result = aiAnalysis
      ? {
          ...fallback,
          recommendation: aiAnalysis.recommendation ?? fallback.recommendation,
          score:
            typeof aiAnalysis.score === "number" ? aiAnalysis.score : fallback.score,
          analysis: {
            trend: aiAnalysis.analysis?.trend ?? fallback.analysis.trend,
            risk: aiAnalysis.analysis?.risk ?? fallback.analysis.risk,
            conclusion: aiAnalysis.analysis?.conclusion ?? fallback.analysis.conclusion,
            timeframe: aiAnalysis.analysis?.timeframe ?? fallback.analysis.timeframe,
            why: aiAnalysis.analysis?.why ?? fallback.analysis.why,
            whatChangesView:
              aiAnalysis.analysis?.whatChangesView ?? fallback.analysis.whatChangesView,
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
