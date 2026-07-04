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

type InjectedProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  isOkxWallet?: boolean;
  isCoinbaseWallet?: boolean;
  providers?: InjectedProvider[];
};

// WalletConnect project IDs are public identifiers (not secrets).
// Keep a fallback so production doesn't break if NEXT_PUBLIC env is missing.
const WALLETCONNECT_PROJECT_ID_FALLBACK = "afb043c79383235760f0068dedd27d20";

function resolveWalletConnectProjectId() {
  const primary = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  const legacy = process.env.NEXT_PUBLIC_WALLETCONNECTPROJECT_ID;
  const candidate = primary || legacy;
  if (!candidate || candidate === "replace_with_your_project_id") {
    return WALLETCONNECT_PROJECT_ID_FALLBACK;
  }
  return candidate;
}

function getFriendlyConnectError(error: unknown, usedWalletConnect: boolean) {
  const rawMessage =
    error instanceof Error ? error.message : "Please check your wallet permissions.";
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("user rejected") ||
    normalized.includes("rejected the request") ||
    normalized.includes("request rejected")
  ) {
    return "Connection request was rejected in your wallet app.";
  }

  if (usedWalletConnect) {
    if (
      normalized.includes("walletconnect is not configured") ||
      normalized.includes("project id")
    ) {
      return "Wallet link is temporarily unavailable. Please try again in a moment.";
    }

    if (
      normalized.includes("no matching key") ||
      normalized.includes("pairing") ||
      normalized.includes("session")
    ) {
      return "Your wallet session expired. Reopen your wallet app and connect again.";
    }

    return "We could not connect to your wallet right now. Please retry.";
  }

  return rawMessage;
}

function getInjectedProviders() {
  const globalWindow = window as Window & {
    ethereum?: InjectedProvider;
    okxwallet?: InjectedProvider;
  };

  const providers: InjectedProvider[] = [];

  const addProvider = (provider: InjectedProvider | undefined) => {
    if (!provider?.request) return;
    const alreadyAdded = providers.some((item) => item === provider);
    if (!alreadyAdded) {
      providers.push(provider);
    }
  };

  addProvider(globalWindow.ethereum);

  const nestedProviders = globalWindow.ethereum?.providers ?? [];
  nestedProviders.forEach((provider) => addProvider(provider));
  addProvider(globalWindow.okxwallet);

  return providers;
}

function getPreferredInjectedProvider() {
  const candidates = getInjectedProviders();

  return (
    candidates.find((provider) => provider.isOkxWallet) ??
    candidates.find((provider) => provider.isMetaMask) ??
    candidates.find((provider) => provider.isCoinbaseWallet) ??
    candidates[0] ??
    null
  );
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connector, setConnector] = useState<ConnectorType | null>(null);
  const walletConnectRef = useRef<EthereumProvider | null>(null);

  async function getWalletConnectProvider() {
    const projectId = resolveWalletConnectProjectId();

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
      const injectedProvider = getPreferredInjectedProvider();
      const shouldUseInjected = Boolean(injectedProvider);

      const source = shouldUseInjected
        ? injectedProvider
        : await getWalletConnectProvider().then(async (wc) => {
            await wc.connect();
            return wc;
          });

      setConnector(shouldUseInjected ? "injected" : "walletconnect");

      const provider = new ethers.BrowserProvider(source as any);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      setAddress(addr);
      toast.success("Wallet connected", {
        description: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
      });
    } catch (error) {
      const injectedProvider = getPreferredInjectedProvider();
      const usedWalletConnect = !injectedProvider;
      const message = getFriendlyConnectError(error, usedWalletConnect);
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
