import { prisma } from "../lib/prisma";
import { calculateDailyPnL } from "../lib/analytics/calculations";

async function main() {
  const userId = await prisma.user.findFirst().then((u) => u?.id);
  if (!userId) {
    console.log("No user found");
    return;
  }

  console.log("Fetching trades for user:", userId);
  const trades = await prisma.trade.findMany({
    where: {
      userId,
      status: "CLOSED",
    },
    orderBy: {
      exitDate: "asc",
    },
  });

  console.log("Found trades:", trades.length);

  const formattedTrades = trades.map((trade) => ({
    ...trade,
    exitDate: trade.exitDate?.toISOString(),
    pnl: trade.pnl ? parseFloat(trade.pnl.toString()) : 0,
    netPnl: trade.netPnl ? parseFloat(trade.netPnl.toString()) : undefined,
  }));

  const dailyPnL = calculateDailyPnL(formattedTrades as any);
  console.log("Daily P&L Data:", JSON.stringify(dailyPnL, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
