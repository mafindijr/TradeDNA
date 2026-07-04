import { JsonRpcProvider } from "ethers";
import type { ChainConfig, NormalizedTransaction } from "./types";
import { fetchTokenPrices } from "./dexscreener"; // Used to estimate native value

export const DEFAULT_CHAINS: ChainConfig[] = [{ id: 1, name: "Ethereum" }];

const ALCHEMY_TRANSFER_CACHE_TTL_MS = 60_000;
const ALCHEMY_TRANSFER_CACHE = new Map<
  string,
  { expiresAt: number; transfers: AlchemyTransferResult["transfers"] }
>();

function getAlchemyApiKey() {
  return process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? "";
}

function getInfuraApiKey() {
  return process.env.NEXT_PUBLIC_INFURA_API_KEY ?? "";
}

// Map chain id to Alchemy network name string
function getAlchemyNetwork(chainId: number) {
  switch (chainId) {
    case 1:
      return "eth-mainnet";
    // We can add others later, e.g. 137: "polygon-mainnet"
    default:
      return "eth-mainnet";
  }
}

// Map chain id to Infura network name string
function getInfuraNetwork(chainId: number) {
  switch (chainId) {
    case 1:
      return "mainnet";
    // Add others later
    default:
      return "mainnet";
  }
}

type AlchemyTransferResult = {
  transfers: {
    blockNum: string;
    uniqueId: string;
    hash: string;
    from: string;
    to: string;
    value: number | null;
    erc721TokenId: string | null;
    erc1155Metadata: unknown | null;
    tokenId: string | null;
    asset: string | null;
    category: string;
    rawContract: {
      value: string;
      address: string | null;
      decimal: string;
    };
  }[];
};

