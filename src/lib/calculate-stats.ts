export function calculateStats(trades: any[]) {
  const totalTrades = trades.length;
  let profit = 0;
  let wins = 0;

  trades.forEach((tx) => {
    const value = tx.value_quote || 0;

    if (value > 0) {
      profit += value;
      wins++;
    } else {
      profit -= Math.abs(value);
    }
  });

  const winRate = totalTrades === 0 ? 0 : (wins / totalTrades) * 100;

  return {
    totalTrades,
    profit,
    winRate,
  };
}
