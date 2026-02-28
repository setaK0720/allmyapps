import { Hono } from 'hono';
import { db, positions } from '../db/index';
import { callEngineApi } from '../engine-client';

export const positionsRouter = new Hono();

positionsRouter.get('/', async (c) => {
  // Engine から最新ポジションを取得して DB と同期
  try {
    const status = await callEngineApi('/status', 'GET') as {
      running: boolean;
      equity: number;
      positions?: {
        ticket: number;
        symbol: string;
        order_type: string;
        lot: number;
        open_price: number;
        current_price: number;
        unrealized_pl: number;
        open_time: string;
        strategy_id: number | null;
      }[];
    };

    // Engine がポジション情報を返す場合は DB を同期
    if (status.positions && status.positions.length > 0) {
      for (const p of status.positions) {
        await db
          .insert(positions)
          .values({
            ticket: p.ticket,
            symbol: p.symbol,
            strategyId: p.strategy_id ?? null,
            orderType: p.order_type,
            lot: String(p.lot),
            openPrice: String(p.open_price),
            currentPrice: String(p.current_price),
            unrealizedPl: String(p.unrealized_pl),
            openTime: new Date(Number(p.open_time) * 1000), // Unix 秒 → ms
          })
          .onConflictDoUpdate({
            target: positions.ticket,
            set: {
              currentPrice: String(p.current_price),
              unrealizedPl: String(p.unrealized_pl),
              updatedAt: new Date(),
            },
          });
      }
    }
  } catch {
    // Engine が未起動の場合は DB の値をそのまま返す
  }

  const rows = await db.select().from(positions);
  return c.json(rows);
});
