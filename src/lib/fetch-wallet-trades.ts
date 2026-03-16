export async function fetchWalletTrades(address: string) {
  const res = await fetch(
    `https://api.covalenthq.com/v1/1/address/${address}/transactions_v2/?key=YOUR_API_KEY`
  );

  const data = await res.json();

  return data.data.items;
}
