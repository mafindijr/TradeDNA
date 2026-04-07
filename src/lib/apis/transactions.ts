import { JsonRpcProvider } from "ethers";
import type { ChainConfig, NormalizedTransaction } from "./types";
import { fetchTokenPrices } from "./dexscreener"; // Used to estimate native value

export const DEFAULT_CHAINS: ChainConfig[] = [{ id: 1, name: "Ethereum" }];

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

export async function fetchWalletTransactions(
  address: string,
  chains: ChainConfig[] = DEFAULT_CHAINS
): Promise<Array<{ chain: ChainConfig; items: NormalizedTransaction[] }>> {
  const alchemyKey = getAlchemyApiKey();
  const infuraKey = getInfuraApiKey();

  if (!alchemyKey || !infuraKey) {
    throw new Error("Missing Alchemy or Infura API key");
  }

  const results = await Promise.all(
    chains.map(async (chain) => {
      const alchemyUrl = `https://${getAlchemyNetwork(chain.id)}.g.alchemy.com/v2/${alchemyKey}`;
      
      // 1. Fetch recent transactions for the address from Alchemy
      // We look for both from and to this address, so we do two paginated calls
      const getTransfers = async (isFrom: boolean) => {
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
              maxCount: "0x14", // top 20 transfers each
              order: "desc",
            },
          ],
        };

        const res = await fetch(alchemyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Alchemy request failed: ${res.statusText}`);
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return (data.result as AlchemyTransferResult).transfers;
      };

      const [fromTransfers, toTransfers] = await Promise.all([
        getTransfers(true),
        getTransfers(false),
      ]);

      const allTransfers = [...fromTransfers, ...toTransfers];
      
      // Collect unique transaction hashes
      const hashes = Array.from(new Set(allTransfers.map((t) => t.hash)));

      // 2. Fetch full transaction & receipt from Infura
      const infuraUrl = `https://${getInfuraNetwork(chain.id)}.infura.io/v3/${infuraKey}`;
      const provider = new JsonRpcProvider(infuraUrl);

      // Resolve these in smaller batches to avoid hitting RPC limits
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

              // We need the block timestamp
              let timestamp = new Date().toISOString();
              try {
                const block = await provider.getBlock(receipt.blockNumber);
                if (block) {
                  timestamp = new Date(block.timestamp * 1000).toISOString();
                }
              } catch (e) {
                console.warn("Failed to get block time for tx", hash);
              }

              return {
                hash: tx.hash,
                successful: receipt.status === 1,
                timestamp,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                valueUsd: null as number | null, // To be hydrated if native token is used
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

      // 3. Hydrate valueUsd by fetching ETH price from Dexscreener
      // We only strictly need ETH price if the user is making direct ETH transfers.
      // Wait, let's fetch the native token price (WETH for Ethereum)
      const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      const prices = await fetchTokenPrices([WETH_ADDRESS]);
      const nativePrice = prices[WETH_ADDRESS.toLowerCase()]?.priceUsd ?? 0;

      const hydratedItems = items.map((tx) => {
         const valueEth = Number(tx.value) / 1e18; // assuming 18 decimals for native
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
