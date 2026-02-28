import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, riskConfig } from '../db/index';
import { callEngineApi } from '../engine-client';

export const controlRouter = new Hono();

controlRouter.post('/emergency-stop', async (c) => {
  // 1. DB の emergency_stop フラグを ON
  await db.insert(riskConfig)
    .values({ id: 1, emergencyStop: true, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: riskConfig.id,
      set: { emergencyStop: true, updatedAt: new Date() },
    });

  // 2. Engine に全決済命令
  try {
    const result = await callEngineApi('/control/close-all') as Record<string, unknown>;
    return c.json({ ok: true, result });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});

controlRouter.post('/pause', async (c) => {
  try {
    await callEngineApi('/control/pause');
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});

controlRouter.post('/resume', async (c) => {
  // emergency_stop フラグも解除
  await db.insert(riskConfig)
    .values({ id: 1, emergencyStop: false, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: riskConfig.id,
      set: { emergencyStop: false, updatedAt: new Date() },
    });
  try {
    await callEngineApi('/control/resume');
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});

controlRouter.post('/close-position', async (c) => {
  const body = await c.req.json<{ ticket: number }>();
  try {
    const result = await callEngineApi('/control/close-position', 'POST', { ticket: body.ticket });
    return c.json(result);
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});
