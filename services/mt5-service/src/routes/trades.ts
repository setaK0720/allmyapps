import { Hono } from 'hono';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db, trades, strategyConfigs } from '../db/index';

export const tradesRouter = new Hono();

tradesRouter.get('/', async (c) => {
  const { from, to, symbol, strategy_id } = c.req.query();
  const conditions = [];

  if (from) conditions.push(gte(trades.openTime, new Date(from)));
  if (to) {
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1); // 翌日0時未満 = その日の終わりまで含む
    conditions.push(lte(trades.openTime, toDate));
  }
  if (symbol) conditions.push(eq(trades.symbol, symbol));
  if (strategy_id) conditions.push(eq(trades.strategyId, parseInt(strategy_id, 10)));

  const rows = await db.select()
    .from(trades)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(trades.openTime))
    .limit(500);

  return c.json(rows);
});

tradesRouter.get('/stats', async (c) => {
  // 日次 P&L（過去 30 日）
  const dailyPl = await db.execute(sql`
    SELECT
      DATE(close_time AT TIME ZONE 'UTC') AS date,
      SUM(profit::numeric) AS profit,
      COUNT(*) AS trade_count
    FROM trades
    WHERE status = 'closed'
      AND close_time >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(close_time AT TIME ZONE 'UTC')
    ORDER BY date
  `);

  // 月次 P&L（過去 12 ヶ月）
  const monthlyPl = await db.execute(sql`
    SELECT
      TO_CHAR(close_time AT TIME ZONE 'UTC', 'YYYY-MM') AS month,
      SUM(profit::numeric) AS profit,
      COUNT(*) AS trade_count
    FROM trades
    WHERE status = 'closed'
      AND close_time >= NOW() - INTERVAL '12 months'
    GROUP BY TO_CHAR(close_time AT TIME ZONE 'UTC', 'YYYY-MM')
    ORDER BY month
  `);

  // 戦略別 P&L
  const strategyPl = await db.execute(sql`
    SELECT
      t.strategy_id,
      sc.strategy_type,
      sc.symbol,
      SUM(t.profit::numeric) AS profit,
      COUNT(*) AS trade_count,
      SUM(CASE WHEN t.profit::numeric > 0 THEN 1 ELSE 0 END) AS winning_trades
    FROM trades t
    LEFT JOIN strategy_configs sc ON sc.id = t.strategy_id
    WHERE t.status = 'closed'
    GROUP BY t.strategy_id, sc.strategy_type, sc.symbol
  `);

  return c.json({
    daily: dailyPl.rows,
    monthly: monthlyPl.rows,
    byStrategy: strategyPl.rows,
  });
});
