const latestAnalyses = ['Apple (AAPL)', 'Bitcoin (BTC)', 'DNB (DNB.OL)'];
const quickTags = ['Equinor', 'Apple (AAPL)', 'Bitcoin (BTC)', 'Ethereum (ETH)'];

function Sidebar() {
  const items = ['Ny analyse', 'Historikk', 'Favoritter', 'Portefølje'];

  return (
    <aside className="rounded-[28px] bg-white p-5 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f172a] text-lg font-bold text-[#f6c56f]">
          K
        </div>
        <div>
          <div className="font-semibold tracking-tight">KAPITALEN AI</div>
          <div className="text-xs text-black/45">Beta</div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {items.map((item, index) => (
          <button
            key={item}
            className={`w-full rounded-2xl px-4 py-3 text-left transition ${
              index === 0
                ? 'bg-[#0f172a] text-white'
                : 'text-black/75 hover:bg-black/[0.04]'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-3xl bg-[#f7f2e8] p-4">
        <div className="font-semibold">Premium</div>
        <p className="mt-1 text-sm text-black/60">Ubegrensede analyser og porteføljeinnsikt.</p>
        <button className="mt-3 w-full rounded-2xl bg-[#0f172a] py-2 text-sm text-white transition hover:opacity-95">
          Oppgrader
        </button>
      </div>
    </aside>
  );
}

function SearchCard() {
  return (
    <div className="rounded-[28px] bg-white p-6 shadow-sm">
      <h1 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
        Hva vil du analysere i dag?
      </h1>

      <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-3 rounded-[28px] bg-[#f3f4f6] p-2 sm:flex-row sm:items-center">
        <input
          className="h-12 flex-1 rounded-full bg-transparent px-5 outline-none"
          placeholder="Søk etter aksje eller krypto, f.eks. Equinor, AAPL, Bitcoin..."
        />
        <button className="rounded-full bg-[#0f172a] px-6 py-3 text-white transition hover:opacity-95">
          Analyser
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-black/45">Populært:</span>
        {quickTags.map((item) => (
          <span key={item} className="rounded-full bg-[#f3f4f6] px-4 py-2">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 300 90" className="h-24 w-full">
      <path
        d="M0 70 C25 75, 35 55, 55 58 S90 48, 110 50 S145 35, 165 40 S205 20, 230 28 S270 18, 300 8"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AssetCard({
  title,
  subtitle,
  price,
  change,
  tags,
  text,
  accent,
  icon,
}: {
  title: string;
  subtitle: string;
  price: string;
  change: string;
  tags: string[];
  text: string;
  accent: string;
  icon: string;
}) {
  return (
    <div className="rounded-[28px] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {icon}
        </div>
        <div>
          <div className="text-xl font-semibold tracking-tight">{title}</div>
          <div className="text-sm text-black/45">{subtitle}</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-4xl font-bold md:text-5xl">{price}</div>
        <div className="mt-2 text-xl font-semibold text-green-600">{change}</div>
      </div>

      <div className="mt-4 rounded-2xl bg-[#fafafa] p-2">
        <Sparkline color={accent} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-[#eef2f0] px-3 py-1 text-sm text-black/75">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <div className="font-semibold">AI-analysens konklusjon</div>
        <p className="mt-2 text-sm leading-7 text-black/65">{text}</p>
      </div>

      <button className="mt-6 w-full rounded-2xl bg-[#0f172a] px-4 py-3 text-white transition hover:opacity-95">
        Se full analyse →
      </button>
    </div>
  );
}

function RightPanel() {
  return (
    <aside className="space-y-6">
      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="font-semibold">Siste analyser</div>
        <div className="mt-3 space-y-3 text-sm text-black/75">
          {latestAnalyses.map((item) => (
            <div key={item} className="rounded-2xl bg-[#fafafa] px-4 py-3">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] bg-[#f7f2e8] p-5 shadow-sm">
        <div className="font-semibold">Prøv portefølje</div>
        <p className="mt-2 text-sm leading-7 text-black/60">
          Få innsikt i porteføljen din med AI, risikooversikt og enklere beslutningsstøtte.
        </p>
      </div>

      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="font-semibold">Hvorfor Kapitalen AI?</div>
        <ul className="mt-3 space-y-2 text-sm text-black/65">
          <li>• Analyse av aksjer og krypto</li>
          <li>• Norsk språk og enkel forklaring</li>
          <li>• Bygget for raske vurderinger</li>
        </ul>
      </div>
    </aside>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f4f1] text-[#111]">
      <header className="border-b border-black/5 bg-[#f6f4f1]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f172a] text-xl font-bold text-[#f6c56f]">
              K
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight">KAPITALEN AI</div>
              <div className="text-sm text-black/50">Få raske analyser av aksjer og krypto</div>
            </div>
          </div>

          <div className="hidden flex-wrap gap-3 md:flex">
            {['Aksjer', 'Krypto', 'AI-drevet', 'Norsk'].map((pill) => (
              <span key={pill} className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">
                {pill}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr_280px]">
          <Sidebar />

          <div className="space-y-6">
            <SearchCard />

            <div className="grid gap-6 md:grid-cols-2">
              <AssetCard
                title="Equinor (EQNR.OL)"
                subtitle="Aksje"
                price="318,40 NOK"
                change="+1,8%"
                tags={['Sterk kontantstrøm', 'Lav risiko', 'Defensiv']}
                text="Solid oljeselskap med stabil inntjening og attraktivt utbytte. God langsiktig posisjon for investorer som ønsker eksponering mot energi."
                accent="#3b82f6"
                icon="↗"
              />

              <AssetCard
                title="Bitcoin (BTC)"
                subtitle="Krypto"
                price="672 340 NOK"
                change="+2,4%"
                tags={['Sterk trend', 'Økende adopsjon', 'Høy volatilitet']}
                text="Sterk trend med økende institusjonell interesse. Passer best for investorer som tåler svingninger og ønsker eksponering mot krypto."
                accent="#f59e0b"
                icon="₿"
              />
            </div>
          </div>

          <RightPanel />
        </div>
      </section>
    </main>
  );
}
