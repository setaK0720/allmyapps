import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { connectToEngine } from './engine-client';
import { startRiskMonitor } from './risk-monitor';
import { strategiesRouter } from './routes/strategies';
import { riskRouter } from './routes/risk';
import { controlRouter } from './routes/control';
import { tradesRouter } from './routes/trades';
import { streamRouter } from './routes/stream';
import { positionsRouter } from './routes/positions';
import { accountRouter } from './routes/account';

const app = new Hono();

app.use('*', cors());
app.use('*', logger());

app.get('/health', (c) => c.json({ ok: true }));

app.route('/api/strategies', strategiesRouter);
app.route('/api/risk-config', riskRouter);
app.route('/api/control', controlRouter);
app.route('/api/trades', tradesRouter);
app.route('/api/stream', streamRouter);
app.route('/api/positions', positionsRouter);
app.route('/api/account', accountRouter);

// Python Engine との接続を開始
connectToEngine();
startRiskMonitor();

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
console.log(`mt5-service listening on port ${PORT}`);

export default {
  port: PORT,
  hostname: '0.0.0.0',
  fetch: app.fetch,
};
