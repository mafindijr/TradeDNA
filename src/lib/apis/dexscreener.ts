export type DexScreenerPair = {
  priceUsd?: string;
  liquidity?: {
    usd?: number;
  };
  baseToken?: {
    address?: string;
    symbol?: string;
  };
};

export type DexScreenerResponse = {
  pairs?: DexScreenerPair[];
};

function getApiKey() {
  return process.env.NEXT_PUBLIC_DEXSCREENER_API_KEY ?? "";
}

function pickBestPair(pairs: DexScreenerPair[]) {
  return [...pairs].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
}

export async function fetchTokenPrices(tokenAddresses: string[]) {
  const apiKey = getApiKey();
  const headers = apiKey ? { "x-api-key": apiKey } : undefined;
  const unique = Array.from(new Set(tokenAddresses.filter(Boolean)));

  const results = await Promise.all(
    unique.map(async (address) => {
      const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
      const res = await fetch(url, { headers, cache: "no-store" });

      if (!res.ok) {
        return { address, priceUsd: 0, symbol: undefined };
      }

      const data = (await res.json()) as DexScreenerResponse;
      const pair = data.pairs ? pickBestPair(data.pairs) : undefined;
      const priceUsd = pair?.priceUsd ? Number(pair.priceUsd) : 0;

      return {
        address,
        priceUsd: Number.isFinite(priceUsd) ? priceUsd : 0,
        symbol: pair?.baseToken?.symbol,
      };
    })
  );

  return results.reduce<Record<string, { priceUsd: number; symbol?: string }>>(
    (acc, item) => {
      acc[item.address.toLowerCase()] = {
        priceUsd: item.priceUsd,
        symbol: item.symbol,
      };
      return acc;
    },
    {}
  );
}
