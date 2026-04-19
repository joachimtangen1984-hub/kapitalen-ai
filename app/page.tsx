"use client";

import { useState } from "react";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
        }),
      });

      if (!res.ok) {
        throw new Error("API request failed");
      }

      const data = await res.json();
      setResult(data.result || "Ingen analyse mottatt.");
    } catch (error) {
      console.error(error);
      setResult("Noe gikk galt. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  };

  const fillExample = (text: string) => {
    setInput(text);
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
                  placeholder="Søk etter aksje eller krypto, f.eks. Apple, Equinor, Bitcoin..."
                />
                <button
                  onClick={handleAnalyze}
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

            {result && (
              <div className="rounded-[28px] bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-2xl font-semibold">AI-analyse</h2>
                <div className="whitespace-pre-wrap text-[18px] leading-9 text-black/85">
                  {result}
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
              <div className="font-semibold">Siste analyser</div>
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-2xl bg-[#f7f7f7] px-4 py-3">
                  Apple (AAPL)
                </div>
                <div className="rounded-2xl bg-[#f7f7f7] px-4 py-3">
                  Bitcoin (BTC)
                </div>
                <div className="rounded-2xl bg-[#f7f7f7] px-4 py-3">
                  DNB (DNB.OL)
                </div>
              </div>
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
