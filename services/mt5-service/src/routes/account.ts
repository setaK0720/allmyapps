import { Hono } from 'hono';
import { callEngineApi } from '../engine-client';

export const accountRouter = new Hono();

accountRouter.get('/', async (c) => {
  try {
    const status = await callEngineApi('/status', 'GET') as {
      running: boolean;
      equity: number;
      balance: number;
      strategies: { id: number; symbol: string; running: boolean }[];
    };
    return c.json({
      running: status.running,
      equity: status.equity,
      balance: status.balance,
      currency: (status as { currency?: string }).currency ?? 'USD',
      activeStrategies: status.strategies.filter(s => s.running).length,
    });
  } catch {
    return c.json({ running: false, equity: 0, balance: 0, activeStrategies: 0 });
  }
});
