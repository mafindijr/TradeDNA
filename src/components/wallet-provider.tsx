"use client";

import { createContext, useContext, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";
import { toast } from "sonner";

type WalletContextValue = {
  address: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
};

type ConnectorType = "injected" | "walletconnect";

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connector, setConnector] = useState<ConnectorType | null>(null);
  const walletConnectRef = useRef<EthereumProvider | null>(null);

  async function getWalletConnectProvider() {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    if (!projectId || projectId === "replace_with_your_project_id") {
      throw new Error("WalletConnect is not configured.");
    }

    if (walletConnectRef.current) {
      return walletConnectRef.current;
    }

    const provider = await EthereumProvider.init({
      projectId,
      chains: [1],
      showQrModal: true,
    });

    walletConnectRef.current = provider;
    return provider;
  }

  async function connect() {
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      const ethereum = (window as any).ethereum;
      const source = ethereum ?? (await getWalletConnectProvider().then(async (wc) => {
        await wc.connect();
        return wc;
      }));

      setConnector(ethereum ? "injected" : "walletconnect");

      const provider = new ethers.BrowserProvider(source);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      setAddress(addr);
      toast.success("Wallet connected", {
        description: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please check your wallet permissions.";
      toast.error("Connection failed", {
        description: message,
      });
    } finally {
      setIsConnecting(false);
    }
  }

  function disconnect() {
    if (connector === "walletconnect") {
      const wcProvider = walletConnectRef.current;
      if (wcProvider?.disconnect) {
        void wcProvider.disconnect();
      }
    }
    setConnector(null);
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
