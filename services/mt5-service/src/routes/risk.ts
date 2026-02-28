import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, riskConfig } from '../db/index';
import { callEngineApi } from '../engine-client';

export const riskRouter = new Hono();

riskRouter.get('/', async (c) => {
  const [row] = await db.select().from(riskConfig).limit(1);
  if (!row) {
    // 初期レコードを作成
    const [created] = await db.insert(riskConfig).values({ id: 1 }).returning();
    return c.json(created);
  }
  return c.json(row);
});

riskRouter.patch('/', async (c) => {
  const body = await c.req.json<Partial<{
    maxLotPerTrade: string;
    dailyLossLimit: string;
    maxOpenPositions: number;
    emergencyStop: boolean;
  }>>();

  // upsert
  const [row] = await db.insert(riskConfig)
    .values({ id: 1, ...body, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: riskConfig.id,
      set: { ...body, updatedAt: new Date() },
    })
    .returning();

  // Engine に設定再読み込みを通知
  try {
    await callEngineApi('/control/sync-config');
  } catch (_) {
    // Engine が未起動でも続行
  }

  return c.json(row);
});
