"use client";

import { useMemo, useState } from "react";

type AnalyzeResponse = {
  symbol: string;
  name: string;
  type: "stock" | "crypto";
  price: number;
  previousClose: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  recommendation: "Kjøp" | "Hold" | "Selg" | string;
  score: number;
  bias?: string;
  support?: number;
  resistance?: number;
  source?: string;
  updatedAt?: string;
  analysis: {
    trend: string;
    risk: string;
    conclusion: string;
    timeframe: string;
    why?: string;
    uncertainty?: string;
  };
  chart?: {
    points: number[];
  };
};

type HistoryItem = {
  id: string;
  label: string;
};

function formatNumber(value: number, decimals = 2) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("nb-NO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatPrice(value: number, type?: "stock" | "crypto", symbol?: string) {
  if (!Number.isFinite(value)) return "-";

  const isUsd =
    symbol?.includes("BINANCE:") ||
    ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA"].includes(symbol || "");

  const currency = isUsd ? "USD" : "NOK";

  return `${formatNumber(value, 2)} ${currency}`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, 2)}%`;
}

function getRecommendationClasses(value?: string) {
  const v = (value || "").toLowerCase();

  if (v.includes("kjøp")) {
    return "border border-green-200 bg-green-100 text-green-800";
  }
  if (v.includes("hold")) {
    return "border border-yellow-200 bg-yellow-100 text-yellow-800";
  }
  if (v.includes("selg")) {
    return "border border-red-200 bg-red-100 text-red-800";
  }

  return "border border-gray-200 bg-gray-100 text-gray-700";
}

function getBiasClasses(value?: string) {
  const v = (value || "").toLowerCase();

  if (v.includes("positiv")) {
    return "border border-green-200 bg-green-100 text-green-800";
  }
  if (v.includes("negativ")) {
    return "border border-red-200 bg-red-100 text-red-800";
  }

  return "border border-gray-200 bg-gray-100 text-gray-700";
}

function getChangeColor(value?: number) {
  if ((value || 0) > 0) return "text-green-600";
  if ((value || 0) < 0) return "text-red-600";
  return "text-gray-600";
}

function SimpleChart({
  points,
  positive,
}: {
  points?: number[];
  positive?: boolean;
}) {
  const chart = useMemo(() => {
    if (!points || points.length < 2) return null;

    const width = 900;
    const height = 280;
    const padding = 24;

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const coords = points.map((point, index) => {
      const x =
        padding + (index / (points.length - 1)) * (width - padding * 2);
      const y =
        height - padding - ((point - min) / range) * (height - padding * 2);
      return [x, y];
    });

    const path = coords
      .map((c, i) => `${i === 0 ? "M" : "L"} ${c[0]} ${c[1]}`)
      .join(" ");

    const areaPath = `${path} L ${coords[coords.length - 1][0]} ${height - padding} L ${coords[0][0]} ${height - padding} Z`;

    return { width, height, path, areaPath };
  }, [points]);

  if (!chart) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-[28px] bg-[#f3f4f6] text-black/35">
        Ingen grafdata tilgjengelig
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] bg-[#f3f4f6] p-4">
      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        className="h-[280px] w-full"
        preserveAspectRatio="none"
      >
        <path
          d={chart.areaPath}
          fill={positive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.10)"}
        />
        <path
          d={chart.path}
          fill="none"
          stroke={positive ? "#16a34a" : "#dc2626"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  async function handleAnalyze(forced?: string) {
    const value = (forced ?? query).trim();
    if (!value) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: value,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Noe gikk galt");
      }

      setResult(data);

      setHistory((prev) => {
        const next = [
          { id: crypto.randomUUID(), label: value },
          ...prev.filter((item) => item.label.toLowerCase() !== value.toLowerCase()),
        ].slice(0, 8);

        return next;
      });
    } catch (err: any) {
      setResult(null);
      setError(err?.message || "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  }

  const examples = [
    "analyser equinor aksjen",
    "analyser dnb",
    "analyser apple aksjen",
    "analyser bitcoin",
    "analyser ethereum",
  ];

  return (
    <main className="min-h-screen bg-[#f6f4f1] text-[#111]">
      <header className="border-b border-black/5 bg-[#f6f4f1]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f172a] text-xl font-bold text-[#f6c56f]">
              K
            </div>
            <div>
              <div className="text-2xl font-semibold">KAPITALEN AI</div>
              <div className="text-sm text-black/50">
                Få raske analyser av aksjer og krypto
              </div>
            </div>
          </div>

          <div className="hidden gap-3 md:flex">
            <span className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">
              Aksjer
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">
              Krypto
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">
              AI-drevet
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">
              Norsk
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr_280px]">
          <aside className="rounded-[28px] bg-white p-5 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f172a] font-bold text-[#f6c56f]">
                K
              </div>
              <div>
                <div className="font-semibold">KAPITALEN AI</div>
                <div className="text-xs text-black/40">Beta</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <button className="w-full rounded-2xl bg-[#0f172a] px-4 py-3 text-left text-white">
                Ny analyse
              </button>
              <button className="w-full rounded-2xl px-4 py-3 text-left hover:bg-black/[0.05]">
                Historikk
              </button>
              <button className="w-full rounded-2xl px-4 py-3 text-left hover:bg-black/[0.05]">
                Favoritter
              </button>
              <button className="w-full rounded-2xl px-4 py-3 text-left hover:bg-black/[0.05]">
                Portefølje
              </button>
            </div>

            <div className="mt-6 rounded-3xl bg-[#f7f2e8] p-4">
              <div className="font-semibold">Premium</div>
              <p className="mt-1 text-sm text-black/60">
                Ubegrensede analyser og porteføljeinnsikt.
              </p>

              <div className="mt-3 rounded-2xl bg-white/70 px-3 py-2 text-sm text-black/70">
                Ubegrensede muligheter med Premium
              </div>

              <button className="mt-4 w-full rounded-2xl bg-[#0f172a] py-3 text-white">
                Oppgrader
              </button>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <h1 className="text-center text-4xl font-semibold">
                Hva vil du analysere i dag?
              </h1>

              <div className="mt-4 text-center text-sm text-black/50">
                Søk etter aksjer og krypto, på norsk.
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-full bg-[#f3f4f6] p-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAnalyze();
                  }}
                  className="flex-1 bg-transparent px-4 outline-none"
                  placeholder="Søk etter aksje eller krypto, f.eks. Equinor, DNB, Apple, Bitcoin..."
                />
                <button
                  onClick={() => handleAnalyze()}
                  disabled={loading}
                  className="rounded-full bg-[#0f172a] px-6 py-3 text-white disabled:opacity-60"
                >
                  {loading ? "Analyserer..." : "Analyser"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-black/50">
                <span>Populært:</span>
                {examples.map((item) => (
                  <button
                    key={item}
                    onClick={() => setQuery(item)}
                    className="rounded-full bg-[#f3f4f6] px-4 py-2 transition hover:bg-[#e9ebef]"
                  >
                    {item.replace("analyser ", "")}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-[28px] border border-red-200 bg-red-50 p-5 shadow-sm">
                <div className="text-lg font-semibold text-red-800">
                  AI-analyse
                </div>
                <p className="mt-2 text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="rounded-[32px] bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-4xl font-bold leading-tight">
                      {result.name}
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-black/80">
                      ({result.symbol})
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <div className="text-5xl font-bold">
                        {formatPrice(result.price, result.type, result.symbol)}
                      </div>
                      <div
                        className={`text-3xl font-bold ${getChangeColor(
                          result.changePercent
                        )}`}
                      >
                        {formatPercent(result.changePercent)}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-black/60">
                      <span className="rounded-full bg-[#f3f4f6] px-4 py-2">
                        Datakilde: {result.source || "yahoo/finnhub"}
                      </span>
                      <span className="rounded-full bg-[#f3f4f6] px-4 py-2">
                        Sist oppdatert: {result.updatedAt || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${getRecommendationClasses(
                        result.recommendation
                      )}`}
                    >
                      {result.recommendation}
                    </span>

                    <span className="rounded-full border border-blue-200 bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                      Score: {result.score}
                    </span>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${getBiasClasses(
                        result.bias
                      )}`}
                    >
                      Bias: {result.bias || "Nøytral"}
                    </span>
                  </div>
                </div>

                <SimpleChart
                  points={result.chart?.points}
                  positive={(result.changePercent || 0) >= 0}
                />

                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="rounded-[24px] bg-[#f8f8f8] p-4">
                    <div className="text-sm font-semibold uppercase tracking-wide text-black/45">
                      Støtte
                    </div>
                    <div className="mt-3 text-2xl font-bold">
                      {formatPrice(
                        result.support ?? result.low,
                        result.type,
                        result.symbol
                      )}
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-[#f8f8f8] p-4">
                    <div className="text-sm font-semibold uppercase tracking-wide text-black/45">
                      Motstand
                    </div>
                    <div className="mt-3 text-2xl font-bold">
                      {formatPrice(
                        result.resistance ?? result.high,
                        result.type,
                        result.symbol
                      )}
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-[#f8f8f8] p-4">
                    <div className="text-sm font-semibold uppercase tracking-wide text-black/45">
                      Dagens høy / lav
                    </div>
                    <div className="mt-3 text-2xl font-bold">
                      {formatPrice(result.high, result.type, result.symbol)}
                      <span className="text-black/40"> / </span>
                      {formatPrice(result.low, result.type, result.symbol)}
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-[#f8f8f8] p-4">
                    <div className="text-sm font-semibold uppercase tracking-wide text-black/45">
                      Forrige sluttkurs
                    </div>
                    <div className="mt-3 text-2xl font-bold">
                      {formatPrice(
                        result.previousClose,
                        result.type,
                        result.symbol
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-black/6 p-5">
                    <div className="text-sm font-semibold uppercase tracking-wide text-black/45">
                      Trend
                    </div>
                    <div className="mt-3 text-2xl leading-10">
                      {result.analysis.trend}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-black/6 p-5">
                    <div className="text-sm font-semibold uppercase tracking-wide text-black/45">
                      Risiko
                    </div>
                    <div className="mt-3 text-2xl leading-10">
                      {result.analysis.risk}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-black/6 p-5">
                    <div className="text-sm font-semibold uppercase tracking-wide text-black/45">
                      Konklusjon
                    </div>
                    <div className="mt-3 text-2xl leading-10">
                      {result.analysis.conclusion}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-black/6 p-5">
                    <div className="text-sm font-semibold uppercase tracking-wide text-black/45">
                      Tidshorisont
                    </div>
                    <div className="mt-3 text-2xl leading-10">
                      {result.analysis.timeframe}
                    </div>
                  </div>
                </div>

                {(result.analysis.why || result.analysis.uncertainty) && (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {result.analysis.why && (
                      <div className="rounded-[24px] border border-black/6 p-5">
                        <div className="text-sm font-semibold uppercase tracking-wide text-black/45">
                          Hvorfor denne anbefalingen
                        </div>
                        <div className="mt-3 text-xl leading-9">
                          {result.analysis.why}
                        </div>
                      </div>
                    )}

                    {result.analysis.uncertainty && (
                      <div className="rounded-[24px] border border-black/6 p-5">
                        <div className="text-sm font-semibold uppercase tracking-wide text-black/45">
                          Hva kan endre synet
                        </div>
                        <div className="mt-3 text-xl leading-9">
                          {result.analysis.uncertainty}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="font-semibold">Siste analyser</div>
              </div>

              {history.length > 0 ? (
                <div className="space-y-3 text-sm">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setQuery(item.label);
                        handleAnalyze(item.label);
                      }}
                      className="w-full rounded-2xl bg-[#f7f7f7] px-4 py-3 text-left transition hover:bg-[#ececec]"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-black/45">Ingen analyser enda.</div>
              )}
            </div>

            <div className="rounded-[28px] bg-[#f7f2e8] p-5 shadow-sm">
              <div className="font-semibold">Prøv portefølje</div>
              <p className="mt-2 text-sm text-black/60">
                Få innsikt i porteføljen din med AI, risikooversikt og enklere
                beslutningsstøtte.
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="font-semibold">Hvorfor Kapitalen AI?</div>
              <ul className="mt-3 space-y-2 text-sm text-black/60">
                <li>• Analyse av aksjer og krypto</li>
                <li>• Norsk språk og enkel forklaring</li>
                <li>• Bygget for raske vurderinger</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
