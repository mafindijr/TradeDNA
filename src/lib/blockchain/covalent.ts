import type { ChainConfig, CovalentResponse, CovalentTransaction } from "./types";

const DEFAULT_CHAINS: ChainConfig[] = [
  { id: 1, name: "Ethereum" },
];

function getApiKey() {
  return process.env.NEXT_PUBLIC_COVALENT_API_KEY ?? "";
}

export async function fetchWalletTransactions(
  address: string,
  chains: ChainConfig[] = DEFAULT_CHAINS
): Promise<Array<{ chain: ChainConfig; items: CovalentTransaction[] }>> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("Missing Covalent API key");
  }

  const results = await Promise.all(
    chains.map(async (chain) => {
      const url = `https://api.covalenthq.com/v1/${chain.id}/address/${address}/transactions_v2/?key=${apiKey}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Covalent request failed (${chain.name})`);
      }

      const data = (await res.json()) as CovalentResponse<CovalentTransaction>;
      return {
        chain,
        items: data.data.items ?? [],
      };
    })
  );

  return results;
}

export { DEFAULT_CHAINS };
