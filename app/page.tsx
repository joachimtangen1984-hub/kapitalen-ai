"use client";

import { useEffect, useState } from "react";

type ChartPoint = {
  label: string;
  value: number;
};

type AnalysisResponse = {
  symbol: string;
  name: string;
  type: "stock" | "crypto";
  source?: string;
  currency?: string;
  currencyLabel?: string;
  price: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  change: number;
  changePercent: number;
  support: number;
  resistance: number;
  bias: string;
  updatedAt: string;
  recommendation: "Kjøp" | "Hold" | "Selg";
  score: number;
  chartData?: ChartPoint[];
  analysis: {
    trend: string;
    risk: string;
    conclusion: string;
    timeframe: string;
    why: string;
    whatChangesView: string;
  };
};

type HistoryItem = {
  id: string;
  query: string;
  createdAt: string;
};

function formatNumber(value: number, decimals = 2) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("nb-NO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "-";
  const formatted = formatNumber(Math.abs(value), 2);
  return `${value >= 0 ? "+" : "-"}${formatted}%`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatHistoryLabel(query: string) {
  return query.length > 28 ? `${query.slice(0, 28)}...` : query;
}

function getRecommendationStyle(recommendation?: string) {
  const value = (recommendation || "").toLowerCase();

  if (value.includes("kjøp")) {
    return "bg-green-100 text-green-700 border-green-200";
  }

  if (value.includes("hold")) {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }

  if (value.includes("selg")) {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getBiasStyle(bias?: string) {
  const value = (bias || "").toLowerCase();

  if (value.includes("positiv")) {
    return "bg-green-100 text-green-700 border-green-200";
  }

  if (value.includes("negativ")) {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getChangeColor(value?: number) {
  if ((value ?? 0) > 0) return "text-green-600";
  if ((value ?? 0) < 0) return "text-red-500";
  return "text-black/55";
}

function MiniChart({ data }: { data: ChartPoint[] }) {
  if (!data || data.length < 2) {
    return (
      <div className="mt-4 h-40 rounded-2xl bg-[#f7f7f7] flex items-center justify-center text-sm text-black/40">
        Ingen grafdata tilgjengelig
      </div>
    );
  }

  const width = 700;
  const height = 160;
  const padding = 16;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((point, index) => {
    const x =
      padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y =
      height - padding - ((point.value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const lineColor =
    data[data.length - 1].value >= data[0].value ? "#16a34a" : "#dc2626";

  return (
    <div className="mt-4 rounded-2xl bg-[#fcfcfc] p-4 ring-1 ring-black/5">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-40 w-full"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke={lineColor}
          strokeWidth="3"
          points={points.join(" ")}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      <div className="mt-3 flex justify-between gap-2 overflow-hidden text-xs text-black/45">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("kapitalen-history");

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as HistoryItem[];
        setHistory(parsed);
      } catch (error) {
        console.error("Kunne ikke lese historikk", error);
      }
    }
  }, []);

  const saveToHistory = (query: string) => {
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      query,
      createdAt: new Date().toISOString(),
    };

    setHistory((prev) => {
      const filtered = prev.filter(
        (entry) => entry.query.toLowerCase() !== query.toLowerCase()
      );
      const updated = [item, ...filtered].slice(0, 8);
      localStorage.setItem("kapitalen-history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleAnalyze = async (forcedQuery?: string) => {
    const query = (forcedQuery ?? input).trim();

    if (!query) return;

    setLoading(true);
    setResult(null);
    setErrorMessage("");

    if (forcedQuery) {
      setInput(forcedQuery);
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.message || data?.error || "Noe gikk galt.");
        return;
      }

      setResult(data);
      saveToHistory(query);
    } catch (error) {
      console.error(error);
      setErrorMessage("Noe gikk galt. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  };

  const fillExample = (text: string) => {
    setInput(text);
  };

  const clearHistory = () => {
    localStorage.removeItem("kapitalen-history");
    setHistory([]);
  };

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
                Gratisbrukere kan kjøre 3 analyser per dag.
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-full bg-[#f3f4f6] p-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAnalyze();
                    }
                  }}
                  className="flex-1 bg-transparent px-4 outline-none"
                  placeholder="Søk etter aksje eller krypto, f.eks. Equinor, Apple, Bitcoin..."
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

                <button
                  onClick={() => fillExample("analyser equinor aksjen")}
                  className="rounded-full bg-[#f3f4f6] px-4 py-2 transition hover:bg-[#e9ebef]"
                >
                  Equinor
                </button>

                <button
                  onClick={() => fillExample("analyser apple aksjen")}
                  className="rounded-full bg-[#f3f4f6] px-4 py-2 transition hover:bg-[#e9ebef]"
                >
                  Apple (AAPL)
                </button>

                <button
                  onClick={() => fillExample("analyser bitcoin")}
                  className="rounded-full bg-[#f3f4f6] px-4 py-2 transition hover:bg-[#e9ebef]"
                >
                  Bitcoin (BTC)
                </button>

                <button
                  onClick={() => fillExample("analyser ethereum")}
                  className="rounded-full bg-[#f3f4f6] px-4 py-2 transition hover:bg-[#e9ebef]"
                >
                  Ethereum (ETH)
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-[28px] border border-red-200 bg-red-50 p-5 shadow-sm">
                <div className="text-lg font-semibold text-red-800">
                  AI-analyse
                </div>
                <p className="mt-2 text-red-700">{errorMessage}</p>
              </div>
            )}

            {result && (
              <div className="rounded-[28px] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">AI-analyse</h2>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-2xl font-semibold">
                        <span>
                          {result.name} ({result.symbol})
                        </span>
                        <span className="text-black/35">•</span>
                        <span>
                          {formatNumber(result.price)} {result.currencyLabel}
                        </span>
                        <span className={getChangeColor(result.changePercent)}>
                          {formatPercent(result.changePercent)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-sm text-black/55">
                        <span className="rounded-full bg-[#f3f4f6] px-3 py-1">
                          Datakilde: {result.source || "finnhub"}
                        </span>
                        <span className="rounded-full bg-[#f3f4f6] px-3 py-1">
                          Sist oppdatert: {formatDate(result.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-4 py-2 text-sm font-semibold ${getRecommendationStyle(
                          result.recommendation
                        )}`}
                      >
                        {result.recommendation}
                      </span>

                      <span className="rounded-full border border-blue-200 bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                        Score: {result.score}
                      </span>

                      <span
                        className={`rounded-full border px-4 py-2 text-sm font-semibold ${getBiasStyle(
                          result.bias
                        )}`}
                      >
                        Bias: {result.bias}
                      </span>
                    </div>
                  </div>

                  <MiniChart data={result.chartData || []} />

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-[#f7f7f7] p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-black/45">
                        Støtte
                      </div>
                      <div className="mt-2 text-xl font-semibold">
                        {formatNumber(result.support)} {result.currencyLabel}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#f7f7f7] p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-black/45">
                        Motstand
                      </div>
                      <div className="mt-2 text-xl font-semibold">
                        {formatNumber(result.resistance)} {result.currencyLabel}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#f7f7f7] p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-black/45">
                        Dagens høy / lav
                      </div>
                      <div className="mt-2 text-lg font-semibold">
                        {formatNumber(result.high)} / {formatNumber(result.low)}{" "}
                        {result.currencyLabel}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#f7f7f7] p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-black/45">
                        Forrige sluttkurs
                      </div>
                      <div className="mt-2 text-xl font-semibold">
                        {formatNumber(result.previousClose)} {result.currencyLabel}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl bg-[#fcfcfc] p-5 ring-1 ring-black/5">
                      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/45">
                        Trend
                      </div>
                      <p className="text-[17px] leading-8 text-black/85">
                        {result.analysis.trend}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-[#fcfcfc] p-5 ring-1 ring-black/5">
                      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/45">
                        Risiko
                      </div>
                      <p className="text-[17px] leading-8 text-black/85">
                        {result.analysis.risk}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-[#fcfcfc] p-5 ring-1 ring-black/5">
                      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/45">
                        Konklusjon
                      </div>
                      <p className="text-[17px] leading-8 text-black/85">
                        {result.analysis.conclusion}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-[#fcfcfc] p-5 ring-1 ring-black/5">
                      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/45">
                        Tidshorisont
                      </div>
                      <p className="text-[17px] leading-8 text-black/85">
                        {result.analysis.timeframe}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl bg-[#f7f2e8] p-5">
                      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/45">
                        Hvorfor kjøp / hold / selg?
                      </div>
                      <p className="text-[17px] leading-8 text-black/85">
                        {result.analysis.why}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-[#f3f6fb] p-5">
                      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/45">
                        Hva må skje for at synet endres?
                      </div>
                      <p className="text-[17px] leading-8 text-black/85">
                        {result.analysis.whatChangesView}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[28px] bg-white p-6 shadow-sm">
                <div className="text-xl font-semibold">Equinor (EQNR.OL)</div>
                <div className="mt-2 text-4xl font-bold">318,40 NOK</div>
                <div className="font-semibold text-green-600">+1,8%</div>
                <div className="mt-4 h-28 rounded-xl bg-gray-100" />
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-[#f3f4f6] px-3 py-1">
                    Sterk kontantstrøm
                  </span>
                  <span className="rounded-full bg-[#f3f4f6] px-3 py-1">
                    Lav risiko
                  </span>
                </div>
              </div>

              <div className="rounded-[28px] bg-white p-6 shadow-sm">
                <div className="text-xl font-semibold">Bitcoin (BTC)</div>
                <div className="mt-2 text-4xl font-bold">672 340 NOK</div>
                <div className="font-semibold text-green-600">+2,4%</div>
                <div className="mt-4 h-28 rounded-xl bg-gray-100" />
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-[#f3f4f6] px-3 py-1">
                    Sterk trend
                  </span>
                  <span className="rounded-full bg-[#f3f4f6] px-3 py-1">
                    Økende adopsjon
                  </span>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="font-semibold">Siste analyser</div>

                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs text-black/45 transition hover:text-black"
                  >
                    Tøm
                  </button>
                )}
              </div>

              {history.length > 0 ? (
                <div className="space-y-3 text-sm">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleAnalyze(item.query)}
                      className="w-full rounded-2xl bg-[#f7f7f7] px-4 py-3 text-left transition hover:bg-[#ececec]"
                    >
                      {formatHistoryLabel(item.query)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-black/45">
                  Ingen analyser enda.
                </div>
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
