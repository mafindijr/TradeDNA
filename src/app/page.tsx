import Link from "next/link";
import WalletButton from "../components/wallet-button";
import { Card, CardContent } from "../components/ui/card";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-white">
      <div className="pointer-events-none absolute inset-0 page-backdrop" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Trade<span className="text-gradient">DNA</span>
        </Link>
        <WalletButton />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 pb-20 pt-10">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-7">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              On-chain performance intelligence
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Track Your <span className="text-gradient">On-Chain Trading</span>{" "}
              Performance
            </h1>
            <p className="max-w-xl text-base text-muted sm:text-lg">
              Consolidate wallet performance, trading behavior, and token flow
              analytics into a single, futuristic dashboard built for Web3
              traders.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <WalletButton />
              <Link
                href="/dashboard"
                className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition-all hover:bg-white/10 sm:w-auto"
              >
                View Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted">
              <span>Wallet-ready</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span>API plug-in friendly</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span>Privacy-first</span>
            </div>
          </div>

          <Card className="animate-[fade-up_0.6s_ease-out]">
            <CardContent className="space-y-6 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted">
                    Wallet Snapshot
                  </p>
                  <p className="text-lg font-semibold text-white">Awaiting data</p>
                </div>
                <div className="rounded-full border border-white/10 px-4 py-2 text-xs text-muted">
                  Placeholder
                </div>
              </div>
              <div className="grid gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted">
                  Connect a wallet to unlock live performance metrics, win rate,
                  and token exposure.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {["Total PnL", "Win Rate", "Trades", "Top Network"].map(
                    (label) => (
                      <div
                        key={label}
                        className="rounded-xl border border-white/10 bg-[#0f141c] p-4"
                      >
                        <p className="text-xs uppercase tracking-[0.3em] text-muted">
                          {label}
                        </p>
                        <p className="mt-3 text-xl text-white">--</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "PnL Tracking",
              text: "Monitor realized and unrealized PnL with wallet-level granularity.",
            },
            {
              title: "Win Rate",
              text: "Surface winning streaks, top tokens, and performance shifts.",
            },
            {
              title: "Trader Profile",
              text: "Classify behavior, risk tolerance, and strategy alignment.",
            },
            {
              title: "Trending Tokens",
              text: "Identify the tokens attracting the most active traders.",
            },
          ].map((feature) => (
            <Card key={feature.title}>
              <CardContent className="space-y-3 p-6">
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted">{feature.text}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-6 py-10 text-xs text-muted">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span>Built for next-gen on-chain intelligence.</span>
          <div className="flex gap-6">
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
            <Link href="/search" className="hover:text-white">
              Wallet Search
            </Link>
            <Link href="/trending" className="hover:text-white">
              Trending
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
