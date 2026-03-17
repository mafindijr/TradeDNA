"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";
import WalletButton from "./wallet-button";

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Wallet Search", href: "/search" },
  { label: "Trending", href: "/trending" },
];

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="pointer-events-none fixed inset-0 page-backdrop" />
      <div className="relative mx-auto flex w-full max-w-7xl gap-8 px-4 py-10 lg:px-8">
        <aside className="hidden w-64 flex-shrink-0 flex-col gap-6 lg:flex">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Trade<span className="text-gradient">DNA</span>
          </Link>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-xl border border-transparent px-4 py-3 text-sm transition-all",
                    isActive
                      ? "border-white/10 bg-white/5 text-white"
                      : "text-muted hover:border-white/10 hover:bg-white/5"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-muted">
            Plug in on-chain data to unlock real-time performance insights.
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0f141c] px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">
                Web3 Trader Analytics
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 text-sm text-muted">{subtitle}</p>
              ) : null}
            </div>
            <WalletButton />
          </header>

          <nav className="flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition-all",
                    isActive
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 text-muted hover:border-white/20 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="flex animate-[fade-up_0.5s_ease-out] flex-col gap-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