function isAlchemyRateLimitError(status: number, message: string) {
  const normalizedMessage = message.toLowerCase();

  return (
    status === 429 ||
    status === 408 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests") ||
    normalizedMessage.includes("temporarily unavailable") ||
    normalizedMessage.includes("exceeded")
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWalletTransactions(
  address: string,
  chains: ChainConfig[] = DEFAULT_CHAINS
): Promise<Array<{ chain: ChainConfig; items: NormalizedTransaction[] }>> {
  const alchemyKey = getAlchemyApiKey();
  const infuraKey = getInfuraApiKey();

  if (!alchemyKey) {
    console.warn("Alchemy API key missing; skipping transaction fetch.");
  }

  if (!infuraKey) {
    console.warn("Infura API key missing; skipping transaction enrichment.");
  }

  const results = await Promise.all(
    chains.map(async (chain) => {
      if (!alchemyKey) {
        return { chain, items: [] };
      }

      const alchemyUrl = `https://${getAlchemyNetwork(chain.id)}.g.alchemy.com/v2/${alchemyKey}`;

      // 1. Fetch recent transactions for the address from Alchemy.
      // We look for both incoming and outgoing activity, so we do two lightweight calls.
      const getTransfers = async (isFrom: boolean) => {
        const cacheKey = `${chain.id}:${address}:${isFrom ? "from" : "to"}`;
        const cached = ALCHEMY_TRANSFER_CACHE.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.transfers;
        }

        const body = {
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getAssetTransfers",
          params: [
            {
              fromBlock: "0x0",
              toBlock: "latest",
              [isFrom ? "fromAddress" : "toAddress"]: address,
              category: ["erc20", "external"],
              maxCount: "0x0A",
              order: "desc",
            },
          ],
        };

        for (let attempt = 0; attempt < 3; attempt += 1) {
          const res = await fetch(alchemyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
          });

          if (!res.ok) {
            const message = `${res.status} ${res.statusText}`;
            if (isAlchemyRateLimitError(res.status, message)) {
              if (attempt < 2) {
                await delay(500 * (attempt + 1));
                continue;
              }

              console.warn(`Alchemy rate limit hit for ${cacheKey}; returning no transfers.`);
              return [];
            }

            console.warn(`Alchemy request failed for ${cacheKey}: ${message}`);
            return [];
          }

          const data = await res.json();
          if (data?.error) {
            const message = data.error?.message ?? "Alchemy request failed";
            if (isAlchemyRateLimitError(res.status, message)) {
              if (attempt < 2) {
                await delay(500 * (attempt + 1));
                continue;
              }

              console.warn(`Alchemy rate limit hit for ${cacheKey}; returning no transfers.`);
              return [];
            }

            console.warn(`Alchemy request failed for ${cacheKey}: ${message}`);
            return [];
          }

          const transfers = ((data.result as AlchemyTransferResult)?.transfers ?? []) as AlchemyTransferResult["transfers"];
          ALCHEMY_TRANSFER_CACHE.set(cacheKey, {
            expiresAt: Date.now() + ALCHEMY_TRANSFER_CACHE_TTL_MS,
            transfers,
          });

          return transfers;
        }

        return [];
      };

      const [fromTransfers, toTransfers] = await Promise.all([
        getTransfers(true),
        getTransfers(false),
      ]);

      const allTransfers = [...fromTransfers, ...toTransfers];

      // Collect unique transaction hashes.
      const hashes = Array.from(new Set(allTransfers.map((t) => t.hash)));

      if (hashes.length === 0 || !infuraKey) {
        return { chain, items: [] };
      }

      // 2. Fetch full transaction & receipt from Infura.
      const infuraUrl = `https://${getInfuraNetwork(chain.id)}.infura.io/v3/${infuraKey}`;
      const provider = new JsonRpcProvider(infuraUrl);

      // Resolve these in smaller batches to avoid hitting RPC limits.
      const items: NormalizedTransaction[] = [];
      const BATCH_SIZE = 5;

      for (let i = 0; i < hashes.length; i += BATCH_SIZE) {
        const batch = hashes.slice(i, i + BATCH_SIZE);

        const batchResults: (NormalizedTransaction | null)[] = await Promise.all(
          batch.map(async (hash) => {
            try {
              const [tx, receipt] = await Promise.all([
                provider.getTransaction(hash),
                provider.getTransactionReceipt(hash),
              ]);

              if (!tx || !receipt) return null;

              // We need the block timestamp.
              let timestamp = new Date().toISOString();
              try {
                const block = await provider.getBlock(receipt.blockNumber);
                if (block) {
                  timestamp = new Date(block.timestamp * 1000).toISOString();
                }
              } catch (error) {
                console.warn("Failed to get block time for tx", hash, error);
              }

              return {
                hash: tx.hash,
                successful: receipt.status === 1,
                timestamp,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                valueUsd: null as number | null,
                logs: receipt.logs.map((log) => ({
                  transactionHash: log.transactionHash,
                  blockHash: log.blockHash,
                  blockNumber: log.blockNumber,
                  transactionIndex: log.transactionIndex,
                  address: log.address,
                  data: log.data,
                  topics: [...log.topics],
                  index: log.index,
                  removed: log.removed,
                })),
              };
            } catch (error) {
              console.error(`Failed to fetch tx ${hash} from Infura`, error);
              return null;
            }
          })
        );

        const validResults = batchResults.filter((tx): tx is NormalizedTransaction => tx !== null);
        items.push(...validResults);
      }

      if (items.length === 0) {
        return { chain, items: [] };
      }

      // 3. Hydrate valueUsd by fetching ETH price from Dexscreener.
      // We only need this when there are native transfers to value.
      const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      const prices = await fetchTokenPrices([WETH_ADDRESS]);
      const nativePrice = prices[WETH_ADDRESS.toLowerCase()]?.priceUsd ?? 0;

      const hydratedItems = items.map((tx) => {
        const valueEth = Number(tx.value) / 1e18;
        return {
          ...tx,
          valueUsd: valueEth * nativePrice,
        };
      });

      return {
        chain,
        items: hydratedItems.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
      };
    })
  );

  return results;
}
