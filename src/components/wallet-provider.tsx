"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";

type WalletContextValue = {
  address: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  async function connect() {
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        toast.error("Wallet not detected", {
          description: "Install MetaMask or OKX Wallet to continue.",
        });
        return;
      }

      const provider = new ethers.BrowserProvider(ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      setAddress(addr);
      toast.success("Wallet connected", {
        description: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
      });
    } catch (error) {
      toast.error("Connection failed", {
        description: "Please check your wallet permissions.",
      });
    } finally {
      setIsConnecting(false);
    }
  }

  function disconnect() {
    setAddress(null);
    toast("Disconnected", {
      description: "Your wallet connection has been cleared.",
    });
  }

  const value = useMemo(
    () => ({
      address,
      isConnecting,
      connect,
      disconnect,
    }),
    [address, isConnecting]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
