import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, strategyConfigs } from '../db/index';
import { callEngineApi } from '../engine-client';

export const strategiesRouter = new Hono();

strategiesRouter.get('/', async (c) => {
  const rows = await db.select().from(strategyConfigs).orderBy(strategyConfigs.id);
  return c.json(rows);
});

strategiesRouter.post('/', async (c) => {
  const body = await c.req.json<{
    symbol: string;
    timeframe: string;
    strategyType: string;
    params?: Record<string, unknown>;
    enabled?: boolean;
  }>();
  const [row] = await db.insert(strategyConfigs).values({
    symbol: body.symbol,
    timeframe: body.timeframe,
    strategyType: body.strategyType,
    params: body.params ?? {},
    enabled: body.enabled ?? false,
  }).returning();
  return c.json(row, 201);
});

strategiesRouter.patch('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json<Partial<{
    symbol: string;
    timeframe: string;
    strategyType: string;
    params: Record<string, unknown>;
    enabled: boolean;
  }>>();

  const [row] = await db.update(strategyConfigs)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(strategyConfigs.id, id))
    .returning();

  if (!row) return c.json({ error: 'Not found' }, 404);

  // Engine に設定再読み込みを通知
  try {
    await callEngineApi('/control/sync-config');
  } catch (_) {
    // Engine が未起動でも続行
  }

  return c.json(row);
});

strategiesRouter.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const [row] = await db.delete(strategyConfigs)
    .where(eq(strategyConfigs.id, id))
    .returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});
