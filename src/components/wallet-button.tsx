"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { useWallet } from "./wallet-provider";

export default function WalletButton() {
  const { address, isConnecting, connect, disconnect } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  if (!address) {
    return (
      <Button onClick={connect} variant="primary" disabled={isConnecting}>
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:border-white/20 hover:bg-white/10"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        <span className="font-mono text-xs">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <span className="text-[10px] uppercase tracking-[0.24em] text-muted">
          Wallet
        </span>
      </button>

      {isMenuOpen ? (
        <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-[#0f141c] p-2 shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
          <button
            type="button"
            onClick={() => {
              disconnect();
              setIsMenuOpen(false);
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-xs text-white/80 transition hover:bg-white/5 hover:text-white"
          >
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}
